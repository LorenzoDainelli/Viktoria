# Piano-contratto — Fase 3: scontrino, bank holiday, storico paghe, calendario

> Documento scritto **prima** di qualunque riga di codice, come le Fasi 1 e 2.
> Vale come contratto: se durante la costruzione serve deviare da qui, ci si
> ferma e si chiede.

Data: 14 agosto 2026
Stato di partenza: Fase 2 completa e in uso su due iPhone (versione
`backup-shift-hours-v2.0`, commit `4ebd0d4`).

---

## 0. Perché questa fase

Quattro cose diverse, che si tengono per mano più di quanto sembri.

**Una toppa.** Il pulsante `This week`, quello che riporta alla settimana in
corso quando lei sta guardando una settimana passata, **non ha nessuna regola
CSS**: la classe `sh-chip` è scritta in `index.html` e non esiste in nessun
foglio di stile. È testo nudo accanto a due pulsanti tondi ben fatti. È un buco
aperto dalla Fase 1, ed è in produzione adesso.

**Il riepilogo diventa leggibile.** Oggi il riquadro sotto i giorni ripete il
messaggio così com'è, riga dopo riga, senza colonne. Diventa uno **scontrino
incolonnato**: le stesse informazioni, ma verificabili con un'occhiata invece
che leggendole una per una. Serve a lei per accorgersi di un errore **prima** di
mandare le ore al capo.

**I bank holiday.** In Irlanda sono dieci giorni l'anno e nel bar di Viktoria
sono pagati il doppio. Oggi l'app non lo sa: la paga stimata di una settimana
con dentro un festivo è sbagliata per difetto, e lei non ha modo di accorgersene
guardando l'app.

**La paga oraria non ha memoria.** Oggi è un numero solo, e la stima si
ricalcola sempre da quello. Il giorno che prende un aumento, **tutto il passato
si rivaluta al prezzo nuovo**: settimane già pagate a una cifra ne mostrerebbero
un'altra. È un dato falso, e più a lungo l'app resta in uso più diventa falso.

E infine **il calendario**, che è la conseguenza naturale delle due cose sopra:
una volta che l'app sa quali giorni valgono il doppio e quanto valeva un'ora in
un certo giorno, il mese intero diventa una cosa che si può guardare.

---

## 1. Fatti verificati prima di scrivere questo piano

Qui stanno le cose che ho controllato, non quelle che ho supposto. Servono a chi
legge questo documento fra un anno per non rifare le stesse verifiche.

### 1.1 Le date dei bank holiday si calcolano, non si copiano

Le dieci feste irlandesi sono fissate da regole, non da una lista che qualcuno
pubblica ogni anno:

| festa | regola |
|---|---|
| New Year's Day | 1 gennaio |
| St Brigid's Day | **primo lunedì di febbraio**, ma se l'1 cade di venerdì è quel venerdì |
| St Patrick's Day | 17 marzo |
| Easter Monday | il lunedì dopo la Pasqua (calcolo gregoriano) |
| May / June / August | **primo lunedì** di maggio, giugno, agosto |
| October | **ultimo lunedì** di ottobre |
| Christmas Day | 25 dicembre |
| St Stephen's Day | 26 dicembre |

Le regole vanno implementate; **una lista scritta a mano è vietata**, perché
scade e sbaglia in silenzio. La prova che il rischio è reale: cercando "Irish
bank holidays 2026" si trova scritto che St Brigid's Day 2026 cade l'1 febbraio.
È falso — l'1 è una domenica, quindi la festa è **lunedì 2**. Con una lista
copiata, quel giorno sarebbe stato pagato metà.

Date verificate contro le pubblicazioni ufficiali:

| 2026 | | 2027 | |
|---|---|---|---|
| gio 1 gen | New Year's Day | ven 1 gen | New Year's Day |
| **lun 2 feb** | St Brigid's Day | lun 1 feb | St Brigid's Day |
| mar 17 mar | St Patrick's Day | mer 17 mar | St Patrick's Day |
| lun 6 apr | Easter Monday | lun 29 mar | Easter Monday |
| lun 4 mag | May | lun 3 mag | May |
| lun 1 giu | June | lun 7 giu | June |
| lun 3 ago | August | lun 2 ago | August |
| lun 26 ott | October | lun 25 ott | October |
| ven 25 dic | Christmas Day | sab 25 dic | Christmas Day |
| sab 26 dic | St Stephen's Day | dom 26 dic | St Stephen's Day |

Nessuna sostituzione quando cadono di sabato o domenica: in Irlanda le feste
sono le date, non i giorni lavorativi spostati. Otto su dieci sono **lunedì**.

