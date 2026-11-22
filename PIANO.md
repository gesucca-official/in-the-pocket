# In The Pocket — Piano di sviluppo

App per macOS che legge via USB-MIDI i colpi della batteria elettronica **Millenium MPS-750X**,
fa suonare un metronomo e misura la precisione ritmica rispetto a un esercizio impostato
(es. 120 BPM, cassa in 4/4, hi-hat in 8vi, rullante in 16esimi), con feedback anticipo/ritardo e punteggio.

## Decisioni prese

- **Web app impacchettata con Electron** → app `.app` vera, con Chromium incluso
  (Safari non supporta Web MIDI e sul Mac non c'è Chrome: Electron risolve entrambe le cose).
- Si sviluppa **direttamente sul MacBook**, dove è collegata la batteria.
- Si lavora **dentro la finestra Electron fin dal primo giorno** (con hot reload), così non serve installare Chrome.
- Uso personale: niente firma Apple Developer.

## Stack

- **TypeScript + Vite** tramite **electron-vite** (template React + TS)
- **Web MIDI API** per i colpi, **Web Audio API** per il metronomo
- **Canvas** (requestAnimationFrame) per le corsie dal vivo
- **Vitest** per testare griglia, abbinamento e punteggio
- **localStorage** per impostazioni, mappatura e calibrazione; **IndexedDB** per lo storico (anche solo localStorage all'inizio)
- **electron-builder** per creare l'app finale

## Struttura del codice

```
in-the-pocket/
  src/main/index.ts       processo Electron: finestra, permessi MIDI, backgroundThrottling: false
  src/preload/            ponte tra Electron e interfaccia (per ora vuoto)
  src/renderer/src/       l'app vera e propria
    midi/                 MidiMonitor ✅, useMidiNoteOn ✅ (hook ingresso), padMapping + MappingPanel ✅ (modalità "learn")
    audio/                Metronome (scheduler con lookahead), clock (orologio audio ↔ performance.now)
    engine/               ✅ types, rules (soglie/punti), grid, matcher, scorer + engine.test.ts
    calibration/          misura della latenza
    storage/              impostazioni, preset, storico
    ui/                   schermate: Config, Live, Risultati, Storico, Mappatura, Calibrazione
```

Comandi: `npm install`, `npm run dev` (app con hot reload), `npm test`, `npm run typecheck`,
`npm run lint`, `npm run build:mac` (app per macOS).

La logica in `engine/` deve essere **pura** (niente MIDI, audio o DOM): riceve tempi in ms e restituisce risultati.
Così si testa senza batteria.

## Note tecniche sul timing (la parte delicata)

- **Metronoma senza timer imprecisi**: scheduler con `setInterval` ogni ~25 ms che programma in anticipo
  (lookahead ~100 ms) i click sull'orologio audio (`AudioBufferSourceNode.start(t)`), con accento sul primo movimento.
- **Due orologi da allineare**: i colpi MIDI hanno `event.timeStamp` (base `performance.now()`), i click
  hanno `AudioContext` time. Si converte con `audioCtx.getOutputTimestamp()`:
  `perfMs = ts.performanceTime + (ctxTime - ts.contextTime) * 1000`.
  Ogni colpo atteso viene salvato in ms "performance".
- **Latenza residua** (uscita audio, modulo, cuffie): la si misura con la calibrazione e la si sottrae
  da tutti gli scarti.
- **Electron**: abilitare il permesso MIDI con `session.setPermissionRequestHandler` /
  `setPermissionCheckHandler` (`midi`, `midiSysex`) e impostare `backgroundThrottling: false`.
- **Niente cuffie Bluetooth** per il click (+150-250 ms variabili). Casse o cuffie con filo, oppure
  uscita del Mac → ingresso AUX del modulo per sentire tutto in cuffia.

## Regole di gioco (valori iniziali, poi configurabili)

- **Esercizio**: BPM, battute (es. 4/8/16), battute di count-in (1-2), metro 4/4;
  per ogni strumento una suddivisione: 4ti, 8vi, 16esimi, terzine di 8vo, oppure "spento".
- **Abbinamento**: ogni colpo reale va al colpo atteso **più vicino non ancora abbinato dello stesso strumento**,
  entro una finestra di `min(intervallo/2, 100 ms)`. Fuori finestra = **extra**.
  Un colpo atteso rimasto senza risposta oltre la finestra = **mancato**.
- **Scarto** = tempo colpo − tempo atteso − latenza calibrata. Negativo = **anticipo**, positivo = **ritardo**.
- **Valutazione per colpo**: Perfetto ≤10 ms (100 pt), Buono ≤25 ms (70), OK ≤50 ms (40), Fuori (10), Mancato (0).
- **Statistiche** (totali e per strumento): precisione % (punti / massimo), scarto medio (tendenza a
  correre/trascinare), deviazione standard (costanza), numero di mancati ed extra.

## Fasi

Ogni fase si chiude con l'app funzionante e provata suonando.

### Fase 0 — Preparazione del Mac
- [ ] Collegare il modulo via USB e verificare che compaia in *Configurazione MIDI Audio*
- [ ] Controllare nel menu del modulo le impostazioni MIDI (canale, uscita USB attiva)
- [x] Installare Node.js LTS (es. via Homebrew) e git
- [x] Clonare la repo da GitHub ed eseguire `npm install`
- [x] Creare il progetto con electron-vite (React + TS) dentro la repo, commit *(fatto da Windows)*

**Fatto quando**: `npm run dev` apre la finestra dell'app sul Mac.

### Fase 1 — Monitor MIDI (prova tecnica)
- [x] Permesso MIDI in Electron, elenco dei dispositivi MIDI in ingresso *(scritto, da provare col modulo)*
- [x] Lista in tempo reale dei colpi: nota, velocity, timestamp, anche CC per il pedale hi-hat *(idem)*
- [x] Riempire la tabella delle note qui sotto colpendo ogni pad

**Fatto quando**: ogni pad della batteria compare nella lista.

| Pad | Nota/e MIDI |
|---|---|
| Cassa | 36 |
| Rullante (pelle / cerchio) | 38 / 37 |
| Hi-hat chiuso / aperto / pedale | 42 / 46 / 44 (chick); pedale: CC 4 |
| Tom 1 / 2 / 3 | 48 / 45 / 43 |
| Crash (due piatti) / Ride (centro, campana, bordo) | 55 e 49 / 51, 53, 59 |

### Fase 2 — Mappatura dei pad
- [x] Modalità "learn": scegli lo strumento, colpisci il pad, la nota viene assegnata (più note per strumento)
- [x] Mappatura salvata e ricaricata all'avvio

### Fase 3 — Metronomo
- [x] Scheduler con lookahead, click con accento, BPM regolabile, count-in
- [x] Conversione orologio audio ↔ `performance.now()` (modulo `clock`)

**Fatto quando**: il click resta stabile a lungo anche a 200+ BPM.

### Fase 4 — Esercizio, griglia e abbinamento
- [ ] Schermata di configurazione dell'esercizio
- [x] `Grid`: generazione dei colpi attesi; `Matcher`: abbinamento, extra, mancati (con test Vitest)
- [ ] Vista dal vivo: corsie per strumento con colpi attesi e colpi reali colorati per precisione,
      indicatore anticipo ← → ritardo, ultimo scarto in ms

**Fatto quando**: suonando l'esercizio si vede subito se si è avanti o indietro.

### Fase 5 — Calibrazione
- [ ] 16 click in 4ti; l'utente colpisce un pad qualsiasi; si scartano i primi 4 colpi;
      la mediana degli scarti diventa `latencyOffsetMs`, salvata
- [ ] Ripetibile quando cambi cuffie o casse

### Fase 6 — Punteggio e storico
- [x] `Scorer` con le statistiche descritte sopra (con test)
- [ ] Schermata risultati: punteggio, statistiche per strumento, grafico dello scarto nel tempo
- [ ] Storico delle sessioni e preset di esercizi salvati

### Fase 7 — App installabile
- [ ] Build con electron-builder (target mac, `dir` o `dmg`), icona e nome
- [ ] Copia in */Applicazioni* e sblocco al primo avvio (tasto destro → Apri, oppure
      `xattr -cr "/Applications/In The Pocket.app"`)

### Fase 8 — Extra (a piacere)
- Speed trainer: +N BPM a ogni giro superato con una soglia di precisione
- Battute in cui il click si zittisce, per verificare se tieni il tempo da solo
- Pattern personalizzati (es. rullante solo su 2 e 4) e groove preimpostati
- Dinamiche: costanza della velocity, accenti
- Click suonato dal modulo via MIDI out, se il modulo lo supporta

## Come partire sul Mac

1. Clona la repo: `git clone https://github.com/<utente>/in-the-pocket.git`
2. Apri Claude Code nella cartella `in-the-pocket` e chiedi: *"Leggi PIANO.md e partiamo dalla Fase 0"*.
3. A fine fase: prova suonando, spunta le caselle e fai commit.
