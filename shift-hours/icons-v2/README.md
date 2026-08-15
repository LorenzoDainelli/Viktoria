# Icona versione 2 — l'insegna del bar (di scorta)

`originale.jpeg` è l'immagine che ha mandato Lorenzo il 14 agosto 2026:
l'insegna del bar dove lavora Viktoria, resa come orologio da parete.
2048×2048, generata con Gemini.

È stata l'icona dell'app per un giorno solo: il 15 agosto Viktoria ne ha
scelta un'altra, che è in `../icons-v3/`. `icon-192.png` e `icon-512.png`
qui accanto sono i file esatti che erano pubblicati, tenuti di scorta.
Per rimetterli in servizio si ricopiano in `src/icons/`:

```sh
cp shift-hours/icons-v2/icon-192.png shift-hours/src/icons/icon-192.png
cp shift-hours/icons-v2/icon-512.png shift-hours/src/icons/icon-512.png
```

Sotto è scritto come erano state ricavate dall'originale.

## Come sono state ricavate

Nell'originale il quadrante è un cerchio di **1778 px di diametro** centrato
in **(1023, 1022)**, con intorno un margine grigio chiaro (#E8E6E7) e
un'ombra sfumata in basso a destra.

Il ritaglio prende esattamente quel cerchio, e riempie i quattro angoli
rimasti fuori con lo stesso grigio chiaro del fondo. Così il quadrante
arriva ai bordi — a 180 px, la misura vera sulla schermata home
dell'iPhone, la scritta "oHSo" resta leggibile, mentre lasciando il
margine originale si perdeva circa un sesto della larghezza utile.

Il cerchio della maschera è disegnato a 4× e poi rimpicciolito: a
dimensione piena il bordo verrebbe scalettato.

I due PNG sono ridotti a 256 colori. Lo scarto medio dall'immagine a
colori pieni è 1,45 su 255 — invisibile — e il file da 512 px passa da
437 KB a 172 KB. Conta, perché le icone stanno in `CORE_ASSETS` e quindi
il telefono se le scarica tutte insieme all'app.

Per rifarle, da `shift-hours/`:

```python
from PIL import Image, ImageDraw
src = Image.open('icons-v2/originale.jpeg').convert('RGB')
CX, CY, R = 1023, 1022, 889
im = src.crop((CX-R, CY-R, CX+R, CY+R)); S = im.size[0]
m = Image.new('L', (S*4, S*4), 0)
ImageDraw.Draw(m).ellipse((0, 0, S*4-1, S*4-1), fill=255)
base = Image.composite(im, Image.new('RGB', (S, S), (232, 230, 231)),
                       m.resize((S, S), Image.LANCZOS))
for size in (192, 512):
    base.resize((size, size), Image.LANCZOS).quantize(
        colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG
    ).save(f'src/icons/icon-{size}.png', optimize=True)
```

## Quello che non è cambiato

Il `manifest.webmanifest` non è stato toccato: i nomi dei file sono gli
stessi, quindi `CORE_ASSETS` e `apple-touch-icon` puntano già al posto
giusto. Anche `theme_color` è rimasto blu (#1b47c9), che è il colore di
tutta l'app: cambiarlo vorrebbe dire rifare il sistema di design.

La voce `maskable` continua a indicare `icon-512.png`. Va bene: la
maschera più aggressiva è il cerchio inscritto, che qui coincide col
quadrante, quindi non taglia niente di importante.

## L'icona già sulla home non si aggiorna da sola

iOS fotografa l'icona nel momento in cui si fa "Aggiungi a Home" e quella
resta per sempre. Pubblicare il file nuovo non basta: bisogna togliere
l'app dalla schermata home e riaggiungerla.

**E togliere l'app cancella i suoi dati**, perché su iPhone un'app aggiunta
alla home ha un archivio suo, separato da Safari. Quindi prima di
toglierla va scaricato il backup dalle impostazioni, e dopo averla
rimessa va ricaricato.

La versione precedente dell'icona è in `../icons-v1/`, quella in servizio
adesso in `../icons-v3/`.