### 1.2 Il ×2 è la politica del suo bar, non la legge

La legge irlandese (Organisation of Working Time Act 1997, sezione 21) **non
impone il doppio**. Chi lavora in un giorno festivo ha diritto, a scelta del
datore di lavoro, a una di quattro cose: un giorno di paga in più, un giorno
libero pagato, un giorno di ferie in più, o un giorno libero entro il mese.

Nel bar di Viktoria si applica il doppio. **Confermato dall'utente il 14 agosto
2026** ed è su questo che l'app calcola. Se un giorno cambiasse, si cambia il
moltiplicatore in un punto solo (vedi §4.3).

### 1.3 Il giallo scelto è sotto la soglia di contrasto

Misurato sul pallino da 7px, `#FFD60A`:

| sfondo | contrasto |
|---|---|
| bianco (`--sh-bg`) | 1.4:1 |
| giorno lavorato (`--sh-primary-soft`) | **1.2:1** |
| *pallino blu di oggi, per confronto* | *6.5 – 7.5:1* |

La soglia per un elemento grafico che porta informazione è **3:1**. Il giallo
scelto non ci arriva, e nessun giallo che sembri giallo ci arriva: il primo che
passa è `#B67A00`, che non è più giallo ma bronzo, e si confonde con l'arancione
delle copie di sicurezza.

**Scelta dell'utente, presa avendo visto le alternative affiancate** (7px pieno,
10px pieno, 10px con anello, bronzo 7px). Si usa `#FFD60A` a 7px, identico al
pallino blu.

Conseguenza accettata e messa a verbale: **sul telefono al sole quel pallino può
non vedersi.** Per questo la stessa informazione compare anche nel calendario,
dove il cerchio giallo è più grande e sta su fondo chiaro, e per questo il
pallino porta comunque un nome accessibile (`aria-label`) che non cambia
l'aspetto ma lo rende leggibile a VoiceOver.

### 1.4 Lo scontrino sta in 35 caratteri

Formato verificato, misure fissate dall'utente: dopo il nome del giorno più
lungo (`Wednesday`) tre spazi prima di un'ora a una cifra, due se ne ha due;
tre spazi fra la fine del turno e le ore.

```
       Week ending 16 August
-----------------------------------
Monday      9:00 - 17:00      8 hrs
Tuesday     9:00 - 17:00      8 hrs
Wednesday  10:00 - 17:00      7 hrs
Thursday    9:00 - 16:30   7.30 hrs
Friday      9:00 - 17:00      8 hrs
Saturday    8:30 - 17:00   8.30 hrs
Sunday      9:00 - 17:00      8 hrs
-----------------------------------
Total                      55 hours
```

Provato sui casi che sfasano le colonne: turno che finisce alle `9:30`, turno
che finisce a `24:00`, totale con i minuti. Restano tutti dentro i 35 caratteri.

Reso dentro il fumetto vero a 393px di larghezza: **a 14px ci sta senza
scorrimento orizzontale** ed è la dimensione più leggibile fra quelle provate.

---

## 2. Regole non negoziabili di questa fase

Si aggiungono a quelle di `PIANO-FASE-1-v2.md` e `PIANO-FASE-2.md`, che restano
tutte valide.

1. **Il messaggio che arriva al capo non cambia di un carattere.** Lo scontrino
   vive solo dentro l'app. Sono due funzioni separate: quella che costruisce il
   testo da copiare non si tocca. Questa è la regola più importante del piano —
   è il testo su cui Viktoria viene pagata.
2. **Le ore non si moltiplicano mai.** Il ×2 dei bank holiday tocca **solo** il
   calcolo di `Estimated pay`. Nella riga del giorno, nel totale della settimana,
   nello scontrino e nel messaggio le ore restano quelle davvero lavorate.
3. **Cambiare la paga oraria non cambia mai il passato.** Ogni giorno viene
   valutato con la paga in vigore **quel giorno**.
4. **La prima paga vale dall'inizio dei tempi**, anche per le settimane
   precedenti alla data in cui è stata inserita. Vale sempre, anche dopo
   cancellazioni.
5. **Ogni modifica allo storico delle paghe chiede conferma**, e la conferma
   dice cosa sta per succedere con i numeri dentro. Mai un'azione muta su un
   dato che cambia gli importi del passato.
6. **Senza paga oraria il calendario non colora e non mostra importi.** Mostra i
   giorni e i festivi, e basta. Nessun numero inventato, nessun ripiego.
7. **Il calendario è in sola lettura.** Non modifica ore, non cancella
   settimane, non apre modifiche. Si guarda.
