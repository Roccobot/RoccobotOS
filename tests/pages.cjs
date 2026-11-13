// Checks added in 4.54 (giro Vaglio, RoccobotOS-13): the four sub-pages, the contents the page
// keeps in two places, the index on a phone and the keyboard picture. tests/browser.cjs calls
// run() with its browser, its server address and its check(); nothing here starts a server.
// Author: Rocco Casadei, a.k.a. Roccobot
const assert = require('node:assert/strict');

const SUB_PAGES = ['Characters', 'Formats', 'AdServers', 'BlendModes'];
// The pages whose tables keep the 5px frame and the 3px cell corners of their export (Tabelle-01,
// 4.55): there the inner cells are rounded on purpose, and the check turns round to want them.
const FRAMED = ['Formats', 'BlendModes'];
const WIDTHS = [390, 900, 1440];

async function open(browser, address, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.route('https://**/*', route => route.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(address, { waitUntil: 'load' });
  return { context, page, errors };
}

// Every element of the body, as tag and box: the anti-jitter measure of the main page, on a sub-page.
function measure() {
  const boxes = [...document.querySelectorAll('body *')].map(e => {
    const b = e.getBoundingClientRect();
    return [e.tagName, ...[b.left + scrollX, b.top + scrollY, b.width, b.height].map(v => +v.toFixed(2))].join(',');
  });
  return {
    boxes, page: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, iw: innerWidth,
    sheets: document.querySelectorAll('style').length,
    loose: [...document.querySelectorAll('table')].filter(t => !t.parentElement.classList.contains('pg-scroll')).length,
    innerRadius: [...document.querySelectorAll('td, th')].filter(c => parseFloat(getComputedStyle(c).borderTopLeftRadius) > 0 && c.cellIndex > 0).length,
    inner: [...document.querySelectorAll('td, th')].filter(c => c.cellIndex > 0).length,
    framed: [...document.querySelectorAll('table')].filter(t => {
      const g = getComputedStyle(t), tb = t.getBoundingClientRect(), cb = t.rows[0].cells[0].getBoundingClientRect();
      return g.paddingTop === '5px' && g.paddingLeft === '5px' && Math.abs(cb.left - tb.left - 6) < .01 && Math.abs(cb.top - tb.top - 6) < .01;
    }).length,
    tables: document.querySelectorAll('table').length
  };
}

async function subPages(browser, url, check) {
  for (const name of SUB_PAGES) {
    const lay = {};
    for (const width of WIDTHS) for (const theme of ['light', 'dark']) {
      const { context, page, errors } = await open(browser, url + name + '.html', { viewport: { width, height: 900 }, colorScheme: theme });
      const m = await page.evaluate(measure);
      lay[theme] = m;
      const framed = FRAMED.includes(name);
      await check(`${name} ${width}/${theme}: the page does not scroll sideways, every table is in its scrolling box, no inline style sheet, ${framed ? 'every table keeps the 5px frame and every cell its rounded corner' : 'no frame and no rounded inner cell'}`, async () => {
        assert.ok(m.sw <= m.iw, `page ${m.sw}px wide in a ${m.iw}px window`);
        assert.equal(m.loose, 0, 'tables outside div.pg-scroll');
        assert.equal(m.sheets, 0, '<style> blocks');
        if (framed) {
          assert.equal(m.framed, m.tables, 'tables with the 5px frame');
          assert.equal(m.innerRadius, m.inner, 'inner cells with a rounded corner');
        } else {
          assert.equal(m.framed, 0, 'tables with a frame');
          assert.equal(m.innerRadius, 0, 'inner cells with a rounded corner');
        }
        assert.deepEqual(errors, []);
      });
      if (theme === 'dark') await check(`${name} ${width}: anti-jitter, light and dark have the same layout (every element box and the page length)`, async () => {
        assert.equal(m.page, lay.light.page);
        assert.equal(m.boxes.length, lay.light.boxes.length);
        const moved = m.boxes.filter((b, i) => b !== lay.light.boxes[i]).length;
        assert.equal(moved, 0, moved + ' elements move between the themes');
      });
      await context.close();
    }
  }
}

async function contents(browser, url, check) {
  const { context, page } = await open(browser, url, { viewport: { width: 1200, height: 900 } });
  await check('the replacement table has the same entries as OS Files/Text Replacements.plist, and the page states their number', async () => {
    const r = await page.evaluate(async () => {
      // The Apple logo is an icon in the page and the private-use character in the plist (Rules.md).
      const cell = td => td.querySelector('svg[aria-label="Logo Apple"]') ? '' : td.textContent.trim();
      const inPage = [];
      for (const tr of document.querySelectorAll('table.sost-table tbody tr')) {
        const c = [...tr.cells];
        for (let i = 0; i + 1 < c.length; i += 2) if (cell(c[i])) inPage.push(cell(c[i]) + ' => ' + cell(c[i + 1]));
      }
      const text = await (await fetch('OS%20Files/Text%20Replacements.plist')).text();
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      const inPlist = [...xml.querySelectorAll('array > dict')].map(d => {
        const v = {}, k = [...d.children];
        for (let i = 0; i + 1 < k.length; i += 2) v[k[i].textContent] = k[i + 1].textContent;
        return v.shortcut + ' => ' + v.phrase;
      });
      const stated = (document.body.textContent.match(/Text Replacements\.plist, (\d+) voci/) || [])[1];
      return { inPage: inPage.sort(), inPlist: inPlist.sort(), stated: +stated };
    });
    assert.deepEqual(r.inPage, r.inPlist);
    assert.equal(r.inPlist.length, r.stated);
  });
  await check('the IPv4 and IPv6 DNS tables list the same services, in natural alphabetical order, with no empty cell', async () => {
    const r = await page.evaluate(() => {
      const tables = [...document.querySelectorAll('#markdown_content table')].filter(t => /Indirizzo IPV[46]/i.test(t.tHead ? t.tHead.textContent : ''));
      const names = t => [...t.tBodies[0].rows].map(row => row.cells[0].textContent.replace(/[†‡*]/g, '').trim());
      return { n: tables.length, v4: names(tables[0]), v6: names(tables[1]), empty: tables.flatMap(t => [...t.querySelectorAll('td')]).filter(td => !td.textContent.trim()).length };
    });
    assert.equal(r.n, 2);
    assert.deepEqual(r.v4, r.v6);
    assert.deepEqual(r.v4, [...r.v4].sort(new Intl.Collator('it', { numeric: true, sensitivity: 'base' }).compare));
    assert.equal(r.empty, 0);
  });
  await check('the keyboard picture states its real size, and keeps its proportions in the page', async () => {
    const img = page.locator('img[src="Keyboard.gif"]');
    await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('img[src="Keyboard.gif"]').complete);
    const r = await img.evaluate(e => ({ w: +e.getAttribute('width'), h: +e.getAttribute('height'), nw: e.naturalWidth, nh: e.naturalHeight, rw: e.getBoundingClientRect().width, rh: e.getBoundingClientRect().height }));
    assert.equal(r.w, r.nw); assert.equal(r.h, r.nh);
    assert.ok(Math.abs(r.rw / r.rh - r.nw / r.nh) < .01, `rendered ${r.rw}x${r.rh}`);
  });
  await context.close();
}

