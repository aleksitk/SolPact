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

// DEMO ONLY (Devnet): the vault keypair secret, as a JSON array of bytes, so
// the client can sign the claim (vault -> user) transfer. Never use a real
// wallet or mainnet funds here. Unset in most environments -> claim disabled.
export const VAULT_SECRET_KEY = ENV.VITE_VAULT_SECRET_KEY