8. **Nessun colore o valore fuori dai token.** Il giallo festivo e i sei livelli
   della sfumatura sono token nuovi, con il contrasto annotato accanto come si è
   sempre fatto.
9. **Un backup della Fase 1 o 2 deve continuare a ripristinarsi.**
10. **Nessun dato reale nel repo.** Gli esempi in `design_handoff/` e nei test
    sono inventati (regola 3 di `CLAUDE.md`).
11. **Nessun file fuori da `shift-hours/`.**

---

## 3. Come funziona, in italiano

### 3.1 `Your week` — lo scontrino

L'etichetta sopra il riquadro passa da `Message preview` a **`Your week`**.

Il motivo è preciso: se sopra c'è scritto "anteprima del messaggio" ma quello
che si copia è diverso da quello che si vede, l'etichetta sta dicendo una cosa
falsa, e lei presume che al capo arrivi lo scontrino. `Your week` descrive senza
promettere.

Dentro il riquadro va il testo della §1.4: monospazio, 14px, incolonnato. Il
font è `ui-monospace` — su iPhone è **SF Mono**, già installato. Nessun font
scaricato: sarebbe l'unico file esterno dell'app e un rischio offline su una
cosa che deve funzionare sempre.

Il pulsante `Copy summary` continua a copiare **esattamente il testo di oggi**:

```
Week ending 16 August
Monday: 9:00 - 17:00 8 hrs
...
55 hours
```

### 3.2 `sh-chip`

Il pulsante `This week` prende la forma a pillola coerente con gli altri
elementi della testata: fondo tenue, testo blu, angoli tondi, freccia e testo
allineati, area di tocco ≥ 44×44.

Nessuna decisione di prodotto: è una toppa a un difetto.

### 3.3 I bank holiday

**Nella settimana.** Il giorno che è festivo porta un pallino giallo `#FFD60A`
da 7px **a destra del nome**, speculare al pallino blu di oggi che sta a
sinistra. Un giorno può averli entrambi.

Il pallino compare **sempre**, che lei abbia lavorato o no: serve anche a
sapere in anticipo che lunedì prossimo è festa.

**Nel conto.** Se in un giorno festivo ha lavorato, quelle ore contano il doppio
**solo** in `Estimated pay`:

```
paga stimata = Σ  (minuti del giorno / 60) × paga in vigore quel giorno × (festivo ? 2 : 1)
```

Ovunque altro il giorno vale le ore che vale.

### 3.4 Lo storico delle paghe

Oggi nelle impostazioni c'è un campo solo, `Hourly rate`. Diventa una **lista**.

**Le regole:**

- La **prima** paga vale dall'inizio dei tempi. Se lei la inserisce oggi, vale
  anche per le settimane di due mesi fa.
- Ogni paga successiva entra in vigore **il giorno in cui la crea**, e la
  precedente resta valida fino al giorno prima. Se il 10 gennaio 2026 inserisce
  11.50€, il 9 gennaio vale ancora la vecchia e il 10 vale la nuova.
- Una paga si può **modificare** — sia l'importo sia la data — e **cancellare**.
  La data modificabile serve davvero: se il capo le dice il 15 che l'aumento
  partiva dall'1, senza quello lei è bloccata.
- Cancellando una paga, il periodo che copriva **torna a quella precedente**.
  Cancellando l'unica rimasta, la paga stimata sparisce e basta.

**Il conto giorno per giorno.** Il 10 gennaio 2026 è un sabato: quella settimana
ha cinque giorni alla paga vecchia e due alla nuova. Per questo la stima non si
calcola più sulla settimana ma **sommando i giorni**. È l'unico modo perché il
numero sia esatto.

**Le conferme**, in inglese come tutta l'app, con i numeri dentro, sul pannello
che esiste già per `Delete this week`:

| azione | testo | pulsante |
|---|---|---|
| aggiunta | `From today your pay is 11.50€ an hour. Weeks before today keep 10.20€.` | `Save` |
| modifica | `This pay changes from 10.20€ to 11.50€. It affects 6 weeks.` | `Save` |
| cancellazione | `Delete 11.50€ an hour? Those weeks go back to 10.20€.` | `Delete` (rosso) |
| cancellazione dell'ultima | `Delete 10.20€ an hour? Estimated pay will stop showing.` | `Delete` (rosso) |

### 3.5 Il calendario

**Come ci si arriva.** Una terza icona nella testata, **a sinistra** di quella
dello storico. Stessa forma tonda, stesso stile, tratto 2, disegnata con lo
stesso set di regole delle altre otto.

**Cosa mostra.** Un mese alla volta, uno sotto l'altro, che si scorrono
verticalmente in continuo. Ogni mese ha il nome e l'anno in cima, le iniziali
dei giorni, e la griglia da sette colonne che parte dal lunedì.

