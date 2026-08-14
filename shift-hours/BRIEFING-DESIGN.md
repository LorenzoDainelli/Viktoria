# Briefing per Claude Design — identità visiva di "Shift Hours"

> Documento di consegna. Chi lavora al redesign legge **questo** più
> `design_handoff/reference.html`, e non ha bisogno d'altro.
>
> Data: 14 agosto 2026 · versione dell'app: `backup-shift-hours-v1.2`

---

## 1. Cosa stai ridisegnando

Un'app web che **funziona già ed è in uso ogni giorno**. Non c'è niente da
costruire e niente da inventare: c'è da rifare l'aspetto.

L'attuale è dichiaratamente **provvisoria** — è stata fatta minimale apposta,
per poter provare le funzioni, sapendo che sarebbe stata sostituita in blocco.
È scritto nel piano-contratto (`PIANO-FASE-1-v2.md`, Task 0).

## 2. Per chi

Viktoria, barista in Irlanda, madrelingua inglese, **non tecnica**. Usa un
iPhone 15, apre l'app qualche volta a settimana per registrare i turni e una
volta a settimana per copiare il riepilogo da mandare al capo su WhatsApp.

Tre cose da tenere in testa mentre disegni:

- **Deve sembrare un'app, non un sito.** Niente che esca dallo schermo, niente
  da scorrere per venti schermate, niente che assomigli a un modulo da
  compilare.
- **I numeri sono il contenuto.** Le ore della settimana sono la cosa che
  guarda per prima e la ragione per cui apre l'app.
- **Se un'interazione richiede una spiegazione, va semplificata, non
  spiegata.**

## 3. Il perimetro — la regola che non si tocca

Modifica **solo** questi file:

```
shift-hours/design_handoff/tokens/colors.css
shift-hours/design_handoff/tokens/typography.css
shift-hours/design_handoff/tokens/space.css
shift-hours/design_handoff/components.css
shift-hours/design_handoff/reference.html
```

Alla fine, copia i quattro file CSS in `shift-hours/src/css/` mantenendo la
stessa struttura (`src/css/tokens/*.css` e `src/css/components.css`). Devono
restare identici a quelli di `design_handoff/`.

**Non toccare mai** `src/index.html` né i file in `src/js/`.

Il motivo è preciso: **i nomi delle classi sono il contratto** fra la grafica e
il codice. Metà dell'interfaccia è costruita da JavaScript, quindi se rinomini
una classe non lo scopri guardando la pagina — si spegne un pezzo di app in
silenzio, magari solo quando lei apre lo storico.

Puoi aggiungere classi nuove. Non puoi rinominarne o eliminarne.

### Le classi che devono continuare a esistere

```
sh-actionbar sh-alert sh-alert__btn sh-alert__note sh-alert__text
sh-alert__title sh-app sh-app__body sh-btn sh-btn--danger sh-btn--ghost
sh-btn--secondary sh-chip sh-day sh-day--filled sh-day--open sh-day__add
sh-day__clear sh-day__head sh-day__hours sh-day__name sh-day__panel
sh-day__times sh-day__today sh-day__value sh-daypicker sh-daypicker__day
sh-days sh-empty sh-group sh-group__label sh-group__note
sh-group__note--warn sh-header sh-header__actions sh-header__eyebrow
sh-header__title sh-hero sh-hero__label sh-hero__meta sh-hero__pay
sh-hero__top sh-hero__total sh-hero__unit sh-histrow sh-histrow__chevron
sh-histrow__hours sh-histrow__main sh-histrow__meta sh-histrow__week
sh-iconbtn sh-iconbtn--plain sh-layer sh-nudge sh-nudge__btn
sh-nudge__label sh-nudges sh-panel sh-panel__body sh-panel__head
sh-panel__title sh-preview sh-preview__bubble sh-preview__label sh-range
sh-range__arrow sh-range__duration sh-range__fill sh-range__handle
sh-range__rail sh-range__readout sh-range__scale sh-range__track sh-rate
sh-rate__currency sh-row sh-row--stacked sh-row__input sh-row__label
sh-row__value sh-scrim sh-sheet sh-sheet__days sh-sheet__grip
sh-sheet__option sh-sheet__title sh-toast sh-toast--leaving sh-toast__icon
sh-toasts sh-typename sh-typepill
```

### Su che ramo lavorare

Lavora su un ramo tuo, per esempio `claude/design-shift-hours`.

**Non fare merge su `main` e non chiedere che venga fatto.** Un push su `main`
che tocca `shift-hours/src/**` fa partire da solo la pubblicazione su GitHub
Pages: la grafica nuova arriverebbe sul telefono di Viktoria nel giro di dieci
secondi, senza che nessuno l'abbia vista. Il merge lo decide Lorenzo, dopo la
revisione.

Se serve tornare indietro, la versione attualmente in uso è sul ramo
`backup-shift-hours-v1.2`.

## 4. Quattro regole CSS che sembrano estetiche e non lo sono

Se riscrivi `components.css` da zero, **queste vanno riportate**. Sono
correzioni di bug reali, già pagate una volta, che tornerebbero identici.

