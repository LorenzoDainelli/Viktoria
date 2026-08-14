# Piano-contratto — Fase 2: Copie di sicurezza mensili e ripristino

> Documento scritto **prima** di qualunque riga di codice, come la Fase 1.
> Vale come contratto: se durante la costruzione serve deviare da qui, ci si
> ferma e si chiede.

Data: 14 agosto 2026
Stato di partenza: Fase 1 completa e in uso su due iPhone (versione
`backup-shift-hours-v1.1`, commit `20e6371`).

---

## 0. Perché questa fase

Tutti i dati di Viktoria vivono solo dentro il suo iPhone. Non esiste nessuna
copia altrove — è una scelta voluta (nessun account, nessun server, niente che
esca dal telefono senza che sia lei a mandarlo), ma ha una conseguenza precisa:

**se quei dati si cancellano, non c'è niente da cui recuperarli.**

Le cause realistiche sono due, e nessuna delle due è esotica:

- qualcuno "fa pulizia" in Impostazioni → Safari → Cancella dati;
- cambio di telefono, o ripristino.

E c'è un aggravante: dopo una cancellazione **l'app non può nemmeno
accorgersene**. Anche il segnalino "qui c'erano dei dati" verrebbe cancellato
insieme al resto. Si riaprirebbe vuota, senza poter avvisare né proporre nulla.

La Fase 1 ha già un pulsante `Download backup` nelle impostazioni, ma ha due
limiti: bisogna ricordarsi di usarlo, e **non esiste alcun modo di
rimettere dentro il file**. Oggi quel pulsante produce un file che non serve a
niente.

Questa fase chiude il cerchio: fa **nascere** le copie senza che lei debba
ricordarsene, e le rende **davvero riutilizzabili**.

---

## 1. Il vincolo tecnico da cui parte tutto

Va scritto qui perché ha condizionato ogni scelta del piano, e perché chiunque
legga questo documento in futuro non riprovi strade già valutate.

**Su iPhone una web app non può scrivere un file da sola.** L'API che serve
(scegli una cartella una volta, poi il sito ci scrive dentro in silenzio per
sempre) esiste solo su Chrome da computer. Safari non ce l'ha, né in un browser
né in un'app aggiunta alla schermata home. Non è un limite di come è fatta
questa app: è una scelta di sicurezza di Apple.

Conseguenze dirette, tutte accettate:

- **Non esiste una cartella "dell'app" dentro File.** Quella la possono avere le
  app native, una web app no.
- **Ogni salvataggio deve nascere da un tocco di Viktoria** e passare dal
  pannello di condivisione di iPhone.
- **Nessun salvataggio automatico in sottofondo.** Il massimo ottenibile è
  ridurre il gesto a tre tocchi sempre uguali.
- Neanche i "file interni" del browser aiutano: vivono nello stesso cassetto che
  si svuota. **Nessun posto dentro il browser sopravvive a una cancellazione.**

Da qui in avanti il problema smette di essere tecnico e diventa di disegno:
**far sì che quel gesto avvenga davvero**, poche volte l'anno, nel momento in
cui lei è già dentro l'app.

---

## 2. Regole non negoziabili di questa fase

Si aggiungono a quelle di `PIANO-FASE-1-v2.md`, che restano tutte valide.

1. **Un ripristino non cancella mai settimane più recenti del file.** Un
   backup di agosto usato a settembre lascia intatto settembre. Uno strumento di
   salvataggio non può distruggere dati: è la regola più importante del piano.
2. **L'avviso sparisce solo a salvataggio davvero avvenuto.** Se lei annulla il
   pannello di condivisione, l'avviso resta. Un promemoria che si spegne senza
   che il file esista è peggio di nessun promemoria.
3. **Mai una finestra che blocca.** L'avviso non deve mai mettersi fra lei e il
   suo lavoro vero, che è copiare il messaggio per il capo.
4. **Niente invii automatici.** Il file esce dal telefono solo se è lei a
   sceglierlo, ogni volta, dal pannello di iPhone (regola 10 della Fase 1).
5. **Un ripristino che non capisce il file non tocca niente.** Meglio un errore
   chiaro che un ripristino a metà.
6. **Prima di sovrascrivere, si mostra cosa si sta per rimettere dentro** (data
   di fine e numero di settimane), così se ha scelto il file sbagliato se ne
   accorge prima e non dopo.
7. **Nessun dato reale nel repo.** Gli esempi in `design_handoff/` e nei test
   sono inventati (regola 3 di `CLAUDE.md`).
