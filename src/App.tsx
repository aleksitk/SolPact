import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletContextProvider } from './solana/WalletContextProvider'
import { WalletPanel } from './components/WalletPanel'
import { CreateCommitmentForm } from './components/CreateCommitmentForm'
import { Dashboard } from './components/Dashboard'
import {
  recordCheckIn,
  recordClaim,
  refreshStatuses,
  type Commitment,
} from './lib/commitments'
import { buildCheckInTransaction, checkInMemo } from './solana/stake'
import { claimStake, isVaultConfigured } from './solana/vault'
import { SOLANA_NETWORK } from './config'

function Home() {
  const { connected, publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  // Recompute forfeited statuses for any broken streaks on load.
  const [commitments, setCommitments] = useState(() => refreshStatuses())

  async function handleCheckIn(commitment: Commitment) {
    if (!publicKey) throw new Error('Connect your wallet first.')

    const day = commitment.daysCompleted + 1
    const memo = checkInMemo(day, commitment.streakDays)
    const tx = buildCheckInTransaction({ from: publicKey, memo })

    const signature = await sendTransaction(tx, connection)
    const latest = await connection.getLatestBlockhash()
    await connection.confirmTransaction({ signature, ...latest }, 'confirmed')

    setCommitments(recordCheckIn(commitment.id, signature))
  }

  async function handleClaim(commitment: Commitment) {
    if (!publicKey) throw new Error('Connect your wallet first.')
    const signature = await claimStake(connection, publicKey, commitment.stakeSol)
    setCommitments(recordClaim(commitment.id, signature))
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-center">
      <div className="mb-8">
        <h1 className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-5xl font-bold text-transparent">
          SolPact
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-slate-400">
          Solana {SOLANA_NETWORK}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-400">
          Stake Devnet SOL against a personal goal. Complete your streak to
          reclaim it — break it and you forfeit the stake.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-8">
        <WalletPanel />
        {connected && (
          <>
            <CreateCommitmentForm
              onCreated={() => setCommitments(refreshStatuses())}
            />
            <Dashboard
              commitments={commitments}
              onCheckIn={handleCheckIn}
              onClaim={handleClaim}
              vaultConfigured={isVaultConfigured()}
            />
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <WalletContextProvider>
      <Home />
    </WalletContextProvider>
  )
}

export default App
