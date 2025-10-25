# Project Structure and Conventions

This document explains the folder layout and conventions for 10xSwap, so newcomers can navigate quickly and safely.

## Top-level

- app/ — Next.js App Router: routes, layouts, and API endpoints
- components/ — React UI components, grouped by purpose
- lib/ — Domain logic and shared utilities (framework-agnostic)
  - abi/ — Contract ABIs (JSON) exported from blockchain build
  - amm/ — AMM configuration and simple router client helpers
  - onchain/ — Tokens, swap helpers, and chain-specific helpers (planned)
  - routing/ — Local routing math, pools, paths
  - server/ — Server-only utils (filesystem, logging, storage)
  - db/ — Database helpers and clients
- blockchain/ — Smart contracts, scripts, and artifacts
  - contracts/ — Solidity sources
  - scripts/ — Hardhat scripts (e.g., export-abi.ts)
  - artifacts/ — Build output (ignored)
- scripts/ — App CLI and developer tools (non-hardhat)
- data/ — Runtime JSON data (e.g., rules.json, logs.json)
- docs/ — Documentation (architecture, guides, this file)
- public/ — Static assets served by Next.js

## Import paths

- Use `@/lib/...` for logic shared between server and client
- Use `@/lib/abi/...` to import ABIs
- Server-only code must not be imported into client components (place under `lib/server`)

## ABIs

- ABIs are exported to `lib/abi` by `blockchain/scripts/export-abi.ts`
- Do not place ABIs under `app/` to avoid coupling domain assets with UI

## Components grouping (planned)

We’ll gradually organize components into:
- components/layout — Header, Footer, wrappers
- components/marketing — Landing, background effects
- components/agent — Agent dashboard views
- components/trading — Swap and market UI elements

During migration, prefer updating imports or add temporary barrel re-exports if needed.

## Scripts

- blockchain/scripts — Hardhat/build-time scripts
- scripts/ — App-level tooling (tests, utilities)

## Data

- Runtime JSON files are ignored by git (`/data/*.json`)
- Code writing to `data/` must create files if absent

## Notes

- Keep public APIs stable when moving files; update imports or provide re-exports
- Run type-checks after structural changes to catch path issues
