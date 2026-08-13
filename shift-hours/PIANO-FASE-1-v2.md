# Piano-contratto — Fase 1 (versione 2): App orari di lavoro — "WebApp for Shift Hours"

> Documento autosufficiente per l'esecutore. Non deve servire altro ragionamento
> oltre a quanto scritto qui. Se qualcosa è ambiguo o manca, fermati e chiedi —
> non improvvisare.
>
> **Questa versione sostituisce `PIANO-FASE-1.md`**, che resta nel repo solo come
> traccia storica. In caso di conflitto tra i due documenti, **vale questo**.
> L'elenco puntuale delle differenze è nella sezione 9.

---

## 0. Contesto

App web personale per **Viktoria**, barista, madrelingua inglese e **senza
competenze informatiche** (non è l'utente che dà le istruzioni: è la sua
ragazza). Ogni fine settimana deve comunicare al proprio capo, giorno per
giorno, le ore lavorate. Oggi lo fa scrivendo il messaggio a mano nelle note del
telefono e ricopiandolo su WhatsApp. Questa app le permette di inserire gli
orari trascinando uno slider e le genera lo stesso messaggio, pronto da
incollare.

**Priorità assoluta: semplicità d'uso.** Niente testo libero da digitare per gli
orari, niente concetti tecnici visibili, target di tocco grandi, zero
account/login.

**Lingua interfaccia: inglese al 100%** (è la sua madrelingua). Documentazione di
repo: italiano.

**Dispositivo di riferimento: iPhone 15, Safari.** L'app deve funzionare anche su
altri iPhone (l'utente la prova su un modello diverso) e in modo decente su
desktop, ma iPhone è il target su cui si decide ogni compromesso.

---

## 1. Regole non negoziabili

1. **Mai testo libero per gli orari** — solo slider a doppia maniglia più
   pulsanti di regolazione fine. Mai una tastiera per inserire un orario.
2. **Scatto fisso di 5 minuti.** Ogni orario è un multiplo di 5 minuti
   (7:30, 17:20, 16:15…). Mai un orario tipo 7:27.
3. **Un solo turno al giorno.** Nessuna gestione di doppio turno o pausa.
4. **Un giorno di default è "non lavorato"** finché lei non tocca lo slider di
   quel giorno. Non esiste uno stato intermedio ambiguo.
5. **Ogni giorno impostato si può riportare a "non lavorato"** con un solo tocco
   (pulsante ✕). Un tocco accidentale non deve poter finire nel messaggio al
   capo senza possibilità di rimuoverlo.
6. **Il riepilogo elenca SOLO i giorni lavorati** — i giorni non lavorati non
   compaiono affatto (né riga vuota né "day off").
7. **Mai perdere dati silenziosamente.** Ogni archiviazione automatica di
   settimana è accompagnata da una notifica visibile, non bloccante.
8. **Nascondere non è cancellare.** Cambiare tipo di settimana nasconde dei
   giorni ma non ne cancella mai i dati: tornando al tipo precedente, i dati
   sono ancora lì.
9. **Nessun backend, nessun account.** Tutto locale sul dispositivo
   (`localStorage`), sito statico.
10. **Nessun dato mostrato ad altri.** L'unico modo in cui i dati escono
    dall'app è: (a) il testo che lei copia per WhatsApp, (b) il file di backup
    che lei scarica esplicitamente. Mai un invio automatico.
11. **Nessun colore o valore estetico inventato fuori dai token** di
    `design_handoff/`.
12. **Nessun file fuori dalla cartella `shift-hours/`** senza istruzione
    esplicita dell'utente (unica eccezione prevista: il workflow di deploy del
    Task 9, che per forza vive alla root del repo e va autorizzato a parte).
13. **La paga oraria non si scrive mai nel codice.** È un importo personale e il
    repo è pubblico: vive solo in `localStorage`, inserita da lei una volta
    nelle impostazioni. Nessun valore di default nel sorgente.

---

## 2. Architettura

- **Sito statico**, HTML/CSS/JS vanilla, nessun framework, nessuna dipendenza da
  scaricare, nessun passaggio di build. I file che stanno nel repo sono
  esattamente i file che girano sul telefono.
- **PWA installabile**: manifest + service worker, funzionamento offline dopo il
  primo caricamento.
