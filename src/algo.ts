import type { Edge, User } from './types';

export type Matrix = number[][];

export const PALETTE = ['#8F244B', '#D1688A', '#C98A3E', '#7B5EA7', '#3F8F8A', '#B5543C', '#5C7AA8'];
export const ISOLATED_COLOR = '#A89AA0';

/* ------------------------------------------------------------------ */
/* Graph representation                                                */
/* ------------------------------------------------------------------ */

/** A[i][j] = 1 if a directed edge i -> j exists, else 0. */
export function buildAdjacency(ids: string[], edges: Edge[]): Matrix {
  const idx = new Map(ids.map((id, i) => [id, i] as [string, number]));
  const A: Matrix = ids.map(() => ids.map(() => 0));
  for (const [f, t] of edges) {
    const i = idx.get(f);
    const j = idx.get(t);
    if (i === undefined || j === undefined || i === j) continue;
    A[i][j] = 1;
  }
  return A;
}

export const copyMatrix = (m: Matrix): Matrix => m.map((r) => [...r]);

/* ------------------------------------------------------------------ */
/* Warshall's algorithm (transitive closure) — O(V^3) time, O(V^2) space */
/* ------------------------------------------------------------------ */

export function warshall(A: Matrix): Matrix {
  const n = A.length;
  const R = copyMatrix(A);
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // R(k)[i][j] = R(k-1)[i][j] OR ( R(k-1)[i][k] AND R(k-1)[k][j] )
        R[i][j] = R[i][j] | (R[i][k] & R[k][j]);
      }
    }
  }
  return R;
}

export interface WarshallStep {
  /** Intermediate vertex just processed (-1 for the initial matrix R0 = A). */
  k: number;
  matrix: Matrix;
  /** Cells that flipped 0 -> 1 during this step. */
  changed: [number, number][];
}

/** Same three loops as warshall(), but records a snapshot after every k. */
export function warshallSteps(A: Matrix): WarshallStep[] {
  const n = A.length;
  const R = copyMatrix(A);
  const steps: WarshallStep[] = [{ k: -1, matrix: copyMatrix(R), changed: [] }];
  for (let k = 0; k < n; k++) {
    const changed: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!R[i][j] && R[i][k] && R[k][j]) {
          R[i][j] = 1;
          changed.push([i, j]);
        }
      }
    }
    steps.push({ k, matrix: copyMatrix(R), changed });
  }
  return steps;
}

/* ------------------------------------------------------------------ */
/* Neighbour sets, mutual friends, paths                                */
/* ------------------------------------------------------------------ */

/** Direct connections of each vertex (an edge in either direction counts). */
export function neighborSets(A: Matrix): Set<number>[] {
  const n = A.length;
  return A.map((_, i) => {
    const s = new Set<number>();
    for (let j = 0; j < n; j++) if (j !== i && (A[i][j] || A[j][i])) s.add(j);
    return s;
  });
}

/** Users directly connected to both a and b (excluding a and b). */
export function mutualFriends(nb: Set<number>[], a: number, b: number): number[] {
  const out: number[] = [];
  for (const x of nb[a]) if (x !== a && x !== b && nb[b].has(x)) out.push(x);
  return out.sort((p, q) => p - q);
}

export function distancesFrom(A: Matrix, s: number): number[] {
  const n = A.length;
  const dist = Array(n).fill(-1);
  dist[s] = 0;
  const q = [s];
  while (q.length) {
    const u = q.shift()!;
    for (let v = 0; v < n; v++) {
      if (A[u][v] && dist[v] === -1) {
        dist[v] = dist[u] + 1;
        q.push(v);
      }
    }
  }
  return dist;
}

