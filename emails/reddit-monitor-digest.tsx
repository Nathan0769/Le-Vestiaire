import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface RedditDigestEmailProps {
  matches: Array<{
    id: string;
    title: string;
    selftext: string;
    subreddit: string;
    permalink: string;
    score: number;
    numComments: number;
    matchedKeywords: string[];
    author: string;
  }>;
  date: string;
}

export function RedditDigestEmail({ matches, date }: RedditDigestEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`${matches.length} thread(s) Reddit à checker`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reddit Monitor</Heading>
          <Text style={subheading}>{date}</Text>

          {matches.length === 0 ? (
            <Section style={section}>
              <Text style={text}>Aucun thread pertinent aujourd&apos;hui.</Text>
            </Section>
          ) : (
            matches.map((m) => (
              <Section key={m.id} style={threadSection}>
                <Text style={meta}>
                  {`r/${m.subreddit} · ${m.score} upvotes · ${m.numComments} comments · u/${m.author}`}
                </Text>
                <Link href={`https://reddit.com${m.permalink}`} style={titleLink}>
                  {m.title}
                </Link>
                {m.selftext.length > 0 && (
                  <Text style={excerpt}>
                    {m.selftext.length > 240 ? `${m.selftext.slice(0, 240)}…` : m.selftext}
                  </Text>
                )}
                <Text style={keywords}>
                  Mots-clés : {m.matchedKeywords.join(", ")}
                </Text>
                <Hr style={hr} />
              </Section>
            ))
          )}

          <Text style={footer}>
            Digest quotidien du Reddit Monitor. Modifier les mots-clés dans
            lib/reddit-monitor.ts.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default RedditDigestEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "640px",
  borderRadius: "8px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 4px",
};

const subheading: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 24px",
};

const section: React.CSSProperties = {
  marginBottom: "16px",
};

const threadSection: React.CSSProperties = {
  marginBottom: "8px",
};

const text: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 12px",
};

const meta: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0 0 6px",
};

const titleLink: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  textDecoration: "none",
  lineHeight: "22px",
};

const excerpt: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4b5563",
  margin: "8px 0 8px",
};

const keywords: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "4px 0 0",
  fontStyle: "italic",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "16px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#9ca3af",
  marginTop: "24px",
};
