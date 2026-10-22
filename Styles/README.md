# 🎨 Stili di RoccobotOS

Il sito si apre con `RoccobotOS 1.43`. Il numero di versione della pagina apre il selettore, disponibile a chiunque senza accesso. Un clic su uno stile o le frecce della tastiera applicano l'anteprima; `Invio`, il pulsante di chiusura o un clic fuori dal pannello conservano la scelta nella pagina aperta. `Esc` ripristina lo stile presente all'apertura. Nessuna scelta viene memorizzata: il ricaricamento riparte sempre dalla `1.43`.

- `RoccobotOS100.css`, versione dello stile `1.00`: aspetto originale.
- `RoccobotOS140.css`, versione dello stile `1.40`: geometria Web originale, titolo H1 senza separatore. I link sulle intestazioni e sulle colonne strette usano `#196E5E` per conservarne la leggibilità.
- `RoccobotOS141.css`, versione dello stile `1.41`: la `1.40` con il codice in verde (filo `#43B59E`, corpo 95%, una sola famiglia monospaziata) e l'intestazione delle tabelle in verde scuro, distinta dalle celle e dalle colonne strette.
- `RoccobotOS142.css`, versione dello stile `1.42`: la `1.41` con l'intestazione delle tabelle in tema chiaro su verde tenue `#C5DED3`, testo `#0F4A3F` (7,13:1) e separatori `#A3C2B5`; tema scuro invariato.
- `RoccobotOS143.css`, versione dello stile `1.43`: aspetto predefinito, la `1.42` con l'indice su verde (`#D9E8E0` chiaro, `#1B2E28` scuro, link `#14594C` e `#9FE3CF`) e un accento terracotta (`#A3471E` chiaro, `#F2A07B` scuro) sulla voce attiva dell'indice e sul filo sotto i titoli H2, ora di 2 px.
- `index.json`: catalogo generato dalle quattro voci dell'intestazione Aomidori.
- `admin/manage.html`: pagina per aggiungere file dopo l'accesso GitHub.

I file CSS sono autonomi e sostituiscono l'intero foglio del sito. Devono quindi coprire anche indice, tabelle e comandi, oltre al testo. Un CSS per Aomidori usa una struttura diversa: la sola intestazione comune non lo rende automaticamente adatto alla pagina Web.

Per un'aggiunta manuale al repository, salva il CSS in questa cartella e rigenera il catalogo dalla radice:

```sh
node scripts/styles-catalog.mjs
```

Il caricamento dalla pagina di gestione aggiorna CSS e catalogo nello stesso commit e rifiuta nomi esistenti. La configurazione del servizio è descritta in [cloud/styles/README.md](../cloud/styles/README.md). Finché `admin/config.json` non contiene l'indirizzo del servizio, la pagina indica che l'accesso deve essere attivato.

`index.html` carica direttamente `RoccobotOS143.css` da questa cartella, senza fogli intermedi; il selettore sostituisce quel collegamento con lo stile scelto. Il caricamento autenticato è predisposto ma inattivo, senza collegamento nel selettore.
