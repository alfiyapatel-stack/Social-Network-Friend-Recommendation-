import assert from 'node:assert/strict';
import { SAMPLE_EDGES, SAMPLE_USERS } from './data';
import {
  analyze,
  bfsPath,
  buildAdjacency,
  candidatesFor,
  mutualFriends,
  networkStats,
  strongComponents,
  warshall,
  warshallSteps,
  weakComponents,
} from './algo';

// Independent reachability check (DFS from every vertex, path length >= 1)
function bruteReach(A: number[][]): number[][] {
  const n = A.length;
  return A.map((_, s) => {
    const seen = Array(n).fill(0);
    const stack: number[] = [];
    for (let v = 0; v < n; v++) if (A[s][v]) stack.push(v);
    while (stack.length) {
      const u = stack.pop()!;
      if (seen[u]) continue;
      seen[u] = 1;
      for (let v = 0; v < n; v++) if (A[u][v] && !seen[v]) stack.push(v);
    }
    return seen;
  });
}

const net = analyze(SAMPLE_USERS, SAMPLE_EDGES);
const n = net.users.length;

// 1. Warshall == brute force
assert.deepEqual(net.R, bruteReach(net.A), 'closure matches brute-force reachability');

// 2. Step snapshots end at the closure
const steps = warshallSteps(net.A);
assert.equal(steps.length, n + 1);
assert.deepEqual(steps[n].matrix, net.R);
assert.deepEqual(steps[0].matrix, net.A);

// 3. Isolated user
assert.deepEqual(net.isolatedIdx, [14], 'Omar is the only isolated user');
assert.equal(net.degree[12], 1);

// 4. Mutual friends: Aisha(0) & Nisha(8) -> Meera(2), Zoya(4)
assert.deepEqual(mutualFriends(net.nb, 0, 8), [2, 4]);

// 5. Candidates for Yash(12): friend Ishaan(7); FoF = Arjun(5), Sara(10) is already Ishaan's friend, Zoya(4)
const cands = candidatesFor(net, 12);
assert.ok(cands.every((c) => c.idx !== 12 && c.idx !== 7));
const withMutual = cands.filter((c) => c.mutual.length > 0).map((c) => c.idx).sort((a, b) => a - b);
assert.deepEqual(withMutual, [3, 4, 5, 10]);
// Omar is not reachable and has no mutual friends -> not eligible
assert.equal(cands.find((c) => c.idx === 14)!.eligible, false);

// 6. Communities
const comms = net.communities.filter((c) => !c.isolated);
assert.ok(comms.length >= 2, `expected >=2 communities, got ${comms.length}`);
assert.equal(weakComponents(net.A).length, 2, 'one big component + Omar');

// 7. Adding a friendship updates the isolated status
const edges2 = [...SAMPLE_EDGES, ['u14', 'u1'], ['u1', 'u14']] as [string, string][];
const net2 = analyze(SAMPLE_USERS, edges2);
assert.equal(net2.isolatedIdx.length, 0);
assert.equal(networkStats(net2).totalFriendships, networkStats(net).totalFriendships + 1);

// 8. Directed chain A->B->C
const chain = buildAdjacency(['a', 'b', 'c'], [['a', 'b'], ['b', 'c']]);
const Rc = warshall(chain);
assert.equal(Rc[0][2], 1);
assert.equal(Rc[2][0], 0);
assert.deepEqual(bfsPath(chain, 0, 2), [0, 1, 2]);
assert.equal(bfsPath(chain, 2, 0), null);
assert.equal(strongComponents(Rc).length, 3);

// 9. Removing a user (edges dropped) recomputes closure consistently
const users3 = SAMPLE_USERS.filter((u) => u.id !== 'u7');
const edges3 = SAMPLE_EDGES.filter(([a, b]) => a !== 'u7' && b !== 'u7');
const net3 = analyze(users3, edges3);
assert.deepEqual(net3.R, bruteReach(net3.A));

console.log('All algorithm tests passed');
console.log('Communities:', comms.map((c) => `${c.name} [${c.members.map((m) => net.users[m].name).join(', ')}]`));
console.log('Stats:', networkStats(net));