**La casella di un giorno** contiene, dall'alto in basso:

- il numero del giorno;
- sotto, molto piccolo, il **guadagno di quel giorno arrotondato all'euro**
  (`30€`, `31€`) — mai i centesimi, che restano solo nella stima settimanale;
- il fondo colorato con una **sfumatura** che va dal quasi bianco al blu pieno,
  in base a quanto ha guadagnato quel giorno;
- se è un bank holiday, un **cerchio giallo `#FFD60A` attorno al numero**, dello
  stesso giallo del pallino della schermata settimana.

Un giorno senza ore non ha né colore né importo: resta la casella vuota col
numero.

**La scala della sfumatura è per mese.** Il giorno più pagato del mese che si
sta guardando prende il colore più intenso, gli altri si distribuiscono sotto.
Non è la scala di sempre: se fosse quella, un turno da dodici ore a Natale
schiaccerebbe tutti gli altri mesi in un grigio indistinguibile per anni.
Ogni mese usa tutta la gamma e i giorni si confrontano con quelli del loro mese.

**Il ×2 dei festivi entra nella sfumatura**, perché quel giorno ha davvero reso
il doppio. Conseguenza da sapere: un bank holiday lavorato sarà quasi sempre la
casella più scura del suo mese.

**Il testo sopra il colore.** Il problema vero di questa schermata: lo stesso
colore di testo non può funzionare sul quasi-bianco e sul blu pieno. Si risolve
**non** calcolando la luminosità a tempo di esecuzione, ma con **sei livelli
fissi**, ognuno con il proprio colore di testo già verificato AA e scritto nei
token. Il contrasto è garantito per costruzione, non sperato.

**Senza paga oraria**: nessun colore, nessun importo. Restano i numeri e i
cerchi gialli dei festivi. È utile lo stesso e non inventa niente.

**Fin dove si scorre.** Dal mese della prima settimana registrata fino a
**dodici mesi dopo oggi**, così può guardare avanti quando cadono i prossimi
festivi. Oltre non c'è niente da vedere.

---

## 4. Modello dati

### 4.1 Le paghe

Dentro `shifthours:settings`, una chiave nuova:

```json
"rates": [
  { "from": "2025-11-03", "amount": 10.20 },
  { "from": "2026-01-10", "amount": 11.50 }
]
```

- Ordinate per `from` crescente.
- Per un giorno qualunque: vale **l'ultima paga il cui `from` è ≤ quel giorno**.
- Se il giorno è **precedente a tutte**, vale comunque **la prima** (regola 4).
- Lista vuota o assente = nessuna stima, come oggi quando il campo è vuoto.

**Migrazione.** Il valore `hourlyRate` di oggi diventa la prima e unica voce
della lista. Siccome la prima vale dall'inizio dei tempi, **il giorno
dell'aggiornamento non cambia un centesimo di niente**: nessuna migrazione da
spiegare a Viktoria.

`hourlyRate` continua a essere **scritto** nei file di backup, come copia della
paga più recente, così un telefono rimasto a una versione vecchia riesce ancora
a leggere il file. Non è più letto dall'app: la verità è `rates`.

### 4.2 Il file di backup diventa versione 3

```json
{
  "app": "shift-hours",
  "version": 3,
  "settings": {
    "rates": [ ],
    "hourlyRate": 11.50
  }
}
```

Al ripristino: se c'è `rates` si usa quello; se c'è solo `hourlyRate` (file di
Fase 1 o 2) diventa la prima voce della lista. Nessun file già salvato smette di
funzionare.

### 4.3 Il moltiplicatore dei festivi

Costante unica, in `holidays.js`, con il commento che spiega da dove viene:

```js
/* Nel bar di Viktoria i bank holiday sono pagati il doppio (confermato il
   14 agosto 2026). Non è un obbligo di legge — la legge irlandese lascia
   scegliere al datore fra quattro forme di compenso. Se cambia, si cambia
   qui e in nessun altro posto. */
export const HOLIDAY_MULTIPLIER = 2;
```

### 4.4 Token nuovi

```
--sh-holiday: #FFD60A       giallo dei bank holiday
--sh-heat-0 … --sh-heat-5   sei livelli, da --sh-primary-softer a --sh-primary
--sh-heat-ink-0 … -5        il colore del testo per ciascun livello, AA verificato
--sh-mono                   ui-monospace, "SF Mono", Menlo, Consolas, monospace
--sh-size-mono: 0.875rem    14px — solo lo scontrino
```

### 4.5 Classi nuove

