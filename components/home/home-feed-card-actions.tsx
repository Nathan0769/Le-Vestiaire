"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PostActions } from "@/components/feed/post-actions";
import type { FeedPostItem } from "@/types/feed";

// Drawer commentaires charge a la demande (au clic), hors bundle initial homepage.
const PostCommentsDrawer = dynamic(
  () =>
    import("@/components/feed/post-comments-drawer").then(
      (m) => m.PostCommentsDrawer
    ),
  { ssr: false }
);

/**
 * Ilot client des actions d'une carte feed sur la homepage : like + commentaire.
 * Reutilise PostActions ; le drawer commentaires reste lazy.
 */
export function HomeFeedCardActions({ post }: { post: FeedPostItem }) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div className="px-3 pb-2 pt-1 border-t border-border">
      <PostActions post={post} onCommentClick={() => setCommentsOpen(true)} />
      {commentsOpen && (
        <PostCommentsDrawer
          post={post}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
}
