import { useMemo, type ReactNode } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

import '@solana/wallet-adapter-react-ui/styles.css'

type Props = {
  children: ReactNode
}

export const SOLANA_NETWORK = WalletAdapterNetwork.Devnet

export function WalletContextProvider({ children }: Props) {
  const endpoint = useMemo(() => clusterApiUrl(SOLANA_NETWORK), [])

  // Phantom is also auto-detected as a Wallet Standard wallet, but we register
  // the adapter explicitly so it is always available in the connect modal.
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