```
.sh-chip (esisteva senza regole)  .sh-day__holiday
.sh-rates .sh-raterow .sh-raterow__amount .sh-raterow__from .sh-raterow__edit
.sh-cal .sh-cal__month .sh-cal__title .sh-cal__weekdays .sh-cal__grid
.sh-cal__day .sh-cal__day--holiday .sh-cal__day--today .sh-cal__num .sh-cal__pay
```

Nessuna classe esistente viene rinominata o eliminata.

---

## 5. Struttura file attesa

```
shift-hours/
  PIANO-FASE-3.md                  questo file
  design_handoff/
    tokens/colors.css              + giallo festivo, + i sei livelli e i loro inchiostri
    tokens/typography.css          + --sh-mono, --sh-size-mono
    components.css                 + .sh-chip, .sh-day__holiday, .sh-rate*, .sh-cal*
    reference.html                 aggiornato (vedi Task 0)
  src/
    css/tokens/colors.css          copia
    css/tokens/typography.css      copia
    css/components.css             copia
    index.html                     + icona calendario, + layer calendario, + lista paghe
    js/
      holidays.js                  NUOVO — le dieci feste calcolate, il moltiplicatore
      rates.js                     NUOVO — quale paga vale in un giorno
      calendar.js                  NUOVO — griglia dei mesi, livelli della sfumatura
      summary.js                   + buildReceipt()   (buildSummary NON si tocca)
      storage.js                   + rates, backup versione 3
      app.js                       + scontrino, pallino, paghe, calendario
    service-worker.js              + i tre file nuovi in CORE_ASSETS
  README.md                        aggiornato
```

Nessun'altra cartella, nessun file nuovo, nessuna dipendenza.

> **`service-worker.js` non è un dettaglio.** Un file `.js` nuovo che non entra
> in `CORE_ASSETS` fa partire l'app rotta quando è offline. È già successo in
> Fase 2 ed è stato preso per un soffio.

---

## 6. Task

Ogni task si chiude fermandosi e facendo provare il risultato prima di passare
al successivo. I task sono in tre blocchi: alla fine di ogni blocco l'app è
completa e usabile, e si può decidere di fermarsi lì.

### Blocco A — le due cose piccole

#### Task 0 — Rimettere in pari `reference.html`
- **File:** `design_handoff/reference.html`.
- **Perché:** è il documento su cui si approva la grafica, quindi va allineato
  **prima** di aggiungerci roba nuova. La Fase 2 c'è già dentro (avviso
  arancione, riga di stato, conferma di ripristino). Mancano invece **cinque
  componenti che esistono nell'app e non compaiono qui**, e due punti in cui il
  documento **non corrisponde più al codice**.
- **Cosa manca:**
  - `sh-chip` — il pulsante `This week`, mai mostrato. È quello che il Task 1
    deve vestire: senza un campione qui, non c'è niente da approvare.
  - `sh-rate` / `sh-rate__currency` — il prefisso `€` del campo della paga.
  - `sh-typename` — il campo per dare il nome a un tipo di settimana.
  - `sh-empty` — lo storico quando è vuoto.
  - `sh-scrim` e il foglio vero: oggi la conferma è testo sciolto
    (`sh-sheet__title` senza `.sh-sheet` attorno), non un foglio che sale.
- **Cosa è fuori sincrono:**
  - nella schermata impostazioni il campo della paga è un `input` nudo, mentre
    l'app ha il prefisso `€`;
  - la conferma dice `Cancel`, l'app dice `Keep it`.
- **Criteri:**
  - I cinque componenti hanno un campione, con il markup **identico a quello che
    l'app produce davvero** (verificato contro `src/index.html` e `src/js/app.js`,
    non a memoria).
  - I due punti fuori sincrono sono allineati.
  - Le quattro schermate intere si aprono a 390px senza scorrimento orizzontale.
  - Dati inventati.

#### Task 1 — `sh-chip`, e i nomi dei tipi di settimana
- **File:** `design_handoff/components.css`, `design_handoff/reference.html`,
  `src/css/components.css`, `src/index.html`, `src/js/storage.js`,
  `src/js/app.js`.
- **Criteri:**
  - Il pulsante `This week` ha forma, colore e peso coerenti con la testata, e
    **porta le parole scritte**: chi lo usa non è tecnica, e una freccia da sola
    non dice dove porta.
  - Area di tocco ≥ 44×44.
  - Contrasto AA verificato e annotato.
  - Con il titolo più lungo (`26 September`) la testata **non va a capo** e non
    scorre in orizzontale a 393px, verificato sull'app vera nello stato in cui
    la pillola compare davvero.
  - `design_handoff/` e `src/css/` restano identici.
