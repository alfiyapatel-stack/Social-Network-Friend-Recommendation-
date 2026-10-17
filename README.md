# Bondly — Find Your Circle

Social Network Friend Recommendation System built around **Warshall's Algorithm** (transitive closure).
React + Vite + TypeScript + Tailwind CSS + Cytoscape.js + Lucide icons. No backend, no API keys.

## Run it

```bash
npm install
npm run dev        # open the printed http://localhost:5173 URL
```

Other commands:

```bash
npm test           # DSA unit tests (Warshall vs brute force, mutual friends, isolated users, ...)
npm run build      # type-check + production build
npm run preview    # serve the production build
```

## Pages

| Page | What it shows |
|------|---------------|
| Home | Hero graph, live stats, "How Bondly Works", top picks |
| Discover Friends | Scored recommendations, 5 filters, search, Add/Dismiss/View, "Everyone Deserves a Connection" |
| Network Graph | Cytoscape graph, hover/click/path, zoom/fit, toggles, add user / connect / disconnect |
| Communities | Label-propagation communities, mini-networks, weak/strong components from the closure |
| Algorithm Lab | Step-by-step Warshall with matrices, highlighted changes, reachability check, 5-node viva example |
| About Project | Report-style summary, flow diagram, viva cheat-sheet |

## Where the DSA lives

All algorithms are in `src/algo.ts` (pure functions, no UI):

- `buildAdjacency` — adjacency matrix A
- `warshall` / `warshallSteps` — the three nested loops, O(V³) time / O(V²) space
- `neighborSets`, `mutualFriends` — direct friends and common neighbours (not derived from the closure)
- `candidatesFor` — recommendation eligibility and score (10 × mutual + 3 × shared interests + 2 same community)
- `weakComponents`, `strongComponents`, `labelPropagation` — components vs communities
- `bfsPath` — recovers an actual path once the closure says one exists

Assumption: friendships are mutual, stored as reciprocal directed edges. Turn on **Directed mode** to create one-way edges.

State is local (React state + `localStorage`). Use **Reset Demo** in the avatar menu to restore the sample network.