- **Hosting: GitHub Pages servito dal branch `gh-pages`**, popolato da una
  GitHub Actions workflow che pubblica **solo** il contenuto di
  `shift-hours/src` sulla root di quel branch. URL finale pulito:
  `https://<utente>.github.io/Viktoria/`.
  *(La versione 1 del piano in un punto diceva "da `main` o `/docs`: quella
  indicazione è superata, vale il branch `gh-pages`.)*
- **Persistenza:** `localStorage`, chiavi `shifthours:current-week`,
  `shifthours:history`, `shifthours:settings`.
- **Identità visiva:** vedi Task 0. In questa fase è una **base minima e
  provvisoria**, pensata solo per poter provare le funzioni; verrà ridisegnata
  in seguito da Claude Design sostituendo il solo pacchetto `design_handoff/`.

**Deve sembrare un'app, non un sito.** Vincoli di interfaccia validi per tutti i
task:

- **Tre schermate in tutto**, non una di più: settimana (quella che apre
  sempre), storico, impostazioni. Storico e impostazioni si aprono come
  pannelli sopra la schermata principale e si chiudono con una ✕.
- **La schermata principale sta in una schermata sola** su iPhone 15: barra in
  alto fissa (settimana + tipo), elenco dei giorni al centro, barra in basso
  fissa con totale, paga stimata e pulsante di copia. Il pulsante di copia è
  sempre raggiungibile senza scorrere.
- **Lo slider si apre dentro la riga del giorno**, non in un'altra schermata:
  un giorno alla volta, aprendone uno si chiude il precedente.
- Larghezza massima del contenuto 480 px, centrato: su desktop resta una
  colonna da telefono, non si sparpaglia.
- Niente barre di scorrimento orizzontali, niente elementi che escono dallo
  schermo, niente zoom automatico di Safari sui campi.

---

## 3. Struttura file attesa

Tutto dentro `shift-hours/`, nessuna cartella in più:

```
shift-hours/
  README.md                     setup e deploy di questo progetto
  PIANO-FASE-1.md               piano v1 (storico, superato)
  PIANO-FASE-1-v2.md            questo file
  design_handoff/
    tokens/
      colors.css                colori
      typography.css            tipografia
      space.css                 spaziature, raggi, ombre
    components.css              stili dei componenti
    reference.html              pagina statica di riferimento dei componenti
  src/
    index.html
    css/
      styles.css                entry: solo @import (token → componenti → layout)
      app.css                   layout e schermate specifiche dell'app
    js/
      app.js                    orchestrazione UI, rendering settimana, settings, storico
      slider.js                 componente slider a doppia maniglia
      storage.js                wrapper localStorage (settimana corrente, storico, settings)
      summary.js                genera il testo del messaggio + copia negli appunti
      week.js                   calcolo settimana corrente, rollover, formattazione date/ore
    manifest.webmanifest
    service-worker.js
    icons/
      icon-192.png
      icon-512.png
```

I file di `design_handoff/` vengono **copiati** (non linkati) dentro `src/css/`
al Task 1, perché `src/` deve essere pubblicabile da solo: la copia dei token
dentro `src/css/tokens/` è quella che gira in produzione, `design_handoff/` è la
sorgente di verità da cui si aggiorna.

---

## 4. Modello dati

Tutti gli orari sono **minuti dalla mezzanotte**, multipli di 5. Range ammesso:
300 (05:00) → 1440 (24:00).

```js
// shifthours:settings
{
  lastTypeId: "week",              // tipo usato per l'ultima settimana aperta
  hourlyRate: null,                // paga oraria netta, inserita da lei. null = paga nascosta
  customTypes: [                   // massimo 3
    { id: "custom-1", name: "☕ Mornings", days: [1,3,5] }
  ]
}

// shifthours:current-week
{
  weekStart: "2026-08-10",         // lunedì della settimana, formato ISO
  typeId: "week",
  typeName: "Week",                // congelato al momento della scelta
  days: {                          // chiave = 1 (lunedì) … 7 (domenica)
    "1": { start: 450, end: 1040 } // giorno assente dall'oggetto = non lavorato
  }
}

// shifthours:history  — array, più recente per primo
[ { weekStart, typeId, typeName, days } ]
```

**Tipi di settimana:**

| id | nome | giorni | modificabile |
|---|---|---|---|
| `week` | Week | 1–7 (lun→dom) | no, fisso |
| `weekend` | Weekend | 6–7 (sab, dom) | no, fisso |
| `custom-1..3` | scelto da lei | almeno 1 giorno | sì |