- **Aggiunte chieste dall'utente durante il task:**
  - Il tipo fisso `Week` si chiama **`Full Week`**.
  - Con tutti e sette i giorni selezionati l'elenco diventa **`Mon to Sun`**
    invece di `Mon · Tue · Wed · Thu · Fri · Sat · Sun`, che andava a capo e non
    diceva niente di più.
  - Una settimana archiviata prima di questo cambio deve mostrare **il nome
    nuovo**: i tipi fissi non si possono cancellare, quindi il loro nome
    attuale vince sempre su quello salvato dentro la settimana. Per i tipi
    personalizzati continua a valere il nome salvato, che è l'unico rimasto
    quando quel tipo è stato eliminato.
- **Nota sul perimetro:** questo task tocca anche `src/index.html` e `src/js/`,
  cosa che il piano non prevedeva. Il motivo è la richiesta dell'utente sui
  nomi dei tipi, che vive nel codice e non nel CSS.

#### Task 2 — `Your week` e lo scontrino
- **File:** `design_handoff/tokens/typography.css`, `design_handoff/components.css`,
  `src/css/`, `src/index.html`, `src/js/summary.js`.
- **Criteri:**
  - Nuova funzione `buildReceipt(week, days)`. **`buildSummary()` non viene
    toccata**: verificato con `git diff` che le sue righe siano invariate.
  - Il testo prodotto è largo **esattamente 35 caratteri** con i dati della §1.4.
  - Le colonne reggono con: ora d'inizio a due cifre (`10:00`), ora di fine a una
    cifra (`9:30`), fine a `24:00`, totale con i minuti, un solo giorno lavorato.
  - Nessun giorno lavorato → il riquadro mostra lo stesso testo vuoto di oggi.
  - A 390px il riquadro **non scorre in orizzontale**.
  - L'etichetta dice `Your week`.
  - **Prova decisiva:** copiato negli appunti, il testo è identico carattere per
    carattere a quello prodotto dalla versione precedente.

### Blocco B — festivi e paghe

