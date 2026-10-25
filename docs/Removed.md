# Removed.md: le cose tolte da RoccobotOS, e come si recuperano

> **Cos'è questo file.** L'archivio di quello che è uscito dal sito: per ogni cosa tolta, che cosa
> faceva, quando è stata tolta, e da quale commit si recupera. Si legge su richiesta, quando
> qualcuno vuole riportare indietro una funzione o capire dove viveva.
> ⚠️ **Nei file di regole resta solo la decisione** (che la cosa non c'è più, e perché): ogni
> appunto su come recuperarla vive qui, corto o lungo che sia (regola universale in
> `rules/Roccobot.md` di `Roccobot/tools`, § '🗄️ Le cose tolte vivono in Removed.md').
> Le voci vanno dalla più recente alla più vecchia.

## 🧮 MathJax

- **Che cosa faceva**: rendeva le formule TeX della pagina, caricato da un CDN. In pagina non
  c'era nessuna formula, e il suo `processEscapes`, acceso di serie, si mangiava una barra
  rovesciata: il perché della decisione resta in `Rules.md` § '🚩 Flag, sotto-pagine e decisioni
  da non rovesciare'.
- **Tolto nella `3.00`** (2026-08-01).
- **Si recupera dal commit `0127581^`**, cioè il genitore del commit di `main` della `3.00` (il
  repo non ha tag). Dove viveva:
  - in `index.html`, in testa, due `<script>` con la configurazione `window.MathJax` e il
    caricamento di `mathjax@3/es5/tex-chtml-full.js` da jsDelivr;
  - ⚠️ **l'avvio di Prism (`Prism.highlightAll`) conviveva con la configurazione di MathJax nella
    stessa riga**: chi rimette MathJax controlla che resti;
  - `BackslashTest.html`, la pagina di prova che ha isolato il difetto, tolta nello stesso commit.
- Il comando che mostra la pagina di allora: `git show 0127581^:index.html`.

## 🖼️ Le icone PNG del testo

- **Che cosa facevano**: `icona1.png`... `icona7.png` erano le iconcine dentro il testo di
  `index.html`, PNG neri, quasi invisibili al buio.
- **Tolte il 2026-07-31**, quando le iconcine sono diventate SVG inline che seguono il colore del
  testo (`Rules.md` § '🖼️ Le iconcine del testo: SVG che seguono il colore').
- **Si recuperano dal commit `34cc56c^`**, cioè il genitore del commit di `main` che le ha tolte
  (il repo non ha tag). Dove vivevano: i sette file alla radice del sito, richiamati dalle `<img>`
  di `index.html`.
- Il comando che ne estrae una: `git show 34cc56c^:icona1.png > icona1.png`.
