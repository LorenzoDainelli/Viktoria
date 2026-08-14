# Shift Hours

App web per registrare gli orari di lavoro della settimana e generare il
messaggio pronto da mandare al capo su WhatsApp.

Interfaccia in inglese, documentazione in italiano. Il contratto completo del
progetto è in [`PIANO-FASE-1-v2.md`](PIANO-FASE-1-v2.md): quello comanda, questo
file spiega solo come si usa il codice.

## Com'è fatta

Sito statico: HTML, CSS e JavaScript senza librerie, senza build, senza server.
I file che stanno nel repo sono esattamente quelli che girano sul telefono.

```
design_handoff/     sorgente del sistema visivo (token + componenti + reference.html)
src/                l'app vera e propria, l'unica cartella che viene pubblicata
  css/tokens/       copia dei token: si aggiorna copiandola da design_handoff/
  js/               week.js (date e formati), storage.js, slider.js, summary.js, app.js
```

I file di `src/css/tokens/` e `src/css/components.css` **sono copie**: si
modificano in `design_handoff/` e si ricopiano, perché `src/` deve poter essere
pubblicata da sola.

```sh
cp design_handoff/tokens/*.css src/css/tokens/
cp design_handoff/components.css src/css/components.css
```

## Provarla in locale

Serve un server vero: l'app usa i moduli JavaScript, che aprendo il file
direttamente col browser non funzionano.

```sh
python3 -m http.server 8000 --directory src
# poi apri http://localhost:8000
```

## Dove vivono i dati

Solo sul dispositivo, in `localStorage`, sotto quattro chiavi:
`shifthours:current-week`, `shifthours:history`, `shifthours:settings`,
`shifthours:backup`. Nessun server, nessun account, nessuna sincronizzazione.
**Nel repo non finisce mai nessun dato reale**, paga oraria compresa: si
inserisce dall'app.

Due telefoni sono due mondi separati: la stessa app aperta su due dispositivi
non condivide niente. La settimana in corso è calcolata dall'orologio locale,
quindi funziona anche in fusi diversi.

## Copie di sicurezza

Siccome i dati vivono solo nel telefono, se qualcuno cancella i dati dei siti
in Impostazioni → Safari, o se si cambia telefono, **non c'è niente da cui
recuperarli**. Peggio: l'app non se ne accorgerebbe nemmeno, perché si
cancellerebbe anche il segnalino che dice "qui c'erano dei dati". Si
riaprirebbe vuota, senza poter avvisare.

Per questo, quando un mese si chiude, fra l'elenco dei giorni e l'anteprima del
messaggio compare un avviso arancione — *Back up July* — che **resta finché la
copia non è stata fatta**. Non si può chiudere.

Toccando la freccia si apre il pannello di condivisione di iPhone: *Salva su
File*, si sceglie la cartella (dalla seconda volta iPhone ripropone l'ultima) e
si salva. Se si annulla, l'avviso resta al suo posto.

**Regole che governano tutto questo** (dettagli in `PIANO-FASE-2.md`):

- una settimana appartiene al mese della sua **domenica**: le ore di lunedì
  31 agosto 2026 finiscono in `September26`, non in `August26`;
- il file è **cumulativo**: `September26` contiene anche agosto. Se un mese
  viene saltato, manca solo quel nome — nessun dato va perso;
- **il ripristino non cancella mai settimane più recenti del file.** Un backup
  di agosto rimesso dentro a settembre lascia settembre intatto;
- l'avviso sparisce **solo a salvataggio davvero avvenuto**.

Nelle impostazioni ci sono anche `Download backup`, che salva la fotografia
completa **fino a oggi** (settimana in corso inclusa, nome con la data), e
`Restore from backup`, che rimette dentro un file mostrando prima cosa contiene.
I backup prodotti dalla Fase 1, senza numero di versione, si ripristinano lo
stesso.

> ⚠️ **Non cancellare mai l'icona dalla schermata home** per "forzare" un
> aggiornamento: su iPhone, togliendo l'icona si cancellano anche i dati
> dell'app. L'aggiornamento non ne ha mai bisogno.

## Come si aggiorna dopo che è installata sul telefono

Un push su `main` che tocca `shift-hours/src/**` fa ripubblicare il sito
(workflow `.github/workflows/deploy-shift-hours.yml`). Alla successiva apertura
**con connessione**, il service worker scarica la versione nuova e la applica
alla riapertura dopo. Nessuna reinstallazione, i dati restano.

Non serve toccare `CACHE_VERSION` in `src/service-worker.js`: al momento della
pubblicazione il workflow ci scrive l'identificativo del commit. È l'unica
differenza tra i file del repo e quelli pubblicati, e serve a evitare che una
versione nuova non arrivi mai sul telefono perché qualcuno si è dimenticato di
alzare quel numero a mano.

### Prima pubblicazione

Da fare una volta sola, su GitHub: **Settings → Pages → Source** = *Deploy from
a branch*, branch **`gh-pages`**, cartella **`/ (root)`**. Il branch `gh-pages`
viene creato dal workflow al primo deploy, quindi la voce compare solo dopo che
il workflow è girato almeno una volta.

Indirizzo finale: `https://<utente>.github.io/Viktoria/`

## Installarla sull'iPhone

Aprire il link **in Safari** → Condividi → *Aggiungi a Home*. È importante
aggiungerla alla home e non lasciarla come semplice scheda del browser: su iOS
i dati dei siti soltanto visitati possono essere cancellati dopo giorni di
inattività, quelli delle app aggiunte alla home no.
