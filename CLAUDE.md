# Repo Viktoria — Regole sempre attive

Questo repo raccoglie piccoli progetti/app pensati per una persona reale
(non tecnica), ognuno nella propria sottocartella. Ogni sessione che lavora
qui — Claude Code, Claude Design o altro — legge questo file prima di
qualunque task.

## Perché esiste questo file

Ogni progetto ha il proprio piano-contratto (`PIANO-FASE-N.md`) con le regole
specifiche. Questo file contiene invece le regole valide **per tutti i
progetti presenti e futuri** in questo repo, così non vanno ripetute ogni
volta.

## Regole NON NEGOZIABILI

1. **Semplicità estrema sempre.** La persona per cui si costruisce non ha
   competenze informatiche. Niente concetti tecnici visibili, niente flussi
   che richiedono di capire come funziona il computer. Se un'interazione
   richiede una spiegazione, va semplificata, non spiegata.
2. **Mai account, mai login, mai password.** Ogni progetto deve funzionare
   aprendo un link, senza credenziali.
3. **Nessun dato personale nel repo.** Il repo contiene solo codice e
   configurazione, mai dati reali della persona (orari, importi, messaggi,
   foto, ecc.). I dati vivono sul suo dispositivo (es. `localStorage`), mai
   committati.
4. **Mai condividere i suoi dati senza il suo consenso esplicito.** Se un
   progetto genera un output che lei deve mandare a qualcun altro (es. un
   messaggio WhatsApp), è sempre lei a decidere di inviarlo — mai automatico.
5. **Un progetto = una sottocartella.** Non creare repo nuovi per nuovi
   progetti pensati per lei: aggiungere una sottocartella qui, seguendo la
   stessa struttura (`README.md`, `PIANO-FASE-N.md`, `src/`).
6. **Nessuna cartella o file fuori dal piano-contratto** del progetto su cui
   si sta lavorando, salvo istruzione esplicita dell'utente.

## Metodo di lavoro

- **Pianificazione prima, costruzione a fasi.** Ogni progetto parte da un
  `PIANO-FASE-1.md` scritto prima di qualunque codice, con task atomici,
  file esatti, criteri di accettazione verificabili.
- **Fermarsi dopo ogni fase completata** e far provare il risultato prima di
  proseguire.
- **Mai inventare dati o funzionalità non richieste.** Se manca
  un'informazione per completare un task, fermarsi e chiedere.
- **Design**: quando un progetto ha un pacchetto di design dedicato
  (`design_handoff/`), usare solo quei token/stili — mai inventare colori o
  valori al loro posto.

## Struttura repo

```
/
  README.md              overview del repo ed elenco progetti
  CLAUDE.md               questo file
  <progetto-1>/           es. shift-hours/
    README.md
    PIANO-FASE-1.md
    design_handoff/
    src/
  <progetto-2>/
    ...
```

## Deploy (GitHub Pages)

Ogni progetto che deve essere raggiungibile via link pubblico ha il proprio
workflow di GitHub Actions dedicato (in `.github/workflows/`) che pubblica
solo la propria cartella `src/` — non l'intero repo. Finché un solo progetto
usa Pages, occupa la root del sito; quando se ne aggiunge un secondo, va
deciso insieme all'utente come farli coesistere (sotto-percorso o dominio
personalizzato).
