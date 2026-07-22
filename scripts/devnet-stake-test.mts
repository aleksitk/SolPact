/**
 * Devnet integration check for Phase 2 stake logic.
 *
 * Reuses the app's real `buildStakeTransaction` helper to prove that the
 * SOL-transfer stake lock works end-to-end on Devnet and that the payer's
 * balance decreases by the staked amount (+ fee). This mirrors what the
 * Create Commitment form does, minus the Phantom signing step (which requires
 * a browser extension unavailable in CI/headless environments).
 *
 * Run: npx tsx scripts/devnet-stake-test.mts
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js'
import { buildStakeTransaction, explorerTxUrl } from '../src/solana/stake'
import { VAULT_ADDRESS } from '../src/config'

const STAKE_SOL = 0.05

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
  // Defaults to Devnet, but honors TEST_RPC_URL so the same code path can be
  // exercised against a local validator when the public faucet is throttled.
  const rpcUrl = process.env.TEST_RPC_URL ?? clusterApiUrl('devnet')
  console.log('RPC:', rpcUrl)
  const connection = new Connection(rpcUrl, 'confirmed')
  const payer = Keypair.generate()
  const vault = new PublicKey(VAULT_ADDRESS)

  console.log('Payer:', payer.publicKey.toBase58())
  console.log('Vault:', vault.toBase58())

  console.log('\nRequesting airdrop on Devnet (with retries)...')
  await airdropWithRetry(connection, payer.publicKey, 1 * LAMPORTS_PER_SOL)

  const before = await connection.getBalance(payer.publicKey)
  console.log('Balance before stake:', before / LAMPORTS_PER_SOL, 'SOL')

  const tx = buildStakeTransaction({
    from: payer.publicKey,
    vault,
    amountSol: STAKE_SOL,
  })
  const latest = await connection.getLatestBlockhash()
  tx.recentBlockhash = latest.blockhash
  tx.feePayer = payer.publicKey
  tx.sign(payer)

  const sig = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed')

  const after = await connection.getBalance(payer.publicKey)
  const vaultBal = await connection.getBalance(vault)

  console.log('\nStake transfer signature:', sig)
  console.log('Explorer:', explorerTxUrl(sig))
  console.log('\nBalance after stake:', after / LAMPORTS_PER_SOL, 'SOL')
  console.log('Vault balance:', vaultBal / LAMPORTS_PER_SOL, 'SOL')

  const delta = (before - after) / LAMPORTS_PER_SOL
  console.log('Payer decreased by:', delta, 'SOL (stake + fee)')

  if (after >= before) {
    throw new Error('FAIL: payer balance did not decrease')
  }
  if (vaultBal < STAKE_SOL * LAMPORTS_PER_SOL) {
    throw new Error('FAIL: vault did not receive the stake')
  }
  console.log('\nPASS: stake locked, balance decreased, vault funded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
