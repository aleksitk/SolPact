import { Buffer } from 'buffer'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { SOLANA_CLUSTER } from '../config'

// SPL Memo program (v2), used to record daily check-ins on-chain.
export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)

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

/**
 * Builds a daily check-in transaction: a single SPL Memo instruction carrying
 * the check-in text, signed by the user (their pubkey is included as a signer
 * so the memo is attributable). Blockhash/fee payer are set by the adapter.
 */
export function buildCheckInTransaction(params: {
  from: PublicKey
  memo: string
}): Transaction {
  const { from, memo } = params
  return new Transaction().add(
    new TransactionInstruction({
      keys: [{ pubkey: from, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf8'),
    }),
  )
}

export function checkInMemo(day: number, streakDays: number): string {
  return `SolPact check-in: Day ${day}/${streakDays}`
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
