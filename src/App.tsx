import { WalletContextProvider, SOLANA_NETWORK } from './solana/WalletContextProvider'
import { WalletPanel } from './components/WalletPanel'

function App() {
  return (
    <WalletContextProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-center">
        <div className="mb-10">
          <h1 className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-5xl font-bold text-transparent">
            SolPact
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-slate-400">
            Solana {SOLANA_NETWORK}
          </p>
        </div>

        <WalletPanel />
      </div>
    </WalletContextProvider>
  )
}

export default App
