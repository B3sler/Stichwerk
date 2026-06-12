# Schafkopf-App – MVP Design

## Ziel

Eine moderne, optisch ansprechende Schafkopf-App (React Native + Expo, TypeScript), spielbar auf iOS, Android und Web. MVP: offline gegen Bots, mit klarer Trennung von Spiel-Logik und UI, als Basis für spätere Online-Multiplayer-Features und weitere Kartenspiele.

## Regelumfang

- Spielarten: **Rufspiel** (Standard), **Wenz**, **Solo** (Farbsolo), **Ramsch**.
- Klassisches Reizen mit Ansage-Reihenfolge und Vorrang (Rufspiel < Wenz < Solo).
- Vollständige Abrechnung: Augen, Schneider/Schwarz, Laufende, Grundtarif-Berechnung.
- Bots übernehmen sowohl Reizen/Spielwahl als auch Kartenwahl während des Spiels.
- Bots: regelbasiert/heuristisch, inkl. einfacher Partner-Erkennung (z.B. beim Rufspiel).

## Tech-Stack

- **Expo + Expo Router**, TypeScript (strict).
- **State-Management: Zustand**
  - `gameStore`: kapselt die Spiel-Engine (`domain/engine`), exposed Actions wie `placeBid()`, `playCard()`.
  - `settingsStore`: Theme, Kartendesign, Sound – mit `persist`-Middleware (AsyncStorage).
  - Begründung: Der zentrale Spielzustand ist ein zusammenhängendes, serialisierbares Objekt mit klaren Transitions – das passt besser zu einem Store mit Reducer-artigen Actions als zu vielen unabhängigen Atomen (Jotai) oder Context+useReducer-Boilerplate.
- **Styling: NativeWind** (Tailwind für RN) + zentrales `theme/`-Modul für Farb-/Spacing-Tokens. Kartengrafiken als eigene Image/SVG-Komponenten, nicht über Tailwind gestylt.
- **Animationen:** `react-native-reanimated`, gezielt für Kartenbewegungen (Ausspielen, Stich einsammeln).
- **Navigation:** Expo Router, dateibasiert, automatischer Web-Support.

## Visuelles Design

- Dark Mode als Standard, Basis-Palette: dunkles Tannengrün (Tisch/Hintergrund), warme Akzentfarben für Trumpf/Highlights.
- Modern, minimalistisch, aber grafisch hochwertig – individuelle Kartengrafiken statt generischer Vektor-Boxen.
- Kartendeck: **Bayerisches Blatt**, benannt mit Eichel / Laub / Herz / Schell.
- Light Mode als spätere Einstellungs-Option, nicht Fokus des MVP.

## Architektur & Ordnerstruktur

```
app/                          # Expo Router – Screens & Navigation
  (menu)/index.tsx            # Startscreen: Spielmodus-Auswahl
  table/[tableId].tsx         # Spieltisch-Screen
  settings/index.tsx          # Einstellungen
  _layout.tsx                 # Root-Layout, Theme-Provider

src/
  domain/                      # Reine Schafkopf-Logik, kein React/RN
    cards/
      types.ts                 # Card, Suit, Rank
      deck.ts                   # Deck erzeugen, mischen
      ordering.ts               # Kartenwerte & Trumpf-Reihenfolgen je Spielart
    rules/
      gameTypes.ts              # GameType: rufspiel | wenz | solo | ramsch
      trickEvaluation.ts        # Stich-Gewinner ermitteln
      legalMoves.ts              # Erlaubte Karten je Situation
      bidding.ts                 # Reiz-/Ansage-Logik & Rangfolge
      scoring.ts                 # Augen, Schneider/Schwarz, Laufende, Tarif
    engine/
      gameState.ts               # Zentraler State-Typ (serialisierbar)
      gameMachine.ts              # Phasenübergänge: dealing → bidding → playing → scoring → roundEnd
      actions.ts                  # Reine Reducer-Funktionen (state, action) => state
    bots/
      strategy.ts                 # Interface BotStrategy
      simpleBot.ts                # Heuristik: Reizen, Kartenwahl
    __tests__/                    # Unit-Tests für rules/engine

  state/
    gameStore.ts                 # Zustand-Store, wrappt gameMachine
    settingsStore.ts             # Theme, Kartendesign, persist

  ui/
    cards/                        # PlayingCard, Hand, TrickArea
    table/                        # PlayerSeat, TableLayout, BiddingOverlay, ScoreSummary
    common/                       # Button, Screen, ...

  theme/                          # Farb-/Spacing-/Typo-Tokens
  assets/cards/                   # Kartengrafiken (Eichel, Laub, Herz, Schell)
```

### Trennung Domain ↔ UI

