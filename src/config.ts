import { clusterApiUrl, type Cluster } from '@solana/web3.js'

export const SOLANA_NETWORK: Cluster = 'devnet'

export const SOLANA_CLUSTER = 'devnet' as const

// Guarded access so this module can also be imported outside Vite (e.g. Node
// scripts/tests) where `import.meta.env` is undefined.
const ENV: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env ?? {}

// Default Devnet RPC endpoint; overridable via VITE_SOLANA_RPC_URL.
export const RPC_ENDPOINT =
  ENV.VITE_SOLANA_RPC_URL ?? clusterApiUrl(SOLANA_NETWORK)

// Fixed demo "vault" wallet that receives staked SOL. Devnet only.
// Overridable via VITE_VAULT_ADDRESS.
export const VAULT_ADDRESS =
  ENV.VITE_VAULT_ADDRESS ?? 'FPPxf4dtUhPdrAkZHBTDvppkMREFVJ8FFtBDoc7moPEq'