async function phoneIndex(browser, url, check) {
  const { context, page } = await open(browser, url, { viewport: { width: 390, height: 800 } });
  // Halfway down the page, where the fixed controls show while scrolling.
  await page.mouse.wheel(0, 4000); await page.waitForTimeout(150); await page.mouse.wheel(0, 200);
  await page.waitForFunction(() => document.getElementById('tocToggle').style.opacity !== '0');
  await check('390: the touch area of the fixed controls is 44px wide, the drawing stays 34px', async () => {
    const r = await page.evaluate(() => ['tocToggle', 'scrollTopToggle', 'scrollBottomToggle'].map(id => {
      const e = document.getElementById(id), b = e.getBoundingClientRect(), y = b.top + b.height / 2;
      return { id, size: b.width, edge: document.elementFromPoint(b.left - 4, y) === e && document.elementFromPoint(b.right + 4, y) === e };
    }));
    for (const x of r) { assert.equal(x.size, 34, x.id); assert.ok(x.edge, x.id + ' does not answer 4px outside its drawing'); }
  });
  await check('390: opening the index moves the focus into it, Esc closes it and gives the focus back to the visible index button', async () => {
    await page.locator('#tocToggle').click();
    const inside = await page.evaluate(() => { const a = document.activeElement; return !!a && a.matches('a.toc-link') && !!a.closest('.mweb_toc_wrap_ct') });
    assert.equal(inside, true, 'focus on an index entry');
    await page.keyboard.press('Escape');
    const back = await page.evaluate(() => { const t = document.getElementById('tocToggle'); return { open: document.documentElement.getAttribute('data-mobile-toc'), focus: document.activeElement === t, opacity: t.style.opacity, hidden: t.getAttribute('aria-hidden') } });
    assert.deepEqual(back, { open: null, focus: true, opacity: '', hidden: null });
  });
  await context.close();
}

async function run(browser, url, check) {
  await subPages(browser, url, check);
  await contents(browser, url, check);
  await phoneIndex(browser, url, check);
}

module.exports = { run };
