import { useWallet } from '@solana/wallet-adapter-react'
import { WalletContextProvider } from './solana/WalletContextProvider'
import { WalletPanel } from './components/WalletPanel'
import { CreateCommitmentForm } from './components/CreateCommitmentForm'
import { SOLANA_NETWORK } from './config'

function Home() {
  const { connected } = useWallet()

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
        {connected && <CreateCommitmentForm />}
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
