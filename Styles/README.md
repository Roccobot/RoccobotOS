# 🎨 Stili di RoccobotOS

Il sito si apre con `RoccobotOS 1.40`. Il numero di versione della pagina apre il selettore, disponibile a chiunque senza accesso. Un clic su uno stile o le frecce della tastiera applicano l'anteprima; `Invio`, il pulsante di chiusura o un clic fuori dal pannello conservano la scelta nella pagina aperta. `Esc` ripristina lo stile presente all'apertura. Nessuna scelta viene memorizzata: il ricaricamento riparte sempre dalla `1.40`.

- `RoccobotOS100.css`, versione dello stile `1.00`: aspetto originale.
- `RoccobotOS140.css`, versione dello stile `1.40`: aspetto predefinito, geometria Web originale, titolo H1 senza separatore. I link sulle intestazioni e sulle colonne strette usano `#196E5E` per conservarne la leggibilità.
- `index.json`: catalogo generato dalle quattro voci dell'intestazione Aomidori.
- `admin/manage.html`: pagina per aggiungere file dopo l'accesso GitHub.

I file CSS sono autonomi e sostituiscono l'intero foglio del sito. Devono quindi coprire anche indice, tabelle e comandi, oltre al testo. Un CSS per Aomidori usa una struttura diversa: la sola intestazione comune non lo rende automaticamente adatto alla pagina Web.

Per un'aggiunta manuale al repository, salva il CSS in questa cartella e rigenera il catalogo dalla radice:

```sh
node scripts/styles-catalog.mjs
```

Il caricamento dalla pagina di gestione aggiorna CSS e catalogo nello stesso commit e rifiuta nomi esistenti. La configurazione del servizio è descritta in [cloud/styles/README.md](../cloud/styles/README.md). Finché `admin/config.json` non contiene l'indirizzo del servizio, la pagina indica che l'accesso deve essere attivato.

`index.html` carica direttamente `RoccobotOS140.css` da questa cartella, senza fogli intermedi; il selettore sostituisce quel collegamento con lo stile scelto. Il caricamento autenticato è predisposto ma inattivo, senza collegamento nel selettore.