- `domain/` enthält keine React/RN-Importe – reine Funktionen und Typen, vollständig unit-testbar.
- `gameMachine.ts` modelliert das Spiel als State-Machine mit klaren Phasen; jede Phase erlaubt nur bestimmte Actions.
- `gameStore.ts` ist die einzige Verbindung zwischen `gameMachine` und React/UI. UI ruft ausschließlich Store-Actions auf (`playCard(card)`, `placeBid(bid)`), nie Domain-Funktionen direkt.
- Bots implementieren `BotStrategy` und operieren auf demselben `GameState` + `legalMoves` wie menschliche Spieler – kein Sonderpfad.

### Vorbereitung für Online-Multiplayer

- `GameState` und Actions sind vollständig serialisierbar (kein React-State, keine Closures).
- Dadurch kann später ein Server denselben `gameMachine` ausführen und Clients per State-Sync/Action-Übertragung anbinden. Für den MVP bleibt dies rein architektonisch – kein UI-Platzhalter für "Online spielen".

## Domain-Kernmodell (Auszug)

```ts
type GameType = 'rufspiel' | 'wenz' | 'solo' | 'ramsch';
type Suit = 'eichel' | 'laub' | 'herz' | 'schell';
type Rank = '7' | '8' | '9' | '10' | 'unter' | 'ober' | 'koenig' | 'ass';

interface GameState {
  phase: 'dealing' | 'bidding' | 'playing' | 'scoring' | 'roundEnd';
  players: Player[];          // Hand, isBot, Position
  dealerIndex: number;
  bidding: BiddingState;      // Ansage-Reihenfolge, aktuelle Ansage, Rufkarte
  activeGame?: ActiveGame;     // gameType, declarer, partner, Trumpf-Reihenfolge
  currentTrick: Trick;         // ausgespielte Karten + wer ist dran
  completedTricks: Trick[];
  scores: RoundScore;          // Augen je Team, Laufende, Schneider/Schwarz, Tarif-Ergebnis
}
```

- `bidding.ts`: Ansage-Reihenfolge und Vorrang (Rufspiel < Wenz < Solo); Spieler können überbieten.
- `trickEvaluation.ts` + `ordering.ts`: spielartspezifische Trumpf-Reihenfolgen (z.B. Wenz: nur Unter als Trumpf; Ramsch: keine Spielmacher-Rolle).
- `scoring.ts`: vollständige Abrechnung am Rundenende basierend auf `completedTricks` und `activeGame`.

## UI/UX

- Mobile-first, Web darf nicht "kaputt" wirken (responsive Layout, Spieltisch zentriert mit max-width auf großen Screens).
- Vier Spielerpositionen am Tisch, eigene Hand unten groß/lesbar, Mitspieler-Karten verdeckt/kompakt.
- Bidding-Overlay für Reizen/Ansagen (auch für Bot-Entscheidungen kurz visualisiert, damit der Ablauf nachvollziehbar bleibt).
- Score-Summary nach jeder Runde mit Abrechnungsdetails (Augen, Schneider/Schwarz, Laufende, Tarif).
- Animationen gezielt: Karte ausspielen, Stich einsammeln.

## Implementierungs-Phasen

1. **Grundgerüst & Rufspiel end-to-end**
   - Projekt-Setup (Expo Router, NativeWind, Zustand, Theme).
   - Domain-Engine + UI vollständig für Rufspiel: Reizen (spielen/nicht spielen + Rufkarte), Spielverlauf, vollständige Abrechnung.
   - Bots reizen/spielen ausschließlich Rufspiel-fähig.
2. **Wenz & Solo**
   - Erweiterung Trumpf-/Ansage-Logik um Wenz und Solo.
   - Bot-Bewertung für Wenz-/Solo-Ansagen.
   - UI-Anpassungen (z.B. keine Rufkarten-Anzeige bei Wenz/Solo).
3. **Ramsch**
   - Sonderfall ohne Spielmacher/Ansage.
   - Eigene Scoring-Regeln (Verteilung statt Team-Sieg).
4. **Politur**
   - Animationen, Settings (Kartendesign-Umschaltung), Feinschliff UI/UX.

Jede Phase ist eigenständig spielbar und testbar.

## Testing

- Unit-Tests für `domain/rules` (Stich-Auswertung, legale Züge, Trumpf-Reihenfolgen je Spielart) und `domain/engine` (Phasenübergänge, Reducer-Actions).
- `domain/rules/scoring.ts`: Tests für Abrechnung inkl. Schneider/Schwarz, Laufende, verschiedener Tarif-Kombinationen.
- Bot-Strategien: Tests, dass Bots ausschließlich legale Aktionen wählen (kein Anspruch auf Spielstärke im MVP).
