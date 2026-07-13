import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const SUBREDDITS = [
  "soccerjerseys",
  "footballshirts",
  "classicfootballshirts",
  "ligue1",
] as const;

const KEYWORDS = [
  // EN
  "track my collection",
  "organize my jerseys",
  "app for jerseys",
  "app to track",
  "jersey app",
  "spreadsheet collection",
  "catalog my shirts",
  "database jerseys",
  "how do you organize",
  "how do you track",
  "collection management",
  "inventory shirts",
  "manage my collection",
  // FR
  "gérer ma collection",
  "suivre ma collection",
  "app maillot",
  "application maillot",
  "répertorier maillot",
  "cataloguer maillot",
  "tableur maillots",
  "excel maillots",
  "organiser ma collection",
  "base de données maillots",
] as const;

const MAX_MATCHES = 10;
const DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60;

interface RedditListingChild {
  data: {
    id: string;
    title: string;
    selftext: string;
    subreddit: string;
    permalink: string;
    score: number;
    num_comments: number;
    created_utc: number;
    author: string;
  };
}

interface RedditListing {
  data: {
    children: RedditListingChild[];
  };
}

export interface MatchedPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  permalink: string;
  score: number;
  numComments: number;
  createdUtc: number;
  author: string;
  matchedKeywords: string[];
}

async function fetchSubreddit(sub: string): Promise<RedditListingChild["data"][]> {
  const res = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=100`, {
    headers: {
      "User-Agent": "web:le-vestiaire-monitor:1.0.0 (by /u/le-vestiaire)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Reddit fetch failed for r/${sub}: ${res.status}`);
    return [];
  }

  const data = (await res.json()) as RedditListing;
  return data.data.children.map((c) => c.data);
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function matchKeywords(title: string, body: string): string[] {
  const haystack = stripAccents(`${title} ${body}`.toLowerCase());
  return KEYWORDS.filter((kw) => haystack.includes(stripAccents(kw.toLowerCase())));
}

async function isSeen(postId: string): Promise<boolean> {
  const exists = await redis.exists(`reddit-monitor:seen:${postId}`);
  return exists === 1;
}

async function markSeen(postId: string): Promise<void> {
  await redis.set(`reddit-monitor:seen:${postId}`, "1", { ex: DEDUPE_TTL_SECONDS });
}

export async function scanReddit(): Promise<MatchedPost[]> {
  const results = await Promise.all(SUBREDDITS.map(fetchSubreddit));
  const allPosts = results.flat();

  const matches: MatchedPost[] = [];

  for (const post of allPosts) {
    const kws = matchKeywords(post.title, post.selftext);
    if (kws.length === 0) continue;
    if (await isSeen(post.id)) continue;

    matches.push({
      id: post.id,
      title: post.title,
      selftext: post.selftext,
      subreddit: post.subreddit,
      permalink: post.permalink,
      score: post.score,
      numComments: post.num_comments,
      createdUtc: post.created_utc,
      author: post.author,
      matchedKeywords: kws,
    });

    await markSeen(post.id);
  }

  matches.sort((a, b) => {
    if (b.matchedKeywords.length !== a.matchedKeywords.length) {
      return b.matchedKeywords.length - a.matchedKeywords.length;
    }
    return b.score - a.score;
  });

  return matches.slice(0, MAX_MATCHES);
}