Il tipo decide **solo quali giorni vede nell'app**. Non compare mai nel
messaggio generato.

`typeName` viene salvato dentro la settimana e non cambia più: se lei rinomina o
elimina un tipo personalizzato, le settimane già archiviate restano com'erano.

---

## 5. Formato esatto del messaggio

Questa sezione è vincolante alla lettera: il messaggio è ciò che riceve il suo
capo e su cui viene pagata.

```
Week ending 5 July
Monday: 7:30/17:20 - 9.50 hrs
Wednesday: 7:30/17:00 - 9.30 hrs
Friday: 7:30/17:00 - 9.30 hrs
Saturday: 8:30/16:15 - 7.45 hrs
Sunday: 9:00/17:25 - 8.25 hrs
45 hours
```

**Prima riga** — sempre presente, sempre uguale per qualunque tipo di settimana:
`Week ending ` + giorno (senza zero davanti) + spazio + **nome del mese per
intero in inglese** della **domenica** di quella settimana di calendario. Nessun
anno. Anche se il tipo di settimana non include la domenica, la data è comunque
quella della domenica.

**Righe dei giorni** — una per ogni giorno lavorato, sempre in ordine da lunedì a
domenica, solo i giorni previsti dal tipo di settimana:
`<Giorno>: <inizio>/<fine> - <durata> hrs`

- nome del giorno in inglese con l'iniziale maiuscola, seguito da due punti;
- orari in formato 24 ore, senza zero davanti all'ora (`7:30`, `17:20`), minuti
  sempre a due cifre, separati da `/` senza spazi;
- poi ` - `, la durata, uno spazio, `hrs`.

**Durata: ore e minuti, NON decimali.** `9.50 hrs` significa 9 ore e 50 minuti
(è la convenzione che lei già usa col capo). Regole:

| durata reale | si scrive |
|---|---|
| 8 ore esatte | `8 hrs` |
| 9 ore e 50 minuti | `9.50 hrs` |
| 7 ore e 45 minuti | `7.45 hrs` |
| 9 ore e 5 minuti | `9.05 hrs` |
| 45 minuti | `0.45 hrs` |

I minuti sono sempre a due cifre; le ore tonde non hanno decimali.

**Ultima riga** — il totale della settimana, senza etichetta:

| totale reale | si scrive |
|---|---|
| 45 ore esatte | `45 hours` |
| 45 ore e 25 minuti | `45 hours and 25 minutes` |
| 1 ora esatta | `1 hour` |
| 1 ora e 30 minuti | `1 hour and 30 minutes` |
| 45 minuti | `45 minutes` |

**Caso "un solo giorno lavorato"** — restano solo intestazione e riga del
giorno, il totale sparisce perché ripeterebbe la stessa cifra:

```
Week ending 5 July
Monday: 7:30/17:20 - 9.50 hrs
```

**Caso "nessun giorno lavorato"** — non si genera nessun messaggio: il pulsante
di copia è spento e mostra `No hours added this week yet`.

Nessuna riga vuota, nessun separatore, nessuna emoji, nessun nome di tipo di
settimana dentro il messaggio.

### 5.1 Paga stimata — solo dentro l'app

Accanto al totale della settimana l'app mostra una stima di quanto ha
guadagnato: **ore totali × paga oraria netta**.

- Il calcolo usa le **ore decimali vere**, non la notazione ore.minuti: una
  settimana da `45 hours and 25 minutes` vale 45,4167 ore (non 45,25), quindi
  con paga 9.45 → `429.14`.
- Arrotondamento a 2 decimali, formato `429.14€`.
- La paga oraria si inserisce **una volta** nelle impostazioni. Finché non c'è,
  la riga della paga non compare affatto: l'app funziona identica senza.
- **La paga stimata non entra mai nel messaggio copiato.** Il messaggio che va
  al capo resta esattamente quello della sezione 5. La stima è
  un'informazione per lei.
- È una **stima**, e l'etichetta lo dice (`Estimated pay`): non tiene conto di
  straordinari, festivi, trattenute o arrotondamenti del datore di lavoro.

---

## 6. Task

Ogni task si chiude fermandosi e facendo provare il risultato all'utente prima
di passare al successivo.

