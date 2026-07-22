import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function WalletPanel() {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    if (!publicKey) {
      setBalance(null)
      return
    }
    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (active) setBalance(lamports / LAMPORTS_PER_SOL)
      })
      .catch(() => {
        if (active) setBalance(null)
      })
    return () => {
      active = false
    }
  }, [publicKey, connection])

  return (
    <div className="flex flex-col items-center gap-6">
      <WalletMultiButton />

      {connected && publicKey ? (
        <div className="w-full max-w-md rounded-xl border border-purple-500/30 bg-white/5 p-5 text-left backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-purple-300">
            Connected wallet
          </p>
          <p className="mt-1 break-all font-mono text-sm text-slate-100">
            {publicKey.toBase58()}
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-purple-300">
            Devnet balance
          </p>
          <p className="mt-1 font-mono text-lg text-slate-100">
            {balance === null ? 'Loading…' : `${balance.toFixed(4)} SOL`}
          </p>
        </div>
      ) : (
        <p className="max-w-md text-sm text-slate-400">
          Connect your Phantom wallet to view your Devnet address and balance.
        </p>
      )}
    </div>
  )
}
