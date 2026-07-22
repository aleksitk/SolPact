import { useMemo, type ReactNode } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { RPC_ENDPOINT } from '../config'

import '@solana/wallet-adapter-react-ui/styles.css'

type Props = {
  children: ReactNode
}

export function WalletContextProvider({ children }: Props) {
  const endpoint = useMemo(() => RPC_ENDPOINT, [])

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
