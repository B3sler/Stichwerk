# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

Schafkopf app (React Native + Expo Router, TypeScript), per
`docs/superpowers/specs/2026-06-12-schafkopf-mvp-design.md`.

**Phase 1 (Rufspiel end-to-end) is complete and merged to main**: domain rules, bots,
Zustand state stores, and UI/screens for a full playable Rufspiel round against bots.

- `src/domain/` — pure game logic (cards, rules, scoring, engine, bots). No React/RN imports.
- `src/state/` — Zustand stores (`gameStore`, `settingsStore`, persisted via AsyncStorage).
- `src/ui/cards/` and `src/ui/game/` — dumb presentational components (PlayingCard, CardBack,
  PlayerHand, TrickArea, OpponentSeat, BiddingPanel, RoundResult).
- `src/theme/` — forest-green color palette (`colors.ts`) and spacing/radius tokens (`tokens.ts`),
  used directly via plain `View`/`Text`/`StyleSheet` (not the `ThemedView`/`ThemedText` scaffolding).
- `src/app/index.tsx` — the Schafkopf table screen, wired to `useGameStore`.
- `src/ui/testUtils.tsx` — `renderComponent()` wraps `react-test-renderer`'s `create()` in
  `act()`; required for all component tests under the current RN/React versions, otherwise
  `toJSON()`/`.root` fail with "Jest environment has been torn down" errors.

Next up: Phase 2 (Wenz & Solo), per the 4-phase roadmap in the design spec.
