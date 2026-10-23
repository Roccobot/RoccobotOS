# 🎨 Stili di RoccobotOS

Il sito si apre con `RoccobotOS 1.54`. Il numero di versione della pagina apre il selettore, disponibile a chiunque senza accesso. Un clic su uno stile o le frecce della tastiera applicano l'anteprima; `Invio`, il pulsante di chiusura o un clic fuori dal pannello conservano la scelta nella pagina aperta. `Esc` ripristina lo stile presente all'apertura. Nessuna scelta viene memorizzata: il ricaricamento riparte sempre dallo stile predefinito.

- `RoccobotOS100.css`, versione dello stile `1.00`: aspetto originale.
- `RoccobotOS142.css`, versione dello stile `1.42`: la `1.41` con l'intestazione delle tabelle in tema chiaro su verde tenue `#C5DED3`, testo `#0F4A3F` (7,13:1) e separatori `#A3C2B5`; tema scuro invariato.
- `RoccobotOS154.css`, versione dello stile `1.54`, aspetto predefinito: la `1.53` con, in tema chiaro, riquadri di codice (in riga e blocchi) verde acqua `#00727B` con testo e icona di copia bianchi (5,69:1; 5,33:1 sul fondo pagina e 5,02:1 sull'indice), senza bordo né altra differenza di forma dal tema scuro: peso 500, stessa famiglia del testo, stesso riquadro in riga (margine in em e testo ritagliato), stessa interlinea nei blocchi e nelle celle delle tabelle (1,639), così l'impaginazione è identica nei due temi e il cambio tema sposta solo i colori. Il contorno del doppio clic in tema chiaro è `#0A1A12` (3,16:1 sul riquadro). Gli H1 arancio passano da `#7B480E` a `#9D5A18` (5,04:1 su `#F7F8F5`); le divisioni Sistema e Applicazioni sono un verde acqua quasi grigio `#52635F` (5,95:1), con regola fissa anche sulle ancore. Tema scuro identico alla `1.53`, pixel per pixel.
- Restano in cartella solo la `1.00` (originale, fissa), la `1.42` e la `1.54`. Le versioni `1.40`, `1.41` e da `1.43` a `1.53` sono state tolte dalla cartella; si recuperano dalla cronologia di git (per esempio `git log -- Styles/RoccobotOS153.css`).
- `index.json`: catalogo generato dalle quattro voci dell'intestazione Aomidori.
- `admin/manage.html`: pagina per aggiungere file dopo l'accesso GitHub.

I file CSS sono autonomi e sostituiscono l'intero foglio del sito. Devono quindi coprire anche indice, tabelle e comandi, oltre al testo. Un CSS per Aomidori usa una struttura diversa: la sola intestazione comune non lo rende automaticamente adatto alla pagina Web.

Per un'aggiunta manuale al repository, salva il CSS in questa cartella e rigenera il catalogo dalla radice:

```sh
node scripts/styles-catalog.mjs
```

Il caricamento dalla pagina di gestione aggiorna CSS e catalogo nello stesso commit e rifiuta nomi esistenti. La configurazione del servizio è descritta in [cloud/styles/README.md](../cloud/styles/README.md). Finché `admin/config.json` non contiene l'indirizzo del servizio, la pagina indica che l'accesso deve essere attivato.

`index.html` carica direttamente `RoccobotOS154.css` da questa cartella, senza fogli intermedi; il selettore sostituisce quel collegamento con lo stile scelto. Il caricamento autenticato è predisposto ma inattivo, senza collegamento nel selettore.
