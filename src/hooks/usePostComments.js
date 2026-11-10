import { useEffect, useState } from 'react';
import { subscribeComments } from '../services/social';
import { toMillis } from '../utils/jobs';

// Live comments for one post (posts/{id}/comments), newest last.
export function usePostComments(postId, userId) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!postId) return undefined;
    return subscribeComments(
      postId,
      (docs) => setItems(docs.map((d) => ({
        id: d.id,
        authorId: d.authorId,
        author: d.authorName || 'Member',
        avatar: d.authorPhotoUrl || null,
        text: d.text || '',
        ts: toMillis(d.createdAt, Date.now()),
        mine: d.authorId === userId,
      }))),
      () => {},
    );
  }, [postId, userId]);
  return items;
}
