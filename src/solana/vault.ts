import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { VAULT_SECRET_KEY } from '../config'
import { buildClaimTransaction } from './stake'

/**
 * Parses the demo vault keypair from the `VITE_VAULT_SECRET_KEY` env var
 * (a JSON array of bytes). Returns null when unset/invalid so the UI can
 * disable the claim action gracefully. DEMO ONLY — Devnet, never real funds.
 */
export function getVaultKeypair(): Keypair | null {
  if (!VAULT_SECRET_KEY) return null
  try {
    const bytes = JSON.parse(VAULT_SECRET_KEY) as number[]
    if (!Array.isArray(bytes)) return null
    return Keypair.fromSecretKey(Uint8Array.from(bytes))
  } catch {
    return null
  }
}

export function isVaultConfigured(): boolean {
  return getVaultKeypair() !== null
}

/**
 * Sends the claim transfer (vault -> user) signed by the vault keypair and
 * waits for confirmation. Throws if the vault secret is not configured.
 */
export async function claimStake(
  connection: Connection,
  to: PublicKey,
  amountSol: number,
): Promise<string> {
  const vault = getVaultKeypair()
  if (!vault) {
    throw new Error(
      'Vault key not configured. Set VITE_VAULT_SECRET_KEY to enable claims.',
    )
  }

  const tx = buildClaimTransaction({ vault: vault.publicKey, to, amountSol })
  const latest = await connection.getLatestBlockhash()
  tx.recentBlockhash = latest.blockhash
  tx.feePayer = vault.publicKey
  tx.sign(vault)

  const signature = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction({ signature, ...latest }, 'confirmed')
  return signature
}
