import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useApp } from '../store';
import { SectionTitle, MatrixView } from '../ui';
import { bfsPath, buildAdjacency, mutualFriends, neighborSets, warshall, warshallSteps } from '../algo';

const MINI_LABELS = ['A', 'B', 'C', 'D', 'E'];
const MINI_A = buildAdjacency(['a', 'b', 'c', 'd', 'e'], [['a', 'b'], ['b', 'c'], ['c', 'd'], ['e', 'd']]);

const CODE = `// R starts as a copy of the adjacency matrix A
for (let k = 0; k < n; k++)          // k = intermediate vertex
  for (let i = 0; i < n; i++)        // i = source
    for (let j = 0; j < n; j++)      // j = target
      R[i][j] = R[i][j] | (R[i][k] & R[k][j]);`;

function MiniDiagram() {
  const pts: Record<string, [number, number]> = { A: [12, 22], B: [42, 22], C: [72, 22], D: [102, 22], E: [72, 58] };
  const edges: [string, string][] = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['E', 'D']];
  return (
    <svg viewBox="0 0 120 75" className="mx-auto w-full max-w-sm">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10z" fill="#8F244B" />
        </marker>
      </defs>
      {edges.map(([a, b]) => {
        const [x1, y1] = pts[a];
        const [x2, y2] = pts[b];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        return (
          <line key={a + b} x1={x1 + ux * 9} y1={y1 + uy * 9} x2={x2 - ux * 10} y2={y2 - uy * 10} stroke="#8F244B" strokeWidth="1.4" markerEnd="url(#arr)" />
        );
      })}
      {Object.entries(pts).map(([l, [x, y]]) => (
        <g key={l}>
          <circle cx={x} cy={y} r="8.5" fill="#FCE7EF" stroke="#8F244B" strokeWidth="1.4" />
          <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#6D1738">{l}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Lab() {
  const { net, state, setDirected } = useApp();
  const [ds, setDs] = useState<'mini' | 'network'>('mini');
  const data = useMemo(
    () =>
      ds === 'mini'
        ? { labels: MINI_LABELS, A: MINI_A }
        : { labels: net.users.map((u) => u.name), A: net.A },
    [ds, net],
  );
  const n = data.A.length;
  const steps = useMemo(() => warshallSteps(data.A), [data]);
  const final = useMemo(() => warshall(data.A), [data]);
  const nb = useMemo(() => neighborSets(data.A), [data]);
  const [step, setStep] = useState(0);
  const [src, setSrc] = useState(0);
  const [dst, setDst] = useState(1);
  useEffect(() => {
    setStep(0);
    setSrc(0);
    setDst(Math.min(3, n - 1));
  }, [data, n]);

  const s = Math.min(src, n - 1);
  const t = Math.min(dst, n - 1);
  const cur = steps[Math.min(step, n)];
  const L = data.labels;

  const explanation = (() => {
    if (step === 0)
      return 'Step 0 — R⁽⁰⁾ = A. Only direct edges are known. Press “Next Step” to allow each user in turn to act as an intermediate vertex k.';
    const k = cur.k;
    const head = `k = ${L[k]}: for every pair (i, j) ask “can i reach ${L[k]}, and can ${L[k]} reach j?” If both are true, i can reach j through ${L[k]}.`;
    if (cur.changed.length === 0) return `${head} No new paths were created in this step.`;
    const list = cur.changed.slice(0, 6).map(([i, j]) => `${L[i]} → ${L[j]}`).join(', ');
    return `${head} ${cur.changed.length} new reachable pair${cur.changed.length === 1 ? '' : 's'} (highlighted): ${list}${cur.changed.length > 6 ? ', …' : ''}.`;
  })();

  const path = s !== t ? bfsPath(data.A, s, t) : null;
  const reachable = final[s][t] === 1;
  const direct = data.A[s][t] === 1;
  const friends = nb[s].has(t);
  const mutual = mutualFriends(nb, s, t);

  return (
    <section className="page">
      <SectionTitle
        title="Algorithm Lab"
        sub="Watch Warshall's algorithm build the transitive closure one intermediate vertex at a time."
        icon={<FlaskConical className="text-wine" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-lg font-bold">The idea</h3>
          <p className="mt-2 text-sm text-wine">
            Users are vertices; a friendship is a directed edge. <b>A[i][j] = 1</b> if there is an edge i → j, else 0. The
            reachability matrix <b>R</b> starts equal to A. For each intermediate vertex <b>k</b>:
          </p>
          <div className="my-3 rounded-2xl bg-blush px-4 py-3 text-center font-mono text-sm font-semibold text-burgundy">
            R⁽ᵏ⁾[i][j] = R⁽ᵏ⁻¹⁾[i][j] ∨ ( R⁽ᵏ⁻¹⁾[i][k] ∧ R⁽ᵏ⁻¹⁾[k][j] )
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-burgundy p-4 text-xs leading-relaxed text-blush">{CODE}</pre>
          <p className="mt-3 text-sm text-wine">
            Time <b>O(V³)</b> (three nested loops), space <b>O(V²)</b> (one V × V matrix), V = number of users.
          </p>
          <div className="mt-3 rounded-2xl border border-rose/40 p-3 text-sm text-wine">
            <b>Assumption:</b> friendships are mutual, so each one is stored as two reciprocal directed edges (A → B and
            B → A). Switch on directed mode to create one-way edges instead.
            <label className="mt-2 flex cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" checked={state.directed} onChange={(e) => setDirected(e.target.checked)} className="h-4 w-4 accent-[#8F244B]" />
              Directed mode (new friendships are one-way)
            </label>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold">Viva example (5 users)</h3>
          <MiniDiagram />
          <p className="text-sm text-wine">
            Edges: A→B, B→C, C→D, E→D. Run the steps: at <b>k = B</b> the path A→B→C creates A→C; at <b>k = C</b> we get
            A→D and B→D (A→C→D, B→C→D). E reaches only D. Result: A reaches B, C, D; nobody reaches A or E.
          </p>
          <div className="mt-3 flex gap-2">
            <button className={`btn flex-1 ${ds === 'mini' ? 'bg-wine text-white' : 'bg-blush text-wine'}`} onClick={() => setDs('mini')}>Viva example</button>
            <button className={`btn flex-1 ${ds === 'network' ? 'bg-wine text-white' : 'bg-blush text-wine'}`} onClick={() => setDs('network')}>Bondly network ({net.users.length} users)</button>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={() => setStep(n)}><Play size={15} /> Run Algorithm</button>
          <button className="btn-soft" disabled={step === 0} onClick={() => setStep((x) => Math.max(0, x - 1))}><SkipBack size={15} /> Back</button>
          <button className="btn-primary" disabled={step >= n} onClick={() => setStep((x) => Math.min(n, x + 1))}><SkipForward size={15} /> Next Step</button>
          <button className="btn-ghost" onClick={() => setStep(0)}><RotateCcw size={15} /> Reset</button>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm font-semibold text-wine">
            <span className="rounded-full bg-blush px-3 py-1">Step {step} / {n}</span>
            <span className="rounded-full bg-wine px-3 py-1 text-white">
              {step === 0 ? 'k = — (initial)' : `k = ${L[cur.k]}`}
            </span>
            {step >= n && <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Complete</span>}
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-blush/70 p-3 text-sm text-burgundy" aria-live="polite">{explanation}</p>

        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <div>
            <h4 className="mb-2 font-bold">Adjacency matrix A (original)</h4>
            <MatrixView labels={L} matrix={data.A} />
          </div>
          <div>
            <h4 className="mb-2 font-bold">Reachability / transitive closure R {step >= n ? '(final)' : `(after k = ${step === 0 ? 'none' : L[cur.k]})`}</h4>
            <MatrixView labels={L} matrix={cur.matrix} changed={cur.changed} k={step === 0 ? undefined : cur.k} />
            <p className="mt-2 text-xs text-wine/70">Amber = cells that became 1 in this step · dark header = current k row/column.</p>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="text-lg font-bold">Reachability check</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-wine">Source user
            <select className="input mt-1" value={s} onChange={(e) => setSrc(Number(e.target.value))}>
              {L.map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-wine">Target user
            <select className="input mt-1" value={t} onChange={(e) => setDst(Number(e.target.value))}>
              {L.map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
          </label>
        </div>
        {s === t ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Choose two different users.</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <div className={`rounded-2xl p-3 font-semibold ${reachable ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {L[t]} is {reachable ? '' : 'NOT '}reachable from {L[s]} (R[{L[s]}][{L[t]}] = {final[s][t]}).
            </div>
            {reachable && path && (
              <div className="rounded-2xl bg-blush p-3 text-wine">
                Path: <b>{path.map((p) => L[p]).join(' → ')}</b>
                {path.length > 2 ? ` — intermediate users: ${path.slice(1, -1).map((p) => L[p]).join(', ')}` : ' — a direct edge, no intermediates.'}
                <div className="mt-1 text-xs text-wine/70">The closure says a path exists; a breadth-first search over A then recovers one shortest path.</div>
              </div>
            )}
            <div className="rounded-2xl border border-rose/40 p-3 text-wine">
              <div className="font-semibold">Reachability ≠ friendship ≠ mutual friends</div>
              <ul className="mt-1 list-disc pl-5">
                <li>Direct edge {L[s]} → {L[t]} (A[i][j]): <b>{direct ? 'yes' : 'no'}</b>{friends && !direct ? ' (connected in the other direction)' : ''}</li>
                <li>Reachable through any chain (R[i][j]): <b>{reachable ? 'yes' : 'no'}</b></li>
                <li>Mutual friends (neighbour-set intersection, not from R): <b>{mutual.length ? mutual.map((m) => L[m]).join(', ') : 'none'}</b></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