### Task 0 — Base grafica provvisoria
- **File:** `design_handoff/tokens/colors.css`, `typography.css`, `space.css`,
  `design_handoff/components.css`, `design_handoff/reference.html`.
- **Contenuto:**
  - Palette: sfondo bianco, testo nero, blu `#1B47C9` per gli elementi
    interattivi (slider, pulsanti, stati attivi), più le varianti di grigio
    necessarie per bordi e stati disabilitati. Nessun altro colore.
  - Solo tema chiaro.
  - Tipografia: stack di sistema (`-apple-system`), nessun font da scaricare.
  - Token per spaziature, raggi, ombre, durate delle animazioni.
- **Criteri di accettazione:**
  - Contrasto testo/sfondo conforme AA (testo nero su bianco; bianco su
    `#1B47C9` verificato per i pulsanti pieni).
  - Ogni target di tocco (maniglie slider, pulsanti ✕ e ±, toggle) ha area
    utile ≥ 44×44 px, come da linee guida iOS.
  - `reference.html` mostra tutti i componenti previsti (riga-giorno vuota,
    riga-giorno compilata con ✕, slider, pulsanti ±, selettore del tipo di
    settimana, barra in basso con totale e paga stimata, pulsante primario,
    pulsante disabilitato, banner di notifica, riga dello storico) e si apre
    senza errori in console.
  - `reference.html` mostra anche le tre schermate intere alla larghezza di un
    iPhone 15 (settimana, storico, impostazioni), per verificare il vincolo
    "deve sembrare un'app" prima di scrivere il codice vero.
  - Nessun colore scritto a mano fuori dai token.
- **Vincolo:** è una base **provvisoria e volutamente minimale**, serve solo per
  provare le funzioni. Deve essere sostituibile in blocco da Claude Design senza
  toccare l'HTML o il JS.

### Task 1 — Shell dell'app e PWA
- **File:** `src/index.html`, `src/css/styles.css`, `src/css/app.css`,
  `src/css/tokens/*` (copia da `design_handoff/`), `src/manifest.webmanifest`,
  `src/service-worker.js`, `src/icons/icon-192.png`, `src/icons/icon-512.png`.
- **Criteri:**
  - Manifest valido: `name` = `WebApp for Shift Hours`, `short_name` =
    `Shift Hours`, `display: standalone`, `theme_color` e `background_color`
    dai token.
  - `apple-touch-icon` e meta iOS presenti: aggiunta alla home da Safari
    funzionante su iPhone.
  - Icone segnaposto: quadrato blu pieno con una "S" bianca centrata,
    dichiaratamente temporanee.
  - Rispetto della safe area iPhone (notch e barra inferiore) via
    `viewport-fit=cover` e `env(safe-area-inset-*)`.
  - Dopo il primo caricamento, l'app si apre anche in modalità aereo.
  - Il service worker si aggiorna senza lasciare l'utente su una versione
    vecchia bloccata.

### Task 2 — Slider orario
- **File:** `src/js/slider.js`.
- **Criteri:**
  - Doppia maniglia trascinabile, range 05:00–24:00, scatto 5 minuti, mai
    valori fuori scatto.
  - Le maniglie non si scavalcano; durata minima 5 minuti.
  - Sotto lo slider, due coppie di pulsanti `−` / `+` (una per l'inizio, una per
    la fine) che spostano di 5 minuti per tocco.
  - Mostra in tempo reale l'intervallo e la durata nello **stesso formato del
    messaggio** (`7:30/17:20 - 9.50 hrs`), mai in decimali.
  - Stato iniziale del giorno: nessun intervallo impostato, il giorno risulta
    "non lavorato".
- **Vincolo:** nessun campo di testo, nessuna tastiera, in nessun caso.

### Task 3 — Vista settimanale e totale
- **File:** `src/js/app.js`, `src/js/week.js`, `src/index.html`.
- **Criteri:**
  - In cima: la settimana corrente identificata come `Week ending 5 July`.
  - I giorni previsti dal tipo di settimana attivo, sempre in ordine
    lunedì→domenica.
  - Ogni giorno già impostato mostra un pulsante ✕ che lo riporta a "non
    lavorato"; i giorni non lavorati non mostrano la ✕.
  - Totale della settimana ricalcolato ad ogni modifica, nel formato della
    sezione 5 (`45 hours` / `45 hours and 25 minutes`).
  - Accanto al totale, la paga stimata come da sezione 5.1, se la paga oraria è
    stata impostata; altrimenti niente.
  - Il giorno di oggi è visivamente evidenziato.
  - Su iPhone 15 la schermata sta tutta dentro senza scorrere quando il tipo di
    settimana è `Weekend`, e con al massimo uno scorrimento breve con `Week`.