/** Shortest directed path s -> t (inclusive), or null. */
export function bfsPath(A: Matrix, s: number, t: number): number[] | null {
  if (s === t) return [s];
  const n = A.length;
  const prev = Array(n).fill(-1);
  const seen = Array(n).fill(false);
  seen[s] = true;
  const q = [s];
  while (q.length) {
    const u = q.shift()!;
    for (let v = 0; v < n; v++) {
      if (A[u][v] && !seen[v]) {
        seen[v] = true;
        prev[v] = u;
        if (v === t) {
          const path = [t];
          let c = t;
          while (prev[c] !== -1) {
            c = prev[c];
            path.unshift(c);
          }
          return path;
        }
        q.push(v);
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Components (derived from reachability) and community detection       */
/* ------------------------------------------------------------------ */

/** Weakly connected components: ignore edge direction (union-find over A). */
export function weakComponents(A: Matrix): number[][] {
  const n = A.length;
  const parent = [...Array(n).keys()];
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (A[i][j]) parent[find(i)] = find(j);
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    groups.set(r, [...(groups.get(r) || []), i]);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length || a[0] - b[0]);
}

/** Strongly connected components from the closure: i ~ j iff R[i][j] and R[j][i]. */
export function strongComponents(R: Matrix): number[][] {
  const n = R.length;
  const assigned = Array(n).fill(false);
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (assigned[i]) continue;
    const comp = [i];
    assigned[i] = true;
    for (let j = i + 1; j < n; j++) {
      if (!assigned[j] && R[i][j] && R[j][i]) {
        comp.push(j);
        assigned[j] = true;
      }
    }
    out.push(comp);
  }
  return out.sort((a, b) => b.length - a.length || a[0] - b[0]);
}

/** Deterministic asynchronous label propagation. */
export function labelPropagation(nb: Set<number>[]): number[] {
  const n = nb.length;
  const lab = [...Array(n).keys()];
  for (let it = 0; it < 30; it++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (nb[i].size === 0) continue;
      const cnt = new Map<number, number>();
      for (const j of nb[i]) cnt.set(lab[j], (cnt.get(lab[j]) || 0) + 1);
      let best = lab[i];
      let bc = -1;
      for (const [l, c] of [...cnt].sort((a, b) => a[0] - b[0])) {
        if (c > bc) {
          bc = c;
          best = l;
        }
      }
      if (best !== lab[i]) {
        lab[i] = best;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return lab;
}

/* ------------------------------------------------------------------ */
/* Full analysis of a network                                           */
/* ------------------------------------------------------------------ */

export interface Community {
  id: number;
  members: number[];
  name: string;
  color: string;
  isolated: boolean;
  internalEdges: number;
  interests: [string, number][];
}

export interface Net {
  users: User[];
  ids: string[];
  idx: Map<string, number>;
  A: Matrix;
  R: Matrix;
  nb: Set<number>[];
  degree: number[];
  labels: number[];
  communities: Community[];
  commOf: number[];
  isolatedIdx: number[];
}

export function analyze(users: User[], edges: Edge[]): Net {
  const ids = users.map((u) => u.id);
  const idx = new Map(ids.map((id, i) => [id, i] as [string, number]));
  const A = buildAdjacency(ids, edges);
  const R = warshall(A);
  const nb = neighborSets(A);
  const degree = nb.map((s) => s.size);
  const labels = labelPropagation(nb);

  const groups = new Map<number, number[]>();
  labels.forEach((l, i) => {
    if (degree[i] === 0) return;
    groups.set(l, [...(groups.get(l) || []), i]);
  });
  const arr = [...groups.values()].sort((a, b) => b.length - a.length || a[0] - b[0]);

  const communities: Community[] = [];
  const commOf: number[] = Array(users.length).fill(0);
  arr.forEach((members, ci) => {
    const counts = new Map<string, number>();
    members.forEach((m) => users[m].interests.forEach((it) => counts.set(it, (counts.get(it) || 0) + 1)));
    const interests = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top = interests.slice(0, 2).map((x) => x[0]);
    let internal = 0;
    for (let a = 0; a < members.length; a++)
      for (let b = a + 1; b < members.length; b++) if (nb[members[a]].has(members[b])) internal++;
    communities.push({
      id: communities.length,
      members,
      name: top.length ? `${top.join(' & ')} Circle` : 'Circle',
      color: PALETTE[ci % PALETTE.length],
      isolated: false,
      internalEdges: internal,
      interests,
    });
    members.forEach((m) => (commOf[m] = communities.length - 1));
  });
  const isolatedIdx: number[] = [];
  users.forEach((_, i) => {
    if (degree[i] === 0) {
      isolatedIdx.push(i);
      communities.push({
        id: communities.length,
        members: [i],
        name: 'Unconnected',
        color: ISOLATED_COLOR,
        isolated: true,
        internalEdges: 0,
        interests: [],
      });
      commOf[i] = communities.length - 1;
    }
  });

  return { users, ids, idx, A, R, nb, degree, labels, communities, commOf, isolatedIdx };
}

export function networkStats(net: Net) {
  const n = net.users.length;
  let pairs = 0;
  let mutualPairs = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (net.nb[i].has(j)) pairs++;
      else if (mutualFriends(net.nb, i, j).length > 0) mutualPairs++;
    }
  return {
    totalUsers: n,
    totalFriendships: pairs,
    mutualConnections: mutualPairs,
    communities: net.communities.filter((c) => !c.isolated).length,
    isolated: net.isolatedIdx.length,
  };
}

/* ------------------------------------------------------------------ */
/* Recommendation logic                                                 */
/* ------------------------------------------------------------------ */

export const W_MUTUAL = 10;
export const W_INTEREST = 3;
export const W_COMMUNITY = 2;

export type Status = 'friends' | 'following' | 'followed-by' | 'none';

export function connectionStatus(A: Matrix, a: number, b: number): Status {
  if (A[a][b] && A[b][a]) return 'friends';
  if (A[a][b]) return 'following';
  if (A[b][a]) return 'followed-by';
  return 'none';
}

export interface Candidate {
  idx: number;
  mutual: number[];
  shared: string[];
  sameCommunity: boolean;
  reachable: boolean;
  hops: number;
  eligible: boolean;
  score: number;
  breakdown: { mutual: number; interests: number; community: number };
  reasons: string[];
  status: Status;
}

const niceList = (xs: string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** All users who are not `me` and not directly connected to `me`, with scores. */
export function candidatesFor(net: Net, me: number): Candidate[] {
  const out: Candidate[] = [];
  const dist = distancesFrom(net.A, me);
  const myInterests = net.users[me].interests;
  for (let c = 0; c < net.users.length; c++) {
    if (c === me || net.nb[me].has(c)) continue;
    const mutual = mutualFriends(net.nb, me, c);
    const shared = net.users[c].interests.filter((x) => myInterests.includes(x));
    const reachable = net.R[me][c] === 1;
    const eligible = mutual.length > 0 || reachable;
    const sameCommunity =
      !net.communities[net.commOf[me]].isolated && net.commOf[me] === net.commOf[c];
    const hops = mutual.length > 0 ? 2 : dist[c] > 0 ? dist[c] : -1;
    const breakdown = {
      mutual: mutual.length * W_MUTUAL,
      interests: shared.length * W_INTEREST,
      community: sameCommunity ? W_COMMUNITY : 0,
    };
    const reasons: string[] = [];
    if (mutual.length > 0) {
      reasons.push(`You have ${mutual.length} mutual friend${mutual.length > 1 ? 's' : ''}.`);
      reasons.push(`Connected through your friend ${net.users[mutual[0]].name}.`);
    } else if (reachable) {
      const path = bfsPath(net.A, me, c) || [];
      const via = path.slice(1, -1).map((p) => net.users[p].name);
      reasons.push(
        via.length
          ? `Reachable through a chain of ${path.length - 1} connections via ${niceList(via)}.`
          : 'Reachable through the network.',
      );
    }
    if (shared.length) reasons.push(`You both enjoy ${niceList(shared.map((s) => s.toLowerCase()))}.`);
    if (sameCommunity) reasons.push('You belong to closely connected communities.');
    if (!eligible && shared.length) reasons.push('Interest-based suggestion — no graph connection yet.');
    if (!eligible && !shared.length) reasons.push('No graph connection or shared interest yet.');
    out.push({
      idx: c,
      mutual,
      shared,
      sameCommunity,
      reachable,
      hops,
      eligible,
      score: breakdown.mutual + breakdown.interests + breakdown.community,
      breakdown,
      reasons,
      status: connectionStatus(net.A, me, c),
    });
  }
  return out;
}
