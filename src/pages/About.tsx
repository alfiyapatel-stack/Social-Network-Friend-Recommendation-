import type { ReactNode } from 'react';
import { ArrowDown, ArrowRight, BookOpen } from 'lucide-react';
import { SectionTitle } from '../ui';

const FLOW = [
  'User Data',
  'Graph Creation',
  'Adjacency Matrix',
  "Warshall's Algorithm",
  'Transitive Closure',
  'Recommendation Logic',
  'Recommended Friends',
];

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="card p-6">
    <h3 className="text-xl font-bold">{title}</h3>
    <div className="mt-2 text-sm text-wine">{children}</div>
  </div>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
);

export default function About() {
  return (
    <section className="page">
      <SectionTitle
        title="About Project"
        sub="Social Network Friend Recommendation System — a Data Structures & Algorithms mini project."
        icon={<BookOpen className="text-wine" />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Project Title">Social Network Friend Recommendation System (Bondly — Find Your Circle)</Block>
        <Block title="Objective">
          To apply graph representation and Warshall's Algorithm to identify indirect connections and support friend
          recommendations.
        </Block>
        <Block title="Data Structures Used">
          <List items={['Graph (users = vertices, friendships = directed edges)', 'Adjacency matrix A', 'Reachability matrix R (transitive closure)', 'Neighbour sets (for direct friends and mutual friends)']} />
        </Block>
        <Block title="Algorithm">
          <p>Warshall's Algorithm for transitive closure — O(V³) time, O(V²) space.</p>
          <p className="mt-2 font-mono text-xs">R[i][j] = R[i][j] | (R[i][k] &amp; R[k][j])</p>
        </Block>
        <Block title="Applications">
          <List items={['Social networking platforms', 'Mutual friend discovery', 'Network connectivity analysis', 'Identification of disconnected users', 'Exploration of relationships between communities']} />
        </Block>
        <Block title="Limitations">
          <List items={['Transitive closure determines reachability but does not directly measure friendship strength.', 'Recommendation quality depends on the available network data.', 'The sample application is a demonstration, not a production social network.']} />
        </Block>
      </div>

      <div className="card mt-6 p-6">
        <h3 className="text-xl font-bold">Flow of the system</h3>
        <div className="mt-4 flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:justify-center">
          {FLOW.map((f, i) => (
            <div key={f} className="flex flex-col items-center gap-2 md:flex-row">
              <div className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${i === 3 ? 'bg-wine text-white shadow-md' : 'bg-blush text-burgundy'}`}>{f}</div>
              {i < FLOW.length - 1 && (
                <>
                  <ArrowRight className="hidden text-rose md:block" size={20} />
                  <ArrowDown className="text-rose md:hidden" size={20} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Block title="How recommendations are made">
          <List
            items={[
              'Direct friends = neighbour set of the user (an edge in either direction).',
              'Mutual friends of A and B = neighbour(A) ∩ neighbour(B), excluding A and B.',
              'Candidates: not the user, not already a friend, and either have a mutual friend or are reachable (R[user][candidate] = 1).',
              'Score = 10 × mutual friends + 3 × shared interests + 2 if in the same community. The breakdown is shown on every card.',
              'Interest-only matches are shown separately and labelled — a shared hobby is not a graph connection.',
            ]}
          />
        </Block>
        <Block title="Viva cheat-sheet">
          <List
            items={[
              'Why three loops? k is the allowed intermediate vertex, i the source, j the target.',
              'Why is k the outer loop? So that R after round k only uses intermediates 0..k.',
              'Does closure give mutual friends? No — it only says whether a path exists; neighbour sets give mutual friends.',
              'Communities vs components? Components come from reachability; communities use label propagation.',
              'Complexity? O(V³) time, O(V²) space.',
            ]}
          />
        </Block>
      </div>
    </section>
  );
}