#### Task 3 — `src/js/holidays.js`
- **File:** `src/js/holidays.js` (nuovo).
- **Contenuto:** funzioni pure, niente DOM, niente `localStorage`.
- **Criteri:**
  - Le dieci feste calcolate **dalle regole**, mai da una lista scritta a mano.
  - Verificate contro la tabella della §1.1 per 2026 e 2027, giorno per giorno.
  - St Brigid's Day 2026 = **2 febbraio** (non l'1). St Brigid's Day 2027 =
    1 febbraio.
  - Easter Monday 2026 = 6 aprile, 2027 = 29 marzo.
  - October 2026 = 26 ottobre, 2027 = 25 ottobre, 2028 = **30** ottobre
    (ultimo lunedì: nel 2028 il 31 ottobre è un martedì, quindi il 30 è
    l'ultimo lunedì — non il 23).
  - Un anno qualunque fra 2020 e 2040 non solleva errori.
  - Nessun uso di UTC: si ragiona sull'orologio del telefono, come `week.js`.

#### Task 4 — `src/js/rates.js`
- **File:** `src/js/rates.js` (nuovo), `src/js/storage.js`.
- **Contenuto:** lettura e scrittura della lista, e `rateOn(day)`.
- **Criteri:**
  - Giorno precedente a tutte le paghe → torna **la prima** (regola 4).
  - Giorno esattamente uguale a un `from` → vale la paga **nuova**.
  - Lista vuota → `null`, e chi chiama non mostra nessuna stima.
  - Migrazione: un `settings` con solo `hourlyRate` produce una lista di una
    voce, e **la stima di tutte le settimane esistenti resta identica al
    centesimo**. Da verificare con un confronto prima/dopo, non a occhio.
  - Aggiunta, modifica e cancellazione mantengono la lista ordinata e senza due
    voci con la stessa data.

#### Task 5 — Le paghe nelle impostazioni
- **File:** `design_handoff/components.css`, `src/css/`, `src/index.html`,
  `src/js/app.js`.
- **Criteri:**
  - La lista mostra importo e data d'inizio; la prima dice che vale dall'inizio.
  - Aggiunta, modifica e cancellazione, ognuna con la conferma della §3.4, con i
    numeri veri dentro.
  - Cancellando la penultima, il periodo torna alla precedente; cancellando
    l'ultima, `Estimated pay` sparisce dalla schermata settimana.
  - Con una paga sola il pannello **non è più complicato di oggi** da usare.
  - Ogni pulsante ha area di tocco ≥ 44×44.

#### Task 6 — Pallino giallo e ×2
- **File:** `design_handoff/tokens/colors.css`, `design_handoff/components.css`,
  `src/css/`, `src/js/app.js`.
- **Criteri:**
  - Pallino `#FFD60A` da 7px a destra del nome, presente anche nei giorni non
    lavorati, con nome accessibile (`Bank holiday`).
  - Un giorno che è insieme oggi e festivo mostra **entrambi** i pallini senza
    che la riga vada a capo.
  - `Estimated pay` di una settimana con un festivo lavorato è **esattamente il
    doppio** su quel giorno, calcolato con la paga in vigore quel giorno.
  - Le ore mostrate nel giorno, nel totale, nello scontrino e nel messaggio
    **non cambiano** (regola 2). Da verificare confrontando il messaggio prima e
    dopo.
  - Una settimana a cavallo di un cambio di paga somma i giorni, non moltiplica
    il totale: verificato a mano su un caso costruito apposta.

#### Task 7 — Backup versione 3
- **File:** `src/js/storage.js`.
- **Criteri:**
  - L'esportazione scrive `rates` **e** `hourlyRate` (copia della più recente).
  - Un backup di Fase 1 (senza `version`) e uno di Fase 2 si ripristinano
    entrambi, producendo una lista di una voce.
  - Un backup versione 3 ripristinato ridà **esattamente** le stesse stime.
  - Vale ancora la regola 1 della Fase 2: il ripristino non cancella settimane
    più recenti del file.

### Blocco C — il calendario

#### Task 8 — Aspetto del calendario (prima del codice)
- **File:** `design_handoff/tokens/colors.css`, `design_handoff/components.css`,
  `design_handoff/reference.html`.
- **Criteri:**
  - I sei livelli della sfumatura e i sei colori di testo, ognuno **con il
    rapporto di contrasto annotato**, tutti ≥ 4.5:1.
  - Il cerchio giallo attorno al numero è visibile su tutti e sei i livelli.
  - La casella regge il numero più l'importo a tre cifre (`126€`) a 390px, con
    sette colonne, senza scorrimento orizzontale.
  - `reference.html` mostra un mese intero d'esempio, con e senza paga oraria.
  - Dati inventati.

#### Task 9 — `src/js/calendar.js` e la schermata
- **File:** `src/js/calendar.js` (nuovo), `src/index.html`, `src/js/app.js`,
  `src/service-worker.js`.
- **Criteri:**
  - Icona calendario a sinistra dello storico, stesso stile delle altre.
  - Griglia che parte dal lunedì, allineata con la settimana dell'app.
  - Scorrimento continuo dal mese della prima settimana registrata a dodici mesi
    dopo oggi.
  - I livelli sono calcolati **sul massimo del mese visualizzato**.
  - Senza paga oraria: nessun colore e nessun importo, i festivi si vedono
    ancora.
  - Il calendario **non modifica niente**: nessun tocco cambia dati (regola 7).
  - Un mese senza nessun dato si apre senza errori.
  - **`calendar.js`, `holidays.js` e `rates.js` sono in `CORE_ASSETS`** e l'app
    parte offline. Da verificare in modalità aereo, non solo a parole.

#### Task 10 — Prova sul telefono e documentazione
- **File:** `shift-hours/README.md`.
- **Criteri:**
  - Provata su iPhone vero, aperta **dall'icona della schermata home**: lo
    scontrino, un festivo, un cambio di paga, il calendario scorso avanti e
    indietro.
  - Verificato che i dati già presenti sui due telefoni non vengano toccati
    dall'aggiornamento, e che le stime prima e dopo coincidano.
  - README aggiornato: come funzionano le paghe nel tempo, cosa significa il
    pallino giallo, cosa mostra il calendario.

---

## 7. Dipendenze

```
Task 0 → Task 1 → Task 2                    (blocco A, si può consegnare qui)
         Task 3 → Task 4 → Task 5 → Task 6 → Task 7   (blocco B, idem)
                                    Task 8 → Task 9 → Task 10
```

Il Task 4 viene prima del 6: il ×2 ha bisogno di sapere quale paga vale in quel
giorno. Il Task 8 viene prima del 9 come in Fase 2: l'aspetto si approva su
`reference.html` prima di scrivere la schermata.

---

## 8. Fuori scope, con motivo

- **Rendere il moltiplicatore un'impostazione.** Oggi è 2 e basta. Se il capo
  cambiasse politica si cambia una costante: farne un campo aggiungerebbe una
  domanda in più nelle impostazioni per un caso che non è mai successo.
- **Toccare un giorno del calendario per aprirlo o modificarlo.** Modificare il
  passato da una griglia fitta è un invito a sbagliare col dito, e aprirebbe la
  strada a cancellare dati da una schermata pensata per guardare (regola 7).
- **Totali mensili in cima al calendario.** Utili, ma spostano la schermata da
  "guarda com'è andato il mese" a "rendiconto", che è un'altra cosa. Si valuta
  dopo averla usata.
- **Bank holiday di altri paesi.** L'app è per una persona che lavora in
  Irlanda.
- **Il compenso di legge per un festivo non lavorato** (giorno libero pagato,
  ferie in più). L'app registra ore lavorate: un giorno non lavorato non ha ore
  da moltiplicare.
- **Lo scontrino nel messaggio al capo.** Valutato: funzionerebbe solo
  racchiudendo il testo fra tre apici inversi, che WhatsApp rende in monospazio.
  Scartato dall'utente — il messaggio resta quello di oggi.
- **Le idee di Claude Design** (settimana in miniatura, apertura a fisarmonica,
  foglio trascinabile, vibrazione). Restano in archivio in
  `Shift Hours Design System.zip`; nessuna entra qui.

---

## 9. Punti confermati con l'utente

1. Il messaggio al capo **resta identico a oggi**. Lo scontrino è solo nell'app.
2. Formato dello scontrino: 35 caratteri, con le spaziature della §1.4.
3. Etichetta `Your week`.
4. Pallino **giallo `#FFD60A` da 7px**, come il blu, avendo visto le alternative
   e il contrasto misurato.
5. Solo il pallino: le ore del giorno festivo **non** vengono marcate.
6. Il ×2 tocca **solo** `Estimated pay`.
7. La prima paga vale dall'inizio; una paga nuova vale dal giorno in cui la
   crea; la precedente vale fino al giorno prima.
8. Storico delle paghe con modifica e cancellazione, ogni volta con un
   messaggio di conferma.
9. Nel calendario: importo giornaliero **arrotondato all'euro**; i centesimi
   restano solo in `Estimated pay`.
10. Senza paga oraria il calendario non colora — «semplice».
11. Il rischio della visibilità del giallo è noto e accettato (§1.3).

---

## 10. Punti da confermare prima di partire

1. **La sfumatura si scala sul mese visualizzato**, non su tutto lo storico
   (§3.5). È la scelta che rende ogni mese leggibile, ma vuol dire che lo stesso
   guadagno può avere due colori diversi in due mesi diversi.
2. **Si scorre fino a dodici mesi dopo oggi**, per vedere in anticipo i prossimi
   festivi. Se preferisci fermarti al mese in corso, si accorcia.
3. **La data di una paga nuova è quella del giorno in cui la inserisce**, ed è
   correggibile subito dopo. In alternativa si può chiedere la data ogni volta:
   più preciso, un passaggio in più.

*Tutti e tre confermati dall'utente il 14 agosto 2026.*

---

## 11. Cosa è cambiato rispetto al piano, durante la costruzione

Scritto qui perché un contratto che non registra le deviazioni smette di
essere un contratto.

- **Task 0** — la motivazione iniziale era sbagliata: davo per mancanti
  l'avviso arancione, la riga di stato e la conferma di ripristino, che erano
  già tutti presenti. Mancavano invece cinque componenti (`sh-chip`,
  `sh-rate`, `sh-typename`, `sh-empty`, `sh-scrim`) e due punti fuori sincrono
  col codice. Nel farlo è emerso che `.sh-rate`, `.sh-typename` e `.sh-empty`
  vivevano in `src/css/app.css`, che `design_handoff/` non contiene e
  `reference.html` non carica: erano **invisibili al pacchetto di design**.
  Spostati in `components.css`.
- **Task 1** — tocca anche `src/index.html` e `src/js/`, che il piano non
  prevedeva, per la richiesta dell'utente sui nomi dei tipi di settimana
  (`Full Week`, `Mon to Sun`). Aggiunta `displayTypeName()` perché le
  settimane archiviate mostrino il nome nuovo.
- **Task 3** — il criterio diceva «October 2028 = 23 ottobre». Sbagliato: il
  31 ottobre 2028 è un martedì, quindi l'ultimo lunedì è il **30**. Il codice
  era giusto, il criterio no.
- **Task 5** — la correzione di una paga usa il campo dell'app, non una
  finestra del browser, e l'evento è `change` e non `input`: su `input` la
  conferma si sarebbe aperta a ogni tasto premuto.
- **Task 8** — l'anello giallo dei bank holiday passa la soglia di 3:1 solo
  sui due gradini scuri della sfumatura. Misurato e annotato nei token; la
  scelta del giallo era già stata presa dall'utente con i numeri sotto gli
  occhi.
