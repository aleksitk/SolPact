import { useState, type FormEvent } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { VAULT_ADDRESS } from '../config'
import {
  buildStakeTransaction,
  explorerAddressUrl,
  explorerTxUrl,
} from '../solana/stake'
import { addCommitment, createCommitment } from '../lib/commitments'

type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'error'; message: string }
  | { status: 'success'; signature: string; stakeSol: number; goal: string }

export function CreateCommitmentForm({
  onCreated,
}: {
  onCreated?: () => void
}) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [goal, setGoal] = useState('')
  const [stakeSol, setStakeSol] = useState('0.05')
  const [streakDays, setStreakDays] = useState('7')
  const [state, setState] = useState<SubmitState>({ status: 'idle' })

  const disabled = state.status === 'sending'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!publicKey) {
      setState({ status: 'error', message: 'Connect your wallet first.' })
      return
    }

    const amount = Number(stakeSol)
    const days = Number(streakDays)
    if (!goal.trim()) {
      setState({ status: 'error', message: 'Enter a goal.' })
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setState({ status: 'error', message: 'Stake must be greater than 0.' })
      return
    }
    if (!Number.isInteger(days) || days <= 0) {
      setState({ status: 'error', message: 'Streak must be a whole number of days.' })
      return
    }

    try {
      setState({ status: 'sending' })
      const vault = new PublicKey(VAULT_ADDRESS)
      const tx = buildStakeTransaction({ from: publicKey, vault, amountSol: amount })

      const signature = await sendTransaction(tx, connection)

      const latest = await connection.getLatestBlockhash()
      await connection.confirmTransaction(
        { signature, ...latest },
        'confirmed',
      )

      addCommitment(
        createCommitment({
          goal: goal.trim(),
          stakeSol: amount,
          streakDays: days,
          stakeSignature: signature,
        }),
      )

      setState({ status: 'success', signature, stakeSol: amount, goal: goal.trim() })
      setGoal('')
      onCreated?.()
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Transaction failed.',
      })
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-purple-500/30 bg-white/5 p-6 text-left backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-100">Create a commitment</h2>
      <p className="mt-1 text-sm text-slate-400">
        Lock Devnet SOL as a stake against your goal.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Goal
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Meditate every day"
            disabled={disabled}
            className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:border-purple-400"
          />
        </label>

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
            Stake (SOL)
            <input
              type="number"
              min="0"
              step="0.01"
              value={stakeSol}
              onChange={(e) => setStakeSol(e.target.value)}
              disabled={disabled}
              className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:border-purple-400"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
            Streak (days)
            <input
              type="number"
              min="1"
              step="1"
              value={streakDays}
              onChange={(e) => setStreakDays(e.target.value)}
              disabled={disabled}
              className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:border-purple-400"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="mt-1 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === 'sending' ? 'Locking stake…' : 'Lock stake'}
        </button>
      </form>

      <p className="mt-4 break-all text-xs text-slate-500">
        Vault:{' '}
        <a
          href={explorerAddressUrl(VAULT_ADDRESS)}
          target="_blank"
          rel="noreferrer"
          className="text-purple-300 underline"
        >
          {VAULT_ADDRESS}
        </a>
      </p>

      {state.status === 'error' && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.message}
        </p>
      )}

      {state.status === 'success' && (
        <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-3 text-sm text-green-200">
          <p className="font-semibold">Stake locked!</p>
          <p className="mt-1">
            {state.stakeSol} SOL staked for “{state.goal}”.
          </p>
          <a
            href={explorerTxUrl(state.signature)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block break-all text-purple-300 underline"
          >
            View transaction on Solana Explorer →
          </a>
        </div>
      )}
    </div>
  )
}
