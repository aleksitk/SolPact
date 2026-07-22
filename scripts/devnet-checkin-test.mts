/**
 * Devnet integration check for Phase 4 check-in logic.
 *
 * Reuses the app's real `buildCheckInTransaction` / `checkInMemo` helpers to
 * prove that a daily check-in lands on-chain as an SPL Memo transaction. This
 * mirrors the dashboard's "Check in today" flow minus the Phantom signing step
 * (which needs a browser extension unavailable headlessly).
 *
 * Run: npx tsx scripts/devnet-checkin-test.mts
 *   (honors TEST_RPC_URL to target a local validator when the faucet is down)
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js'
import {
  buildCheckInTransaction,
  checkInMemo,
  explorerTxUrl,
  MEMO_PROGRAM_ID,
} from '../src/solana/stake'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function airdropWithRetry(
  connection: Connection,
  to: PublicKey,
  lamports: number,
  attempts = 6,
) {
  for (let i = 0; i < attempts; i++) {
    try {
      const sig = await connection.requestAirdrop(to, lamports)
      const bh = await connection.getLatestBlockhash()
      await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
      return
    } catch (err) {
      const wait = 2000 * (i + 1)
      console.log(
        `  airdrop attempt ${i + 1} failed (${(err as Error).message}); retrying in ${wait}ms`,
      )
      await sleep(wait)
    }
  }
  throw new Error('Devnet airdrop failed after retries (faucet rate limit)')
}

async function main() {
  const rpcUrl = process.env.TEST_RPC_URL ?? clusterApiUrl('devnet')
  console.log('RPC:', rpcUrl)
  const connection = new Connection(rpcUrl, 'confirmed')
  const user = Keypair.generate()

  console.log('User:', user.publicKey.toBase58())
  console.log('\nRequesting airdrop...')
  await airdropWithRetry(connection, user.publicKey, 1 * LAMPORTS_PER_SOL)

  const memo = checkInMemo(1, 7)
  console.log('Memo:', JSON.stringify(memo))

  const tx = buildCheckInTransaction({ from: user.publicKey, memo })
  const latest = await connection.getLatestBlockhash()
  tx.recentBlockhash = latest.blockhash
  tx.feePayer = user.publicKey
  tx.sign(user)

  const sig = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed')

  console.log('\nCheck-in signature:', sig)
  console.log('Explorer:', explorerTxUrl(sig))

  const parsed = await connection.getParsedTransaction(sig, {
    commitment: 'confirmed',
  })
  const logs = parsed?.meta?.logMessages ?? []
  const usedMemo = logs.some((l) => l.includes('Memo'))
  const hasProgram = (parsed?.transaction.message.instructions ?? []).some(
    (ix) => ix.programId.toBase58() === MEMO_PROGRAM_ID.toBase58(),
  )

  console.log('\nMemo program invoked:', hasProgram)
  console.log('Memo in logs:', usedMemo)
  console.log('Log messages:')
  logs.forEach((l) => console.log('  ', l))

  if (!hasProgram) {
    throw new Error('FAIL: memo program was not invoked')
  }
  const memoLogged = logs.some((l) => l.includes('SolPact check-in'))
  if (!memoLogged) {
    throw new Error('FAIL: memo text not found in transaction logs')
  }
  console.log('\nPASS: check-in memo transaction confirmed on-chain.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
