/**
 * Devnet integration check for Phase 5 claim logic.
 *
 * Reuses the app's real `buildClaimTransaction` to prove that the stake can be
 * transferred back from the vault to the user, with the vault signing. Mirrors
 * the dashboard "Claim your stake" flow (which signs client-side with the demo
 * vault keypair).
 *
 * Run: npx tsx scripts/devnet-claim-test.mts
 *   (honors TEST_RPC_URL to target a local validator when the faucet is down)
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js'
import { buildClaimTransaction, explorerTxUrl } from '../src/solana/stake'

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
  const rpcUrl = process.env.TEST_RPC_URL ?? clusterApiUrl('devnet')
  console.log('RPC:', rpcUrl)
  const connection = new Connection(rpcUrl, 'confirmed')
  const vault = Keypair.generate()
  const user = Keypair.generate()

  console.log('Vault:', vault.publicKey.toBase58())
  console.log('User: ', user.publicKey.toBase58())

  // Fund the vault so it holds the stake (+ enough for the claim fee).
  console.log('\nFunding vault...')
  await airdropWithRetry(connection, vault.publicKey, 1 * LAMPORTS_PER_SOL)

  const userBefore = await connection.getBalance(user.publicKey)
  const vaultBefore = await connection.getBalance(vault.publicKey)
  console.log('User before:', userBefore / LAMPORTS_PER_SOL, 'SOL')
  console.log('Vault before:', vaultBefore / LAMPORTS_PER_SOL, 'SOL')

  // Vault signs the claim transfer back to the user (mirrors claimStake()).
  const tx = buildClaimTransaction({
    vault: vault.publicKey,
    to: user.publicKey,
    amountSol: STAKE_SOL,
  })
  const latest = await connection.getLatestBlockhash()
  tx.recentBlockhash = latest.blockhash
  tx.feePayer = vault.publicKey
  tx.sign(vault)

  const sig = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed')

  const userAfter = await connection.getBalance(user.publicKey)
  const vaultAfter = await connection.getBalance(vault.publicKey)

  console.log('\nClaim signature:', sig)
  console.log('Explorer:', explorerTxUrl(sig))
  console.log('\nUser after:', userAfter / LAMPORTS_PER_SOL, 'SOL')
  console.log('Vault after:', vaultAfter / LAMPORTS_PER_SOL, 'SOL')
  console.log('User gained:', (userAfter - userBefore) / LAMPORTS_PER_SOL, 'SOL')

  if (userAfter - userBefore !== STAKE_SOL * LAMPORTS_PER_SOL) {
    throw new Error('FAIL: user did not receive exactly the staked amount')
  }
  if (vaultAfter >= vaultBefore) {
    throw new Error('FAIL: vault balance did not decrease')
  }
  console.log('\nPASS: stake reclaimed from vault to user.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
