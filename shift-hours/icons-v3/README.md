# Icona versione 3 — l'orologio oHSo (in servizio)

`originale.jpeg` è l'immagine che ha scelto Viktoria, caricata da Lorenzo
il 15 agosto 2026: l'orologio bianco col marchio del bar su fondo blu
sfumato. 2048×2048, generata con Gemini.

Da qui nascono le due icone in `src/icons/`.

## Come sono state ricavate

Nessun ritaglio, a differenza della versione 2: l'immagine è già nata
come icona, occupa tutto il quadro e non ha né margine né ombra da
togliere.

L'unico intervento è **alzare il contenuto di 131 px**. Nell'originale il
blocco visivo va da y=342 (cima del quadrante) a y=1968 (fondo della
scritta), quindi il suo centro sta 131 px sotto il centro del quadro:
sopra restano 342 px di sfondo e sotto solo 80. Dentro la maschera
arrotondata dell'iPhone si vedeva appoggiato in basso. Alzandolo il
margine diventa 211 sopra e 211 sotto.

I 131 px che si liberano in fondo sono riempiti allungando le ultime
righe, che sono solo sfondo. La sfumatura è così piatta — meno di un
livello su 255 in quello spazio — che la giunta non si vede.

I due PNG sono ridotti a 256 colori: lo scarto medio è 0,27 su 255,
invisibile, e insieme pesano 113 KB invece di 170. Conta, perché le icone
stanno in `CORE_ASSETS` e il telefono se le scarica tutte insieme
all'app.

Per rifarle, da `shift-hours/`:

```python
from PIL import Image
src = Image.open('icons-v3/originale.jpeg').convert('RGB')
W, H = src.size
SHIFT = 131
strip = src.crop((0, 1969, W, H)).resize((W, SHIFT), Image.BICUBIC)
base = Image.new('RGB', (W, H))
base.paste(src.crop((0, SHIFT, W, H)), (0, 0))
base.paste(strip, (0, H - SHIFT))
for size in (192, 512):
    base.resize((size, size), Image.LANCZOS).quantize(
        colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG
    ).save(f'src/icons/icon-{size}.png', optimize=True)
```

## Quello che non è cambiato

Il `manifest.webmanifest` non è stato toccato: i nomi dei file sono gli
stessi, quindi `CORE_ASSETS` e `apple-touch-icon` puntano già al posto
giusto. Il `theme_color` blu (#1b47c9) adesso combacia anche col fondo
dell'icona, che parte da (32, 73, 199).

La voce `maskable` continua a indicare `icon-512.png`. La maschera più
aggressiva che può capitare è il cerchio inscritto: il punto del disegno
più lontano dal centro è lo spigolo esterno della scritta, a 892 px su un
raggio di 1024, quindi resta dentro. Alzando il contenuto è migliorato
anche questo, perché prima stava a 1013, a un'unghia dal bordo.

## L'icona già sulla home non si aggiorna da sola

iOS fotografa l'icona nel momento in cui si fa "Aggiungi a Home" e quella
resta per sempre. Pubblicare il file nuovo non basta: bisogna togliere
l'app dalla schermata home e riaggiungerla.

**E togliere l'app cancella i suoi dati**, perché su iPhone un'app
aggiunta alla home ha un archivio suo, separato da Safari. Quindi prima
di toglierla va scaricato il backup dalle impostazioni, e dopo averla
rimessa va ricaricato.

Le versioni precedenti sono in `../icons-v2/` (l'insegna del bar) e
`../icons-v1/` (l'orologio blu del primo giorno).
