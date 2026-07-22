# SolPact

**Put your SOL where your goals are.** SolPact is a commitment/accountability app on Solana: stake a small amount of Devnet SOL against a personal goal, check in daily on-chain, and reclaim your stake if you complete the streak — or forfeit it if you break it.

> Built for the **Cursor Tbilisi AI Hackathon** (Cursor Track + Superteam Georgia / Solana Track). **Devnet only — no real funds.**

## Problem

Personal accountability is hard. Habit apps track streaks, but breaking a promise to yourself has no real cost, so it's easy to quit. There's no skin in the game.

## Solution

SolPact adds a real (Devnet) cost to your commitments:

1. **Create a commitment** — set a goal, a stake amount (SOL), and a streak length (days). Your stake is locked by transferring it to a vault wallet.
2. **Check in daily** — one on-chain check-in per day, recorded as a Memo transaction.
3. **Complete the streak** — reclaim your full stake back from the vault.
4. **Break the streak** — miss a day and the stake is forfeited (stays in the vault).

Solana's negligible fees make frequent micro-transactions (daily check-ins on small stakes) economically practical — something that wouldn't work on higher-fee chains.

## How Solana is used

- **Wallet** — `@solana/wallet-adapter-react` + `@solana/wallet-adapter-phantom` for Phantom connect on **Devnet**.
- **Stake lock** — a native **System Program** `transfer` from the user's wallet to a fixed demo **vault** wallet (`src/solana/stake.ts` → `buildStakeTransaction`).
- **Daily check-in** — an **SPL Memo Program** transaction carrying the text `SolPact check-in: Day X/Y` (`buildCheckInTransaction`).
- **Claim** — a System Program `transfer` back from the vault to the user, signed client-side by the demo vault keypair (`src/solana/vault.ts` → `claimStake`).
- **Explorer links** — every on-chain action (stake, each check-in, claim) links to Solana Explorer on the Devnet cluster.

No custom on-chain (Anchor) program is required for the MVP; a PDA-based escrow is a stretch goal.

## How Cursor was used

- Scaffolded the React + Vite + Tailwind project and wired up the Solana wallet-adapter boilerplate.
- Generated the transaction logic (System Program transfers, Memo instruction) and reusable helpers.
- Built the UI components (create-commitment form, dashboard, check-in/claim flows, confetti).
- Wrote the Node integration tests that exercise the stake / check-in / claim paths against a validator.
- Diagnosed and cleaned up dependencies (removed unused heavy adapters) and fixed cross-platform install issues.

## Tech stack

React + Vite + TypeScript · Tailwind CSS v4 · `@solana/web3.js` · `@solana/wallet-adapter` (Phantom) · commitment state in `localStorage`.

## Setup

Requirements: Node 20+ and a browser with the **Phantom** extension set to **Devnet**.

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173/`), connect Phantom on Devnet, and get Devnet SOL from https://faucet.solana.com.

### Enabling the claim (optional, demo)

The claim transfers SOL back from the vault, so the client needs the vault keypair. Copy `.env.example` to `.env` and set `VITE_VAULT_SECRET_KEY` to the vault secret (JSON byte array). **Devnet demo only — never use a real wallet or mainnet funds.** If unset, the claim button is disabled but everything else works.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Lint with oxlint |
| `npm run test:stake` | Devnet/local integration test for the stake transfer |
| `npm run test:checkin` | Integration test for the Memo check-in |
| `npm run test:claim` | Integration test for the vault → user claim |

The `test:*` scripts default to Devnet; the public faucet is often rate-limited, so you can point them at a local validator with `TEST_RPC_URL=http://127.0.0.1:8899` (run `solana-test-validator`).

## Demo flow

Connect wallet → create a commitment (stake transfer + Explorer link) → check in (Memo tx + Explorer link) → complete the streak and claim your stake back (transfer + Explorer link). Break a streak to see the forfeited state.
