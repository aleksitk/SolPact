import { useState } from 'react'
import {
  hasCheckedInToday,
  type Commitment,
  type CommitmentStatus,
} from '../lib/commitments'
import { explorerTxUrl } from '../solana/stake'
import { Confetti } from './Confetti'

const STATUS_STYLES: Record<CommitmentStatus, string> = {
  active: 'border-purple-400/40 bg-purple-400/10 text-purple-200',
  completed: 'border-green-400/40 bg-green-400/10 text-green-200',
  forfeited: 'border-red-400/40 bg-red-400/10 text-red-200',
}

function StatusBadge({ status }: { status: CommitmentStatus }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

function shortSig(sig: string): string {
  return sig.length > 12 ? `${sig.slice(0, 6)}…${sig.slice(-6)}` : sig
}

type ActionState =
  | { status: 'idle' }
  | { status: 'busy' }
  | { status: 'error'; message: string }

function CommitmentCard({
  commitment,
  onCheckIn,
  onClaim,
  vaultConfigured,
}: {
  commitment: Commitment
  onCheckIn: (commitment: Commitment) => Promise<void>
  onClaim: (commitment: Commitment) => Promise<void>
  vaultConfigured: boolean
}) {
  const {
    goal,
    stakeSol,
    streakDays,
    daysCompleted,
    status,
    stakeSignature,
    claimSignature,
  } = commitment
  const [state, setState] = useState<ActionState>({ status: 'idle' })

  const pct =
    streakDays > 0
      ? Math.min(100, Math.round((daysCompleted / streakDays) * 100))
      : 0
  const busy = state.status === 'busy'

  async function run(action: () => Promise<void>) {
    setState({ status: 'busy' })
    try {
      await action()
      setState({ status: 'idle' })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      })
    }
  }

  const checkedInToday = hasCheckedInToday(commitment)
  const checkInLabel = busy
    ? 'Checking in…'
    : checkedInToday
      ? 'Checked in today ✓'
      : 'Check in today'

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-white/5 p-5 text-left backdrop-blur">
      {status === 'completed' && !claimSignature && <Confetti />}

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">{goal}</h3>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
        <span>
          Day {daysCompleted} / {streakDays}
        </span>
        <span className="font-mono text-purple-200">{stakeSol} SOL staked</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {status === 'active' && (
        <button
          type="button"
          onClick={() => run(() => onCheckIn(commitment))}
          disabled={busy || checkedInToday}
          className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkInLabel}
        </button>
      )}

      {status === 'completed' && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-green-300">
            🎉 Streak complete! You kept your commitment.
          </p>
          {claimSignature ? (
            <p className="mt-2 text-sm text-green-200">Stake reclaimed ✓</p>
          ) : vaultConfigured ? (
            <button
              type="button"
              onClick={() => run(() => onClaim(commitment))}
              disabled={busy}
              className="mt-2 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Claiming…' : `Claim your stake (${stakeSol} SOL)`}
            </button>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              Set <code>VITE_VAULT_SECRET_KEY</code> (Devnet demo vault) to
              enable claiming your stake back.
            </p>
          )}
        </div>
      )}

      {status === 'forfeited' && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Streak broken — stake forfeited. The {stakeSol} SOL stays in the
          vault.
        </p>
      )}

      {state.status === 'error' && (
        <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {state.message}
        </p>
      )}

      <div className="mt-4 text-xs text-slate-400">
        <p className="font-medium uppercase tracking-widest text-slate-500">
          Transactions
        </p>
        <ul className="mt-1 space-y-1">
          <li>
            <a
              href={explorerTxUrl(stakeSignature)}
              target="_blank"
              rel="noreferrer"
              className="text-purple-300 underline"
            >
              Stake · {shortSig(stakeSignature)} →
            </a>
          </li>
          {commitment.checkIns.map((ci) => (
            <li key={ci.signature}>
              <a
                href={explorerTxUrl(ci.signature)}
                target="_blank"
                rel="noreferrer"
                className="text-purple-300 underline"
              >
                Check-in Day {ci.day} · {shortSig(ci.signature)} →
              </a>
            </li>
          ))}
          {claimSignature && (
            <li>
              <a
                href={explorerTxUrl(claimSignature)}
                target="_blank"
                rel="noreferrer"
                className="text-green-300 underline"
              >
                Claim · {shortSig(claimSignature)} →
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export function Dashboard({
  commitments,
  onCheckIn,
  onClaim,
  vaultConfigured,
}: {
  commitments: Commitment[]
  onCheckIn: (commitment: Commitment) => Promise<void>
  onClaim: (commitment: Commitment) => Promise<void>
  vaultConfigured: boolean
}) {
  return (
    <div className="w-full max-w-md text-left">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">
        Your commitments
      </h2>

      {commitments.length === 0 ? (
        <p className="rounded-xl border border-slate-700 bg-white/5 p-5 text-sm text-slate-400">
          No commitments yet. Create one above to lock a stake and start your
          streak.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {commitments.map((c) => (
            <CommitmentCard
              key={c.id}
              commitment={c}
              onCheckIn={onCheckIn}
              onClaim={onClaim}
              vaultConfigured={vaultConfigured}
            />
          ))}
        </div>
      )}
    </div>
  )
}
