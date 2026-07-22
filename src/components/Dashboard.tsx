import { useState } from 'react'
import {
  hasCheckedInToday,
  type Commitment,
  type CommitmentStatus,
} from '../lib/commitments'
import { explorerTxUrl } from '../solana/stake'

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

type CardState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'error'; message: string }

function CommitmentCard({
  commitment,
  onCheckIn,
}: {
  commitment: Commitment
  onCheckIn: (commitment: Commitment) => Promise<void>
}) {
  const { goal, stakeSol, streakDays, daysCompleted, status, stakeSignature } =
    commitment
  const [state, setState] = useState<CardState>({ status: 'idle' })

  const pct =
    streakDays > 0
      ? Math.min(100, Math.round((daysCompleted / streakDays) * 100))
      : 0
  const checkedInToday = hasCheckedInToday(commitment)
  const sending = state.status === 'sending'
  const disabled = sending || checkedInToday || status !== 'active'

  async function handleClick() {
    setState({ status: 'sending' })
    try {
      await onCheckIn(commitment)
      setState({ status: 'idle' })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Check-in failed.',
      })
    }
  }

  const label = sending
    ? 'Checking in…'
    : checkedInToday
      ? 'Checked in today ✓'
      : 'Check in today'

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-white/5 p-5 text-left backdrop-blur">
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

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>

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
        </ul>
      </div>
    </div>
  )
}

export function Dashboard({
  commitments,
  onCheckIn,
}: {
  commitments: Commitment[]
  onCheckIn: (commitment: Commitment) => Promise<void>
}) {
  const active = commitments.filter((c) => c.status === 'active')

  return (
    <div className="w-full max-w-md text-left">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">
        Active commitments
      </h2>

      {active.length === 0 ? (
        <p className="rounded-xl border border-slate-700 bg-white/5 p-5 text-sm text-slate-400">
          No active commitments yet. Create one above to lock a stake and start
          your streak.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((c) => (
            <CommitmentCard key={c.id} commitment={c} onCheckIn={onCheckIn} />
          ))}
        </div>
      )}
    </div>
  )
}
