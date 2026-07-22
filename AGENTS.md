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
