import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { SOLANA_CLUSTER } from '../config'

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL)
}

/**
 * Builds the "stake lock" transaction: a native System Program transfer of
 * `amountSol` from the user's wallet to the vault wallet.
 *
 * The recent blockhash and fee payer are intentionally left unset so the
 * wallet adapter's `sendTransaction` can populate them at send time.
 */
export function buildStakeTransaction(params: {
  from: PublicKey
  vault: PublicKey
  amountSol: number
}): Transaction {
  const { from, vault, amountSol } = params
  return new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: vault,
      lamports: solToLamports(amountSol),
    }),
  )
}

export function explorerTxUrl(
  signature: string,
  cluster: string = SOLANA_CLUSTER,
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`
}

export function explorerAddressUrl(
  address: string,
  cluster: string = SOLANA_CLUSTER,
): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`
}
