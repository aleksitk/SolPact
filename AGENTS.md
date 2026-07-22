# SolPact

React + Vite + TypeScript frontend for a Solana app, using Tailwind CSS v4 and the `@solana/wallet-adapter` stack pointed at **Solana Devnet**.

## Cursor Cloud specific instructions

- Single service: a Vite dev server. Standard scripts live in `package.json`:
  - `npm run dev` — dev server on `http://localhost:5173/`.
  - `npm run build` — `tsc -b && vite build` (also type-checks).
  - `npm run lint` — `oxlint` (this repo lints with oxlint, not ESLint).
- Solana network is hard-coded to **Devnet** in `src/solana/WalletContextProvider.tsx` (`WalletAdapterNetwork.Devnet` + `clusterApiUrl`).
- Browser `Buffer` polyfill: wallet-adapter deps require a global `Buffer`, set in `src/main.tsx`. The `Module "buffer"/"crypto"/"stream" has been externalized` messages during build/dev are expected and harmless.
- Fully testing an actual wallet connection requires the Phantom browser extension, which is not installed in the cloud VM. The connect button and wallet-selection modal (listing Phantom) render and work without it; end-to-end signing needs a real Phantom wallet + Devnet SOL.
- `.npmrc` sets `legacy-peer-deps=true` intentionally. `@solana/wallet-adapter-react` transitively references the Solana Mobile adapter, whose peers would otherwise auto-install `react-native` + the metro/gradle toolchain (heavy, and breaks `npm install` on Windows). Keeping this flag prevents those peers from installing. Do not remove it without re-checking `npm why react-native`.
- Only the Phantom adapter is a direct dependency (`@solana/wallet-adapter-phantom`); do not re-add the `@solana/wallet-adapter-wallets` meta-package (it pulls in every chain's adapter).
- Stake/transfer logic is covered by `npm run test:stake` (`scripts/devnet-stake-test.mts`). The public Devnet faucet is frequently rate-limited; run a local validator (`solana-test-validator`) and point the script at it with `TEST_RPC_URL=http://127.0.0.1:8899` to exercise the same code path deterministically.