### Task 4 — Tipi di settimana
- **File:** `src/js/app.js`, `src/js/storage.js`.
- **Criteri:**
  - Selettore in cima alla schermata che mostra il tipo corrente e lo cambia con
    un tocco, tra: `Week`, `Weekend` e gli eventuali tipi personalizzati.
  - In impostazioni si possono creare fino a **3 tipi personalizzati**, ognuno
    con un nome (massimo 20 caratteri, emoji ammesse) e la scelta di quali
    giorni includere (almeno 1). Rinominabili ed eliminabili.
  - `Week` e `Weekend` sono fissi: non rinominabili, non eliminabili.
  - Cambiare tipo nasconde o mostra dei giorni ma **non cancella mai i dati** dei
    giorni nascosti, che riappaiono intatti tornando al tipo precedente.
  - Il messaggio generato elenca solo i giorni previsti dal tipo attivo, anche se
    altri giorni hanno dati salvati.
  - Eliminare un tipo personalizzato non altera le settimane già archiviate, che
    conservano il nome che avevano.
  - La scelta persiste tra le sessioni: una settimana nuova si apre già con il
    tipo usato l'ultima volta.
  - Nelle impostazioni c'è il campo **paga oraria netta**: vuoto di default, mai
    precompilato nel codice (regola 13), con tastierino numerico. Svuotarlo fa
    sparire la paga stimata ovunque nell'app.

