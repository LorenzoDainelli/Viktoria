# Icona versione 1 — di scorta

Queste sono le icone che l'app ha avuto dal primo giorno fino al cambio
richiesto da Lorenzo il 14 agosto 2026: orologio bianco su fondo blu
sfumato, disegnate a partire da `--sh-primary` (#1b47c9).

Sono qui **solo come copia di sicurezza**. Non vengono pubblicate: la
cartella sta fuori da `src/`, e il workflow di deploy copia soltanto
`shift-hours/src/`.

## Come rimetterle in servizio

```
cp shift-hours/icons-v1/icon-192.png shift-hours/src/icons/icon-192.png
cp shift-hours/icons-v1/icon-512.png shift-hours/src/icons/icon-512.png
```

Poi merge su `main`: il workflow ristampa `CACHE_VERSION` e il service
worker riscarica i due file, che sono dentro `CORE_ASSETS`.

**Attenzione — l'icona sulla home dell'iPhone non cambia da sola.** iOS
fotografa l'icona nel momento in cui si fa "Aggiungi a Home", e quella
resta. Per vedere l'icona nuova bisogna togliere l'app dalla schermata
home e riaggiungerla dal browser. Vale in tutt'e due i versi: anche
tornando indietro a queste.
