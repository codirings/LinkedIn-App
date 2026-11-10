// The state of one member relative to the signed-in user. Derived only from the
// connections and blocks collections, so every device computes the same answer.

export const RELATION = {
  NONE: 'none', // no link: can send a request
  OUTGOING: 'outgoing', // I sent a pending request
  INCOMING: 'incoming', // they sent me a pending request
  CONNECTED: 'connected',
  BLOCKED: 'blocked', // I blocked them
  UNAVAILABLE: 'unavailable', // they blocked me: hidden from lists and search
} as const;

export type Relation = (typeof RELATION)[keyof typeof RELATION];

export type Link = {from?: string; to?: string; status?: string};

export type RelationInputs = {
  me: string;
  links: Map<string, Link>; // keyed by the other member's uid
  blockedByMe: Set<string>;
  blockedMe: Set<string>;
};

export function relationshipOf(otherId: string, input: RelationInputs): Relation {
  if (input.blockedByMe.has(otherId)) return RELATION.BLOCKED;
  if (input.blockedMe.has(otherId)) return RELATION.UNAVAILABLE;
  const link = input.links.get(otherId);
  if (!link) return RELATION.NONE;
  if (link.status === 'accepted') return RELATION.CONNECTED;
  return link.from === input.me ? RELATION.OUTGOING : RELATION.INCOMING;
}

// Members hidden from search, suggestions, conversations and posts in either direction.
export function isHidden(relation: Relation): boolean {
  return relation === RELATION.BLOCKED || relation === RELATION.UNAVAILABLE;
}
