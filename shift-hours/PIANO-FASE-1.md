# Piano-contratto — Fase 1: App orari di lavoro (nome provvisorio: Shift Hours)

> Documento autosufficiente per l'esecutore (Claude Code). Non deve servire altro
> ragionamento oltre a quanto scritto qui. Se qualcosa è ambiguo o manca, fermati
> e chiedi — non improvvisare.

---

## 0. Contesto

App web personale per una persona **senza competenze informatiche** (non è
l'utente che dà le istruzioni: è la sua ragazza, che lavora come barista).
Ogni fine settimana deve comunicare al proprio capo, giorno per giorno, le ore
lavorate. Questa app le permette di inserire gli orari trascinando uno slider e
le genera un messaggio pronto da incollare su WhatsApp.

**Priorità assoluta: semplicità d'uso.** Niente testo libero da digitare per
gli orari, niente concetti tecnici visibili, target di tocco grandi, zero
account/login.

**Lingua interfaccia: inglese al 100%.** Documentazione di repo: italiano.

## 1. Regole non negoziabili

1. **Mai testo libero per gli orari** — solo slider a doppia maniglia, step
   fisso 30 minuti (00:00, 00:30, 01:00, ...). Mai un orario tipo 7:27.
2. **Un solo turno al giorno.** Nessuna gestione di doppio turno/pausa.
3. **Un giorno di default è "non lavorato"** finché lei non tocca lo slider.
   Non c'è uno stato intermedio ambiguo.
4. **Il riepilogo WhatsApp elenca SOLO i giorni lavorati** — i giorni non
   lavorati non compaiono affatto (né come riga vuota né come "day off").
5. **Mai perdere dati silenziosamente.** Ogni archiviazione automatica di
   settimana deve essere accompagnata da una notifica visibile (non bloccante,
   non richiede click di conferma).
6. **Nessun backend, nessun account.** Tutto locale sul dispositivo
   (`localStorage` o `IndexedDB`), sito statico.
7. **Nessun dato mostrato ad altri.** L'unico modo in cui i dati "escono"
   dall'app è: (a) il testo copiato per WhatsApp, (b) il file di backup
   scaricato esplicitamente da lei.

## 2. Architettura

- **Sito statico** (HTML/CSS/JS vanilla, no framework — non serve React/Vue per
  una superficie così piccola), impacchettato come **PWA installabile**
  (manifest + service worker per funzionamento offline dopo il primo
  caricamento).
- **Hosting: GitHub Pages** dal branch `main` (o cartella `/docs`), repo
  pubblico dedicato e separato (non dentro il monorepo MyMoney/news-monitor).
- **Persistenza:** `localStorage`, chiavi tipo `shifthours:current-week`,
  `shifthours:history`, `shifthours:settings`.
- **Identità visiva:** prodotta separatamente da Claude Design (vedi Task 0).
  Non inventare palette/token: se il pacchetto di design manca di qualcosa,
  fermati e chiedi — stessa regola già in uso su MyMoney.

## 3. Struttura repo attesa

**Il repo è un monorepo dedicato alla ragazza dell'utente**, non un repo
one-off per questa sola app. Ogni futuro progetto pensato per lei vive in una
propria sottocartella dello stesso repo, così da non dover creare un repo
nuovo ogni volta. Questo progetto (orari di lavoro) è la prima sottocartella.

```
<nome-ragazza>/                   (repo — nome definitivo da confermare con l'utente)
  README.md                       overview del repo: cos'è, elenco progetti dentro
  CLAUDE.md                       regole sempre attive PER TUTTO IL REPO (italiano)

  shift-hours/                    progetto 1: app orari di lavoro (nome provvisorio)
    README.md                     setup e deploy di QUESTO progetto
    PIANO-FASE-1.md               questo file
    design_handoff/               output di Claude Design (styles/, tokens/, reference)
    src/
      index.html
      css/
        styles.css                entry, solo @import (fonts → tokens → componenti)
        tokens/                   colori, tipografia, spaziature, raggi, ombre, motion
      js/
        app.js                    orchestrazione UI, rendering settimana
        slider.js                 componente slider a doppia maniglia
        storage.js                wrapper localStorage (settimana corrente + storico + settings)
        summary.js                genera il testo WhatsApp + copia negli appunti
        week.js                   calcolo settimana corrente/rollover da data reale
      manifest.webmanifest
      service-worker.js
      icons/
        icon-192.png
        icon-512.png

  <prossimo-progetto>/            futuri progetti per lei, stessa logica a sottocartelle
```

Nessuna nuova cartella fuori da questa struttura senza che sia nel piano.

**Implicazioni pratiche di questa scelta:**
- **Repo pubblico** (come `news-monitor`). Nessun dato personale/sensibile
  della ragazza va mai committato nel codice o nella history — solo codice e
  configurazione. Va bene perché l'app stessa non contiene dati: tutto vive in
  `localStorage` sul suo telefono, mai nel repo.
- **URL pulito e dedicato** per `shift-hours` (non un sotto-percorso lungo):
  si ottiene con una **GitHub Actions workflow** che pubblica SOLO il
  contenuto di `shift-hours/src` sulla root del branch `gh-pages`, invece di
  servire l'intero repo così com'è. Risultato:
  `https://<utente>.github.io/<nome-ragazza>/` porta direttamente
  all'app, senza `/shift-hours/` nell'URL. Vedi Task 9 per i dettagli.
- **Trade-off da tenere presente per il futuro**: un repo GitHub può avere
  **una sola root di GitHub Pages**. Finché `shift-hours` è l'unico progetto,
  occupa la root senza problemi. Quando in futuro si aggiungerà un secondo
  progetto per lei nello stesso repo, andrà deciso se: (a) il nuovo progetto
  vive a un sotto-percorso mentre `shift-hours` resta sulla root, oppure
  (b) si passa a un dominio personalizzato con sottodomini/percorsi dedicati
  per progetto. Non è un problema da risolvere ora — lo riprendiamo quando
  arriva il secondo progetto.
- **`CLAUDE.md` di repo vs. regole di progetto**: le regole davvero comuni a
  tutto ciò che si farà per lei (es. "mai account/login", "sempre semplicità
  estrema", "mai dati condivisi senza il suo consenso") stanno nel `CLAUDE.md`
  alla radice del repo. Le regole specifiche di *questo* progetto (step da 30
  minuti, un turno al giorno, ecc.) restano in questo `PIANO-FASE-1.md`,
  dentro `shift-hours/`.

## 4. Task

### Task 0 — Identità visiva (Claude Design)
- **Output atteso:** pacchetto `design_handoff/` con token CSS (colori,
  tipografia, spaziature, raggi, ombre) + foglio componenti + eventualmente una
  pagina HTML statica di riferimento.
- **Criteri di accettazione:**
  - Contrasto testo/sfondo AA per accessibilità.
  - Target di tocco (slider, bottoni) pensati per uso reale su telefono, non
    solo desktop.
  - Nessun colore hardcoded fuori dai token.
- **Vincolo:** identità nuova e libera, non deve replicare la palette MyMoney
  (lime `#A6DA47`) — è un prodotto diverso, per una persona diversa.

### Task 1 — Setup progetto & shell PWA
- **File:** `index.html`, `manifest.webmanifest`, `service-worker.js`,
  `css/styles.css` (collega i token di Task 0), `icons/`.
- **Criteri:**
  - Manifest valido, l'app risulta installabile ("Add to Home Screen" su iOS/Android).
  - Dopo il primo caricamento, l'app si apre anche offline (asset core in cache).

### Task 2 — Componente slider orario
- **File:** `js/slider.js`.
- **Criteri:**
  - Doppia maniglia trascinabile, range 05:00–24:00, step 30 minuti, **mai**
    valori fuori step.
  - Mostra in tempo reale l'intervallo scelto (es. "7:30 – 17:00") e le ore
    decimali corrispondenti.
  - Stato iniziale del giorno: nessun intervallo impostato ("non lavorato").
- **Vincolo:** nessun input testuale libero come alternativa allo slider.

### Task 3 — Vista settimanale e totali
- **File:** `js/app.js`, `index.html`.
- **Criteri:**
  - 7 giorni Mon→Sun visibili in ordine fisso.
  - Totale ore settimanale ricalcolato automaticamente ad ogni modifica.

### Task 4 — Impostazioni
- **File:** `js/app.js` (sezione settings), `js/storage.js`.
- **Criteri:**
  - Toggle "Weekend only": se attivo, nasconde Mon–Fri e mostra solo Sat/Sun.
  - Il toggle persiste tra sessioni.
  - Disattivare il toggle non cancella i dati dei giorni nascosti.

### Task 5 — Riepilogo WhatsApp
- **File:** `js/summary.js`.
- **Criteri:**
  - Genera testo con **solo i giorni lavorati**, formato esatto:
    `Monday: 7:30/17:00 - 9.5 hrs` (una riga per giorno lavorato).
  - Riga finale: `Total: XX.X hrs`.
  - Pulsante "Copy summary" → Clipboard API, con fallback per browser che non
    la supportano, e conferma visiva che la copia è avvenuta.

### Task 6 — Persistenza e rollover automatico della settimana
- **File:** `js/week.js`, `js/storage.js`.
- **Criteri:**
  - All'apertura, l'app calcola la settimana corrente (Mon→Sun) dalla data
    reale del dispositivo.
  - Se la settimana salvata come "corrente" non coincide con quella calcolata
    ora, la settimana precedente viene **archiviata automaticamente** nello
    storico e si apre una settimana nuova vuota.
  - Questa archiviazione mostra una notifica non bloccante (es. banner
    temporaneo "Week of 4–10 Aug saved to history") — non richiede click di
    conferma, ma è sempre visibile.
- **Vincolo:** mai un'archiviazione silenziosa senza notifica.

### Task 7 — Storico settimane
- **File:** `js/app.js`, `js/storage.js`.
- **Criteri:**
  - Lista delle settimane passate, ciascuna con l'intervallo di date.
  - Ogni settimana passata è riapribile per rivedere/ricopiare il suo riepilogo.

### Task 8 — Backup/esportazione dati
- **File:** `js/storage.js`, `js/app.js`.
- **Criteri:**
  - Pulsante "Download backup" che scarica un file `.json` con settimana
    corrente + intero storico.
  - Non serve import/reimportazione in questa fase (fuori scope, valutare in
    futuro se richiesto).

### Task 9 — Deploy
- **File:** `.github/workflows/deploy-shift-hours.yml` (alla root del repo).
- **Criteri:**
  - GitHub Actions workflow che, ad ogni push su `main` che tocca
    `shift-hours/src/**`, pubblica il contenuto di `shift-hours/src` sulla
    root del branch `gh-pages`.
  - GitHub Pages del repo configurato per servire da `gh-pages` (root),
    non da `main`.
  - URL finale pulito: `https://<utente>.github.io/<nome-ragazza>/`.
  - Testato da un dispositivo mobile reale: installazione PWA, uso offline,
    slider, copia riepilogo, rollover settimanale, backup.

## 5. Assunzioni da confermare con l'utente prima di chiudere il progetto

- Range slider 05:00–24:00 copre i turni reali? (nessun turno oltre
  mezzanotte è stato menzionato — se capita, va gestito separatamente).
- Nome definitivo del progetto/repo (qui usato "Shift Hours" come segnaposto).

## 6. Dipendenze tra task

Task 0 (design) → Task 1 (shell) → Task 2, 3, 4 in parallelo → Task 5, 6, 7, 8
→ Task 9 (deploy) per ultimo, solo a fine review.

## 7. Nota sul workflow

Segue lo stesso protocollo di `WORKFLOW-AGENTI.md` del progetto MyMoney:
pianificazione autosufficiente (questo documento) → esecuzione meccanica →
review con piena autorità di correzione. Fermarsi e far provare l'utente dopo
ogni task completato, non aspettare la fine di tutti i task.
