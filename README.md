# In The Pocket

Allenati a suonare *in the pocket*. Un'app per macOS che legge via USB-MIDI i colpi della tua batteria
elettronica, fa suonare un metronomo e ti dice quanto sei preciso: anticipo, ritardo e punteggio.

Imposti l'esercizio, ad esempio **120 BPM, cassa in 4ti, charleston in 8vi, rullante in 16esimi**,
oppure scegli un ritmo da studiare (rock, punk, disco, shuffle, funk, swing…), suoni, e vedi in tempo reale
dove cadono i tuoi colpi rispetto alla griglia. A fine esercizio trovi il punteggio, se tendi ad anticipare
o a ritardare, il grafico dello scarto nel tempo e lo storico delle prove.

Sviluppata e provata con una **Millenium MPS-750X**, ma pensata per qualsiasi batteria elettronica USB-MIDI
(la mappatura dei pad si impara colpendoli).

## Come si usa

1. Collega la batteria via USB e apri l'app.
2. In **Strumenti → Mappatura** controlla che i pad corrispondano (di default quelli della MPS-750X).
3. In **Strumenti → Calibrazione** misura la latenza della tua uscita audio (da rifare se cambi cuffie o casse;
   meglio evitare le cuffie Bluetooth).
4. In **Esercizio** scegli un esercizio proposto o un ritmo da studiare, oppure impostane uno tuo, e premi **Parti**.

## Sviluppo

Electron + TypeScript + Vite + React, con Web MIDI API e Web Audio API. Serve Node.js.

```bash
npm install
npm run dev        # app con ricaricamento a caldo
npm test           # test del motore (Vitest)
npm run typecheck
npm run lint
npm run build:mac  # crea l'app in dist/ (senza firma Apple)
```

Per installarla: copia `dist/mac/In The Pocket.app` in */Applicazioni*. Se macOS la blocca al primo avvio:
tasto destro → Apri, oppure `xattr -cr "/Applications/In The Pocket.app"`.

Il piano di sviluppo e le note tecniche sul timing sono in [PIANO.md](PIANO.md).
