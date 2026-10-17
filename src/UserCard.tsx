import { useState } from 'react';
import { Eye, Info, Sparkles, UserPlus, X } from 'lucide-react';
import { Avatar } from './avatar';
import { useApp } from './store';
import { StatusBadge } from './ui';
import { W_COMMUNITY, W_INTEREST, W_MUTUAL } from './algo';
import type { Candidate } from './algo';

/** Recommendation card. `cand` holds the algorithm output for this user vs. the current user. */
export default function UserCard({
  userIdx,
  cand,
  showActions = true,
}: {
  userIdx: number;
  cand: Candidate;
  showActions?: boolean;
}) {
  const { net, state, openProfile, connect, dismiss, notify } = useApp();
  const [why, setWhy] = useState(false);
  const u = net.users[userIdx];
  const comm = net.communities[net.commOf[userIdx]];
  const mutualNames = cand.mutual.map((m) => net.users[m].name);

  return (
    <article className="card flex flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <Avatar name={u.name} size={60} ring={comm.color} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold text-burgundy">{u.name}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-wine/80">
              <span className="h-2 w-2 rounded-full" style={{ background: comm.color }} />
              {comm.isolated ? 'Unconnected' : comm.name}
            </span>
            <StatusBadge status={cand.status} />
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-wine/90">{u.bio}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {u.interests.map((it) => (
          <span
            key={it}
            className={`chip ${cand.shared.includes(it) ? 'bg-wine text-white' : ''}`}
            title={cand.shared.includes(it) ? 'Shared interest' : undefined}
          >
            {it}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-blush/70 p-3 text-sm">
        <div className="font-semibold text-burgundy">
          {cand.mutual.length} mutual friend{cand.mutual.length === 1 ? '' : 's'}
          {mutualNames.length > 0 && (
            <span className="font-normal text-wine"> — {mutualNames.join(', ')}</span>
          )}
        </div>
        <ul className="mt-1.5 space-y-1 text-wine">
          {cand.reasons.slice(0, 3).map((r) => (
            <li key={r} className="flex gap-1.5">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-rose" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setWhy((w) => !w)}
        className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-wine hover:underline"
      >
        <Info size={13} /> {why ? 'Hide' : 'Show'} score breakdown
      </button>
      {why && (
        <div className="mt-1 rounded-xl border border-rose/40 bg-white p-3 text-xs text-wine">
          {cand.eligible ? (
            <>
              <div>
                Mutual friends: {cand.mutual.length} × {W_MUTUAL} = <b>{cand.breakdown.mutual}</b>
              </div>
              <div>
                Shared interests: {cand.shared.length} × {W_INTEREST} = <b>{cand.breakdown.interests}</b>
              </div>
              <div>
                Same community: {cand.sameCommunity ? 1 : 0} × {W_COMMUNITY} = <b>{cand.breakdown.community}</b>
              </div>
              <div className="mt-1 border-t border-rose/30 pt-1">
                Total score: <b>{cand.score}</b>
              </div>
            </>
          ) : (
            <div>
              Not graph-eligible (no mutual friend and not reachable from you). Shown only because of a
              shared interest or low connectivity — an interest match is <b>not</b> a graph connection.
              Interest-only score: {cand.breakdown.interests}.
            </div>
          )}
        </div>
      )}

      {showActions && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-ghost flex-1" onClick={() => openProfile(u.id)}>
            <Eye size={15} /> View Profile
          </button>
          <button
            className="btn-primary flex-1"
            onClick={() => {
              connect(state.me, u.id);
              notify(
                `${u.name} added — this is a local simulation, no real friend request was sent.`,
              );
            }}
          >
            <UserPlus size={15} /> Add Friend
          </button>
          <button
            className="btn-soft px-3"
            aria-label={`Dismiss ${u.name}`}
            title="Dismiss"
            onClick={() => {
              dismiss(u.id);
              notify(`${u.name} dismissed from your suggestions.`);
            }}
          >
            <X size={15} /> Dismiss
          </button>
        </div>
      )}
    </article>
  );
}