8. **Nessun colore fuori dai token.** L'arancione dell'avviso diventa un token,
   non un valore scritto a mano.
9. **Nessun file fuori da `shift-hours/`.**

---

## 3. Come funziona, in italiano

### 3.1 A quale mese appartiene una settimana

L'app ragiona a **settimane intere**, mai a giorni sciolti. Quindi:

> Una settimana appartiene al mese della sua **domenica**.

La settimana che va da lunedì 31 agosto a domenica 6 settembre è **di
settembre**, anche se contiene un giorno di agosto. È una convenzione, ed è
quella coerente con tutto il resto dell'app (il messaggio al capo è già
identificato dalla domenica: `Week ending 6 September`).

### 3.2 Quando un mese è "chiuso"

> Un mese è chiuso quando la settimana in cui lei si trova adesso appartiene a
> un mese successivo.

Esempio reale sul calendario 2026 (le domeniche di agosto sono 2, 9, 16, 23 e
30; il 31 agosto è un lunedì):

| dalla settimana che finisce | il mese chiuso è | il file si chiamerà |
|---|---|---|
| domenica 6 settembre | agosto | `August26` |
| domenica 4 ottobre | settembre | `September26` |
| domenica 1 novembre | ottobre | `October26` |

Quindi l'avviso di agosto compare **lunedì 31 agosto**, primo giorno della prima
settimana di settembre.

### 3.3 L'avviso arancione

Compare **fra l'elenco dei giorni e l'anteprima del messaggio**, cioè
esattamente sulla strada che lei percorre ogni settimana per copiare le ore.

- Compare quando c'è un mese chiuso **con dati dentro** che non è ancora stato
  salvato.
- **Resta finché non lo fa.** Non si può chiudere, non ha una ✕. Non è un
  suggerimento: è l'unica cosa che tiene in vita le sue ore.
- Non si può ignorare per sbaglio, ma non blocca niente: il pulsante
  `Copy summary` continua a funzionare come sempre.
- Se lei salta un mese, l'avviso **non si moltiplica**: nomina sempre e solo
  l'ultimo mese chiuso, e siccome il file è cumulativo, farlo una volta sistema
  tutti i mesi arretrati insieme.