### Task 5 — Messaggio e copia
- **File:** `src/js/summary.js`.
- **Criteri:**
  - Genera il testo **esattamente** come da sezione 5, casi limite compresi
    (un solo giorno, nessun giorno, totale non tondo, durate sotto l'ora).
  - Anteprima del messaggio visibile nell'app prima di copiarlo: quello che vede
    è identico a quello che copia.
  - Pulsante `Copy summary` → Clipboard API, con fallback per browser che non la
    supportano, e conferma visiva avvenuta la copia.
  - Con nessun giorno lavorato il pulsante è spento e mostra
    `No hours added this week yet`.
  - Nessun invio automatico a nessuno: l'app copia e basta, è lei a incollare.

### Task 6 — Settimana corrente e rollover automatico
- **File:** `src/js/week.js`, `src/js/storage.js`.
- **Criteri:**
  - All'apertura l'app calcola la settimana corrente (lunedì→domenica) dalla data
    del dispositivo.
  - Se la settimana salvata come corrente non è quella di oggi, viene archiviata
    nello storico e se ne apre una nuova vuota con lo stesso tipo di settimana.
  - L'archiviazione mostra un banner temporaneo non bloccante, es.
    `Week ending 5 July saved to history`, che non richiede click.
  - Una settimana vuota (nessun giorno lavorato) non viene archiviata: viene
    semplicemente sostituita, senza banner.
  - Se lei non apre l'app per più settimane, viene archiviata solo l'ultima
    settimana salvata; le settimane intermedie mai aperte non esistono.
  - Aprire l'app a metà settimana (es. mercoledì) mostra la settimana in corso
    già pronta, senza chiedere niente.
- **Vincolo:** mai un'archiviazione silenziosa di dati inseriti.

### Task 7 — Storico
- **File:** `src/js/app.js`, `src/js/storage.js`.
- **Criteri:**
  - Elenco delle settimane passate, più recente in cima, ognuna identificata come
    `Week ending 5 July 2026` (nello storico l'anno c'è, per non confondere
    settimane di anni diversi — nel messaggio copiato no).
  - Ogni settimana passata è riapribile per rivedere e ricopiare il suo
    messaggio, con lo stesso formato della sezione 5.
  - Ogni settimana passata è **modificabile** (stessi slider della corrente) ed
    **eliminabile**, con conferma prima di eliminare.
  - La settimana corrente si può **svuotare** ("Clear week"): tutti i giorni
    tornano a "non lavorato", la settimana resta al suo posto. Anche qui con
    conferma.
  - Nessun limite al numero di settimane conservate.

### Task 8 — Backup
- **File:** `src/js/storage.js`, `src/js/app.js`.
- **Criteri:**
  - Pulsante `Download backup` che scarica un file `.json` con settimana
    corrente + intero storico + impostazioni.
  - Nome file con la data del giorno, es. `shift-hours-backup-2026-08-13.json`.
  - Nessuna reimportazione in questa fase (fuori scope).

### Task 9 — Deploy
- **File:** `.github/workflows/deploy-shift-hours.yml` **alla root del repo**.
- **Attenzione:** è l'unico file previsto fuori da `shift-hours/`. Prima di
  crearlo serve un via libera esplicito dell'utente, come da regola 12.
- **Criteri:**
  - Ad ogni push su `main` che tocca `shift-hours/src/**`, il workflow pubblica
    il contenuto di `shift-hours/src` sulla root del branch `gh-pages`.
  - GitHub Pages del repo configurato per servire da `gh-pages` (root).
  - URL finale: `https://<utente>.github.io/Viktoria/`.
  - Provato su iPhone reale: installazione dalla home, uso offline, slider,
    pulsanti ±, ✕, cambio tipo di settimana, copia del messaggio, rollover,
    backup.

---

## 7. Dipendenze tra task

Task 0 → Task 1 → Task 2 e 3 → Task 4 → Task 5, 6, 7, 8 → Task 9 per ultimo,
solo a fine review.

---

## 8. Punti confermati con l'utente

- Range slider 05:00–24:00: nessun turno oltre la mezzanotte, mai capitato.
- Turni sempre di diverse ore; il minimo tecnico di 5 minuti serve solo a
  impedire un turno da zero.
- Nome dell'app: `WebApp for Shift Hours`, abbreviato in `Shift Hours` sotto
  l'icona.
- Icona definitiva da decidere più avanti: per ora segnaposto.
- Estetica definitiva da Claude Design in un secondo momento.
- Repo pubblico, monorepo `Viktoria`, questo progetto in `shift-hours/`.

## 9. Cosa cambia rispetto a `PIANO-FASE-1.md`

1. **Scatto dello slider da 30 a 5 minuti.** I suoi orari reali finiscono in
   `:20`, `:15`, `:25`, `:10`: con lo scatto da 30 minuti avrebbe dovuto
   arrotondare e dichiarare al capo ore diverse da quelle lavorate. Compensato
   dai pulsanti `−`/`+` per la precisione senza dover centrare il dito.
2. **Formato del messaggio riscritto** sulla base dei messaggi che manda
   davvero: intestazione `Week ending <domenica>`, durate in ore e minuti
   (`9.50 hrs` = 9h50m, non 9,5 ore), totale in parole (`45 hours and 25
   minutes`). La v1 prevedeva decimali e `Total: XX.X hrs`.
3. **"Weekend only" diventa "tipi di settimana":** oltre a `Week` e `Weekend`
   fissi, fino a 3 tipi personalizzati con nome, emoji e giorni a scelta. Il
   tipo non compare nel messaggio.
4. **Aggiunta la ✕ per riportare un giorno a "non lavorato"** (nella v1 mancava
   del tutto il modo di annullare).
5. **Storico modificabile ed eliminabile**, e settimana corrente svuotabile
   (nella v1 lo storico era di sola lettura).
6. **Deploy chiarito:** branch `gh-pages` via GitHub Actions; sparisce
   l'alternativa "da `main` o `/docs`" che contraddiceva il Task 9.
7. **Identità visiva:** base minima provvisoria bianco/nero/`#1B47C9` fatta qui,
   redesign successivo affidato a Claude Design.
8. **Target dichiarato iPhone/Safari**, con conseguenze esplicite su safe area,
   dimensioni dei tocchi e installazione dalla home.
9. **Aggiunta la paga stimata** (ore × paga oraria netta), visibile solo dentro
   l'app e mai nel messaggio, con la paga oraria salvata solo sul telefono.
10. **Aggiunti i vincoli "deve sembrare un'app"**: tre schermate in tutto,
    schermata principale senza scorrimenti inutili, slider dentro la riga del
    giorno.

## 10. Nota sul metodo

Pianificazione autosufficiente (questo documento) → esecuzione meccanica → review
con piena autorità di correzione. Ci si ferma e si fa provare l'utente **dopo
ogni task**, non alla fine di tutti.
