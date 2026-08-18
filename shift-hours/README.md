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
  js/               week.js (date e formati), storage.js, slider.js, summary.js,
                    backup.js, holidays.js, rates.js, calendar.js, app.js
```

> Un file `.js` nuovo va aggiunto anche a `CORE_ASSETS` in
> `src/service-worker.js`, se no l'app non parte quando è offline.

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

Il riquadro sotto i giorni, `Your week`, mostra le ore **incolonnate come uno
scontrino**. Non è il messaggio: quello che `Copy summary` mette negli appunti
è il testo di sempre, riga per riga. Sono due funzioni separate apposta —
le colonne allineate reggono solo in un font a spaziatura fissa, e WhatsApp
scrive con un font proporzionale, dove si sfaserebbero.

Solo sul dispositivo, in `localStorage`, sotto quattro chiavi:
`shifthours:current-week`, `shifthours:history`, `shifthours:settings`,
`shifthours:backup`. Nessun server, nessun account, nessuna sincronizzazione.
**Nel repo non finisce mai nessun dato reale**, paga oraria compresa: si
inserisce dall'app.

Due telefoni sono due mondi separati: la stessa app aperta su due dispositivi
non condivide niente. La settimana in corso è calcolata dall'orologio locale,
quindi funziona anche in fusi diversi.

## La frase della settimana

In fondo allo scontrino, staccata dal totale e centrata, compare una frase
presa da `NOTES` in `src/js/notes.js`. Cambia ogni settimana e resta la
stessa per tutta la settimana; le frasi si susseguono in ordine e poi si
ricomincia, così escono tutte e non se ne ripete mai una due settimane di
fila. Con l'elenco vuoto lo scontrino finisce con il totale, come se la
riga non esistesse.

**Non entra nel messaggio che va al capo.** Vive solo dentro
`buildReceipt()`; `buildSummary()` non la conosce.

Il limite è **35 caselle**, che è la larghezza dello scontrino. Attenzione
che non è la lunghezza del testo: nel carattere a spaziatura fissa
**un'emoji occupa due caselle** (misurate 2,07). Il conto lo fa
`displayWidth()`, che vale 2 per le emoji, 1 per le lettere e 0 per i pezzi
invisibili delle emoji composte. Una frase che sfora viene semplicemente
saltata, non tronca lo scontrino.

## La paga oraria cambia nel tempo

La paga non è più un numero solo: è un **elenco**, e ognuna porta il giorno da
cui vale.

- La **prima** vale dall'inizio dei tempi, anche per le settimane inserite
  prima di averla scritta.
- Ogni paga nuova vale **dal giorno in cui la crea**; la precedente resta
  valida fino al giorno prima. La data si può correggere dopo, perché il capo
  non sempre avvisa in tempo.
- Cancellandone una, il periodo che copriva torna a quella precedente.
  Cancellando l'ultima rimasta, la stima sparisce.

Per questo la stima non si calcola più sulle ore della settimana ma
**sommando i giorni**: una settimana a cavallo di un aumento ha cinque giorni
al prezzo vecchio e due al nuovo, e viene giusta.

Ogni modifica chiede conferma dicendo cosa sta per succedere, coi numeri
dentro. Nessuna finestra del browser.

## Bank holiday

L'app conosce le **dieci feste irlandesi** e le **calcola dalle regole** —
primo lunedì di febbraio, lunedì di Pasqua, ultimo lunedì di ottobre e così
via — mai da una lista scritta a mano, che scadrebbe e sbaglierebbe in
silenzio.

Un giorno di festa porta un **pallino giallo** a destra del nome, che compare
anche se non ha lavorato: serve pure a saperlo in anticipo.

Nel bar di Viktoria quei giorni sono pagati il **doppio**, e l'app ne tiene
conto — ma **solo in `Estimated pay`**. Le ore restano quelle vere ovunque:
nella riga del giorno, nel totale, nello scontrino e soprattutto nel messaggio
al capo, che non cambia di un carattere.

> Il doppio è la politica del suo bar, non un obbligo di legge: la legge
> irlandese lascia al datore la scelta fra quattro forme di compenso. Se
> cambiasse, si cambia `HOLIDAY_MULTIPLIER` in `src/js/holidays.js` e in
> nessun altro posto.

## Il calendario

Terza icona nella testata. Un mese sotto l'altro, si scorre dal mese della
prima settimana registrata fino a dodici mesi avanti.

Ogni casella mostra il numero del giorno, il guadagno **arrotondato all'euro**
(i centesimi restano solo in `Estimated pay`) e un fondo colorato in base a
quanto ha reso quel giorno. La sfumatura si scala **sul mese che si sta
guardando**, non su tutto lo storico: se no un turno eccezionale
schiaccerebbe ogni altro mese in un grigio piatto per anni.

I bank holiday hanno un anello giallo attorno al numero. Senza paga oraria
non ci sono né colori né importi: restano i giorni e i festivi.

**Il calendario non modifica niente.** Si guarda.

Nella testata, fra il titolo e la X, c'è una **pillola col conto alla
rovescia** al prossimo bank holiday: *In 69 days*, *Tomorrow*, *Today*. Ha il
grigio dei pulsanti tondi della testata e la scritta nel grigio delle icone
(4,9:1, passa), con attorno l'anello e l'alone gialli delle feste — nessun
colore nuovo. Toccandola il calendario scorre fino a quel mese.

Il conto si rifà a ogni apertura del calendario, non a un timer: l'unico caso
che sfugge è l'app lasciata aperta oltre la mezzanotte. La pillola sparisce se
il mese della festa sta fuori dal calendario, che oggi finisce a dicembre 2028:
una pillola che non porta da nessuna parte è peggio di nessuna pillola.

Il giro del bordo è un gradiente conico dentro un quadrato che ruota,
ritagliato al solo bordo. Con `prefers-reduced-motion` si ferma e resta un
anello giallo pieno.

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
