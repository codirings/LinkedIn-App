import {RELATION, isHidden, relationshipOf, type Link} from '../src/utils/relationship';

const ME = 'me';
const build = (links: Record<string, Link>, blockedByMe: string[] = [], blockedMe: string[] = []) => ({
  me: ME,
  links: new Map(Object.entries(links)),
  blockedByMe: new Set(blockedByMe),
  blockedMe: new Set(blockedMe),
});

describe('relationshipOf', () => {
  it('is NONE when there is no connection document', () => {
    expect(relationshipOf('x', build({}))).toBe(RELATION.NONE);
  });

  it('is OUTGOING for a pending request I sent and INCOMING for one I received', () => {
    expect(relationshipOf('x', build({x: {from: ME, to: 'x', status: 'pending'}}))).toBe(RELATION.OUTGOING);
    expect(relationshipOf('x', build({x: {from: 'x', to: ME, status: 'pending'}}))).toBe(RELATION.INCOMING);
  });

  it('is CONNECTED once accepted, whichever side sent the request', () => {
    expect(relationshipOf('x', build({x: {from: 'x', to: ME, status: 'accepted'}}))).toBe(RELATION.CONNECTED);
    expect(relationshipOf('x', build({x: {from: ME, to: 'x', status: 'accepted'}}))).toBe(RELATION.CONNECTED);
  });

  it('shows BLOCKED for a member I blocked, even if a stale link remains', () => {
    expect(relationshipOf('x', build({x: {from: ME, to: 'x', status: 'accepted'}}, ['x']))).toBe(RELATION.BLOCKED);
  });

  it('shows UNAVAILABLE when the other member blocked me', () => {
    expect(relationshipOf('x', build({}, [], ['x']))).toBe(RELATION.UNAVAILABLE);
    expect(isHidden(RELATION.UNAVAILABLE)).toBe(true);
    expect(isHidden(RELATION.BLOCKED)).toBe(true);
    expect(isHidden(RELATION.INCOMING)).toBe(false);
  });
});