| regola | dove | cosa succede senza |
|---|---|---|
| `-webkit-tap-highlight-color: transparent` | su `html` | tenendo premuto un pallino dello slider compare un rettangolo grigio scuro (iOS lo disegna dopo ~1 decimo di secondo) |
| `-webkit-touch-callout: none` + `user-select: none` | su `.sh-range` | tenendo premuto parte la lente d'ingrandimento sugli orari |
| `height: 100dvh` (**non** `min-height`) su `.sh-app`, `min-height: 0` su `.sh-app__body` e `.sh-panel__body` | shell | il pulsante `Copy summary` finisce fuori schermo |
| area di tocco ≥ 44×44 px | maniglie slider, ✕, ±, freccia dell'avviso, pulsanti tondi | bersagli che il dito manca |

## 5. Vincoli di contenuto e di stile

- **Solo tema chiaro.** Niente modalità scura.
- **Bianco e blu `#1B47C9`**: sono i colori scelti da lei. Puoi lavorare sulle
  gradazioni e sugli accostamenti, non sostituire l'identità.
- **Font di sistema** (`-apple-system`). Nessun font da scaricare.
- **Larghezza massima 440px**, centrata. Progetta per iPhone 15.
- **Safe area iOS** rispettata (`env(safe-area-inset-*)`): l'app si apre a
  tutto schermo dalla schermata home.
- **Tre schermate in tutto**: settimana, storico, impostazioni. Non aggiungerne.
- **Tutti i testi dell'app sono in inglese.** Non tradurli, non riscriverli.
  (`reference.html` ha le etichette dei campioni in italiano: è un documento
  interno, non l'app.)
- **Nessun colore o valore scritto a mano fuori dai token.** Se manca un
  valore, si aggiunge un token.
- Nessuna libreria, nessun CSS esterno, nessun passaggio di compilazione.

### I tre ruoli del colore, che devono restare distinguibili a colpo d'occhio

| ruolo | oggi | non deve confondersi con |
|---|---|---|
| **azione** | blu `#1B47C9` | — |
| **eliminare** | rosso `#CC2B1D` | l'azione |
| **copia di sicurezza** | arancione `#A34A00` su `#FFF3E3` | né l'azione né l'eliminazione: non è un errore e non distrugge niente |

Tutti i contrasti testo/sfondo devono restare **conformi AA** (4.5:1 per il
testo normale). I valori attuali sono annotati dentro `tokens/colors.css`:
mantieni quell'abitudine, scrivi il rapporto di contrasto accanto a ogni colore
nuovo.

## 6. Cosa consegni

1. I quattro file CSS ridisegnati, in `design_handoff/` **e** copiati in
   `src/css/`.
2. `reference.html` aggiornato, che deve continuare a mostrare **tutti** i
   componenti e **le tre schermate intere** alla larghezza di un iPhone 15. È
   il documento su cui si approva il lavoro prima di guardarlo sul telefono.
3. Tutti i dati d'esempio **inventati**: nel repo non entra mai un orario o un
   importo reale di Viktoria.

## 7. Lista di controllo prima di dire "fatto"

- [ ] `src/index.html` e `src/js/*` non sono stati toccati (`git diff` pulito
      su quei percorsi).
- [ ] Nessuna classe dell'elenco della sezione 3 è sparita.
- [ ] Le quattro regole della sezione 4 sono presenti.
- [ ] `design_handoff/*.css` e `src/css/*.css` sono identici.
- [ ] L'app si apre senza errori in console.
- [ ] A 390px di larghezza non c'è scorrimento orizzontale.
- [ ] Il pulsante `Copy summary` è visibile senza scorrere, con la settimana
      piena.
- [ ] Ogni bersaglio di tocco è ≥ 44×44.
- [ ] Contrasti AA verificati e annotati.
- [ ] Provata sull'iPhone dalla schermata home, non solo nel browser.
- [ ] Il lavoro è su un ramo tuo e **non** è stato fatto merge su `main`.

## 8. Lavoro separato: le icone

Le icone attuali sono **segnaposto dichiarati**: un quadrato blu con una "S"
bianca.

- `src/icons/icon-192.png` — 192×192
- `src/icons/icon-512.png` — 512×512, usata anche come `maskable`

Sono referenziate da `src/manifest.webmanifest` e da `apple-touch-icon` in
`src/index.html`. **I nomi dei file devono restare quelli**: bastano i due PNG
sostituiti. Essendo `maskable`, il soggetto deve stare dentro il cerchio di
sicurezza centrale, perché iOS ritaglia gli angoli.

## 9. Cosa NON fare

- Non aggiungere funzioni, schermate, campi o impostazioni.
- Non cambiare i testi in inglese dell'app.
- Non introdurre la modalità scura.
- Non toccare `service-worker.js`, `manifest.webmanifest`, i file `.js`.
- Non rimuovere l'avviso arancione della copia di sicurezza né renderlo
  chiudibile: resta finché la copia non è stata fatta, ed è la cosa che tiene
  in vita i suoi dati.