Testo (in inglese, come tutta l'app):

```
Back up August
Keep a copy of your hours on your phone.      [ ↓ ]
```

### 3.4 Cosa succede quando tocca la freccia

1. Sale il pannello di condivisione di iPhone.
2. Lei tocca **Salva su File**.
3. Si apre lo sfoglia-cartelle col nome già scritto: `August26`. La prima volta
   sceglie la cartella, dalle volte dopo iPhone ripropone da solo l'ultima.
4. Tocca **Salva**.
5. L'app conferma e **l'avviso arancione sparisce**.

Tre tocchi, sempre gli stessi. Dallo stesso pannello può anche mandarlo a sé
stessa su WhatsApp, se un giorno le fa più comodo: è lei a scegliere ogni volta.

Se annulla in un qualunque punto, **l'avviso resta**.

### 3.5 Cosa c'è dentro il file

`August26.json` contiene:

- le impostazioni (paga oraria, tipi di settimana personalizzati);
- **tutte le settimane dall'inizio fino all'ultima di agosto compresa**
  (domenica 30 agosto).

Non contiene la settimana in corso. È cumulativo per costruzione: `September26`
conterrà agosto **e** settembre, `October26` anche ottobre, e così via. Se lei
salta un mese, quel nome non esiste su disco ma **non si perde niente**: il file
successivo contiene comunque tutto.

### 3.6 Il pulsante nelle impostazioni

`Download backup` resta dov'è e continua a fare una cosa diversa e
complementare: **la fotografia completa fino a oggi**, settimana in corso
inclusa. Nome col giorno (`shift-hours-backup-2026-09-02.json`), così non si
confonde mai con i file mensili.

Serve per il "prima di cambiare telefono" e per quando vuole una copia adesso,
senza aspettare l'avviso.

### 3.7 Il ripristino

Nuovo, nelle impostazioni: **`Restore from backup`**.

1. Tocca il pulsante → si apre il selettore file di iPhone (vede iCloud Drive e
   il telefono).
2. Sceglie un file.
3. L'app lo legge e **prima di toccare qualunque cosa** mostra una conferma:
   *"This backup ends on 30 August and has 14 weeks. Restore it?"*
4. Se conferma, i dati rientrano e l'app si ricarica sulla settimana corrente.

**La regola di fusione** (regola 1 di questa fase, qui in dettaglio):

- le settimane presenti nel file **rientrano**, sovrascrivendo quelle con la
  stessa data;
- le settimane nel telefono **più recenti dell'ultima del file restano
  intatte**;
- la settimana in corso resta intatta se è più recente della fine del file;
- la paga oraria del file rientra, **ma non cancella mai** una paga già presente
  nel telefono se nel file è vuota.

Conseguenza da sapere: se lei aveva cancellato apposta una settimana vecchia,
un ripristino la riporta indietro. È il comportamento giusto per un ripristino,
e la può ricancellare in due tocchi.

---

## 4. Modello dati

### 4.1 Nuova chiave in `localStorage`

```
shifthours:backup → {
  "lastMonth":   "2026-08",     // ultimo mese chiuso salvato, o null
  "lastSavedAt": "2026-09-02",  // giorno in cui è stato salvato
  "lastFileName": "August26.json"
}
```

Vive sul telefono come tutto il resto. Si cancella insieme agli altri dati in
caso di pulizia — è previsto e non è un problema: dopo una cancellazione non c'è
più niente da salvare comunque.

Ogni telefono ha il suo stato: quello di Lorenzo e quello di Viktoria si
avvisano a vicenda in modo indipendente.

### 4.2 Formato del file esportato

```json
{
  "app": "shift-hours",
  "version": 2,
  "exportedAt": "2026-09-02",
  "coversUntil": "2026-08-30",
  "label": "August26",
  "settings": { },
  "currentWeek": null,
  "history": [ ]
}
```

- `coversUntil` è la domenica dell'ultima settimana inclusa. È il campo che
  rende possibile la regola di fusione ed è **obbligatorio**.
- `label` è `null` per il file completo delle impostazioni.
- `version` assente = file della Fase 1: si accetta lo stesso, trattandolo come
  versione 1 e ricavando `coversUntil` dall'ultima settimana che contiene.
  **Un backup fatto oggi deve restare ripristinabile.**

---

## 5. Struttura file attesa

```
shift-hours/
  PIANO-FASE-2.md                    questo file
  design_handoff/
    tokens/colors.css                + token arancione
    components.css                   + .sh-alert
    reference.html                   + avviso, riga di stato, conferma
  src/
    css/tokens/colors.css            copia
    css/components.css               copia
    index.html                       + avviso, + pulsante di ripristino
    js/
      backup.js                      NUOVO — calendario dei mesi, nomi, filtri
      storage.js                     + stato del backup, export/import
      app.js                         + avviso, salvataggio, ripristino
  README.md                          + sezione sulle copie di sicurezza
```

Nessun altro file. Nessuna dipendenza nuova.

---

## 6. Task

Ogni task si chiude fermandosi e facendo provare il risultato prima di passare
al successivo.

### Task 1 — Aspetto dell'avviso (prima del codice)
- **File:** `design_handoff/tokens/colors.css`, `design_handoff/components.css`,
  `design_handoff/reference.html`.
- **Criteri:**
  - Token nuovi per l'arancione (sfondo tenue, testo, bordo), coerenti con la
    palette esistente e **non inventati altrove nel CSS**.
  - Contrasto testo/sfondo conforme AA.
  - Il pulsante con la freccia ha area di tocco ≥ 44×44 px.
  - `reference.html` mostra l'avviso al suo posto reale, fra i giorni e
    l'anteprima, alla larghezza di un iPhone 15.
  - Mostra anche la riga di stato delle impostazioni e la conferma di
    ripristino.
  - Dati d'esempio inventati.

### Task 2 — Logica del calendario (`src/js/backup.js`)
- **File:** `src/js/backup.js` (nuovo).
- **Contenuto:** funzioni pure, senza toccare il DOM né `localStorage`:
  mese di una settimana, ultimo mese chiuso, etichetta `August26`, ultima
  domenica di un mese, filtro delle settimane fino a una data.
- **Criteri:**
  - `August26` per agosto 2026; `January27` per gennaio 2027 (**il cambio
    d'anno va gestito**).
  - Con settimana corrente che finisce il 6 settembre 2026 → mese chiuso
    `2026-08`, `coversUntil` = `2026-08-30`.
  - Il filtro non include mai settimane oltre `coversUntil`.
  - Nessun uso di UTC: si ragiona sull'orologio del telefono, come già fa
    `week.js`.

### Task 3 — Avviso e salvataggio
- **File:** `src/index.html`, `src/css/components.css`, `src/js/storage.js`,
  `src/js/app.js`.
- **Criteri:**
  - L'avviso compare **solo** se esiste un mese chiuso con dati non ancora
    salvato, e solo sulla settimana corrente (mai sfogliando lo storico).
  - Il file salvato ha nome `August26.json` e contenuto conforme alla sezione
    4.2.
  - Annullare il pannello di condivisione **lascia l'avviso al suo posto** e non
    scrive niente in `shifthours:backup`.
  - A salvataggio riuscito l'avviso sparisce, compare una conferma, e
    `shifthours:backup` è aggiornato.
  - Un mese saltato non produce due avvisi: ne resta uno, col mese più recente.
  - Il pulsante `Copy summary` funziona come prima, avviso o non avviso.

### Task 4 — Ripristino
- **File:** `src/index.html`, `src/js/storage.js`, `src/js/app.js`.
- **Criteri:**
  - Pulsante `Restore from backup` nelle impostazioni, che apre il selettore
    file di iPhone.
  - File non valido, non JSON, o di un'altra app → messaggio d'errore chiaro e
    **nessuna modifica ai dati**.
  - Prima di scrivere, conferma con data di fine e numero di settimane.
  - **Verifica della regola 1:** con nel telefono settimane di settembre e un
    file che finisce il 30 agosto, dopo il ripristino le settimane di settembre
    **ci sono ancora**, immutate.
  - Un file della Fase 1 (senza `version`) si ripristina lo stesso.
  - Una paga oraria già impostata non viene azzerata da un file che non ce
    l'ha.
  - Il totale della settimana e il messaggio generato dopo il ripristino sono
    identici a quelli di prima del salvataggio.

### Task 5 — Stato visibile nelle impostazioni
- **File:** `src/index.html`, `src/js/app.js`.
- **Criteri:**
  - Riga sempre presente: `Last backup: August26 — 2 September`, oppure
    `No backup yet`.
  - Si aggiorna subito dopo un salvataggio riuscito.
  - Il pulsante `Download backup` continua a produrre la fotografia completa
    fino a oggi, col nome per data, senza collidere coi file mensili.

### Task 6 — Prova sul telefono e documentazione
- **File:** `shift-hours/README.md`.
- **Criteri:**
  - Provato su iPhone reale, aperto **dall'icona della schermata home**:
    comparsa dell'avviso, salvataggio in una cartella, annullamento, ripristino
    dal file salvato.
  - README aggiornato: cosa succede, ogni quanto, dove finiscono i file, come si
    ripristina, e l'avvertenza di non cancellare l'icona dalla schermata home.
  - Verificato che i dati già presenti sui due telefoni non vengano toccati
    dall'aggiornamento.

---

## 7. Dipendenze

Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6.

Il Task 4 non può essere saltato o rimandato: senza ripristino, i file prodotti
dal Task 3 non servono a niente.

---

## 8. Fuori scope, con motivo

- **Salvataggio con un tocco solo, senza pannello di condivisione.** Dipende da
  una prova ancora da fare su un iPhone vero (se un download parte davvero da
  un'app aggiunta alla schermata home). Se funzionerà, sarà una scorciatoia
  sopra questo stesso meccanismo, non un rifacimento.
- **Backup automatico agganciato a `Copy summary`.** Valutato e scartato in
  favore dell'avviso mensile, meno invadente.
- **Backup come link da mandarsi su WhatsApp.** Valutato: ottimo per il
  ripristino, ma con l'avviso mensile e il selettore file il problema è
  risolto. Resta in archivio come alternativa.
- **Qualunque sincronizzazione o server.** Vietata dalle regole del progetto.
- **Ripetere lo stesso salvataggio in un secondo posto dentro il telefono.**
  Inutile: una cancellazione li svuota tutti insieme.

---

## 9. Punti confermati con l'utente

1. Avviso **mensile**, non settimanale.
2. Compare fra i giorni e l'anteprima del messaggio, con la freccia a destra.
3. Resta finché non viene fatto.
4. File `August26`, cumulativo dall'inizio.
5. Il file mensile si ferma all'ultima settimana del mese chiuso; per la
   fotografia completa c'è il pulsante nelle impostazioni.
6. Un mese saltato non lascia buchi nei dati, solo un nome mancante.
7. Accettato il rischio: nel caso peggiore si perdono fino a quattro o cinque
   settimane, che sono comunque ricostruibili dai messaggi già mandati al capo.

## 10. Punto da confermare prima di partire

**Il nome del file segue il mese salvato, non il giorno in cui lo salva.** Se
tocca la freccia il 2 settembre, il file si chiama `August26` perché contiene
agosto. È coerente con l'avviso ("Back up August"), ma è bene che tu lo confermi
adesso: è il nome che lei si ritroverà nella cartella.
