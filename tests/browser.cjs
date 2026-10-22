const { webkit } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const url = 'http://127.0.0.1:18770/';
const results = [];
async function check(name, action) { await action(); results.push(name); }
(async () => {
  const browser = await webkit.launch({...(process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE } : {}),headless:true});
  try {
    for(const width of [390,1440]) for(const theme of ['light','dark']) {
      const context = await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
      const page = await context.newPage();
      await page.route('https://**/*', route=>route.abort());
      const errors=[]; page.on('pageerror', e=>errors.push(e.message));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      const trigger=page.locator(width>860?'#tocVersion':'#siteVersion');
      await trigger.waitFor({state:'visible'});
      await check(`${width}/${theme}: 1.41 is the default`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS141.css'));
      await check(`${width}/${theme}: table header stands apart from body and narrow cells`,async()=>{
        const fills=await page.evaluate(()=>{const bg=e=>getComputedStyle(e).backgroundColor;const t=document.querySelector('.markdown-body table.narrow-cols-odd, .markdown-body table.narrow-cols-even');return {th:bg(t.querySelector('th')),row:bg(t.querySelector('tbody tr')),narrow:bg(t.querySelector(t.classList.contains('narrow-cols-odd')?'tbody td:nth-child(odd)':'tbody td:nth-child(2n)'))};});
        assert.notEqual(fills.th,fills.row); assert.notEqual(fills.th,fills.narrow);
      });
      await check(`${width}/${theme}: both formats expose one version`,async()=>assert.equal(await page.locator('[data-style-picker]:visible').count(),1));
      const before=await page.locator('h1').first().evaluate(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,padding:getComputedStyle(e).paddingBottom}));
      await trigger.click();
      const list=page.getByRole('listbox');
      await page.getByRole('option').last().waitFor();
      await check(`${width}/${theme}: three registered styles`,async()=>assert.equal(await page.getByRole('option').count(),3));
      await check(`${width}/${theme}: SlimVer names without Paper`,async()=>{
        const labels=await page.getByRole('option').allTextContents();
        assert.deepEqual(labels,['RoccobotOS1.00','RoccobotOS1.40','RoccobotOS1.41']);
        assert.equal(await page.getByRole('link',{name:'Aggiungi uno stile'}).count(),0);
      });
      await page.getByRole('option').first().click();
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS100.css'));
      await check(`${width}/${theme}: original 1.00 can be previewed`,async()=>{
        assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),theme==='light'?'rgb(254, 255, 255)':'rgb(18, 18, 18)');
        assert.equal(await page.locator('h1').first().evaluate(e=>getComputedStyle(e).borderBottomWidth),'1px');
      });
      await check(`${width}/${theme}: typography and layout preserved`,async()=>assert.deepEqual(await page.locator('h1').first().evaluate(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,padding:getComputedStyle(e).paddingBottom})),before));
      await list.press('Escape');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS141.css'));
      await check(`${width}/${theme}: Escape restores initial style and focus`,async()=>{
        assert.equal(await page.getByRole('dialog').isVisible(),false);
        assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);
      });
      await trigger.click();
      await list.press('ArrowUp');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS140.css'));
      await list.press('Enter');
      await check(`${width}/${theme}: keyboard selection commits on Enter`,async()=>assert.equal(await page.getByRole('dialog').isVisible(),false));
      await trigger.click();
      await list.press('End'); await list.press('Home'); await list.press('End');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS141.css'));
      await check(`${width}/${theme}: rapid selection leaves one active sheet`,async()=>assert.equal(await page.locator('link[data-site-style]').count(),1));
      await page.getByRole('button',{name:'Chiudi il selettore'}).click();
      await trigger.click();
      await list.press('Home');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS100.css'));
      await list.press('Enter');
      await page.reload({waitUntil:'domcontentloaded'});
      await check(`${width}/${theme}: reload discards the temporary choice`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS141.css'));
      await check(`${width}/${theme}: no JavaScript errors`,async()=>assert.deepEqual(errors,[]));
      await page.goto(url+'Styles/admin/manage.html',{waitUntil:'domcontentloaded'});
      await check(`${width}/${theme}: management remains closed without configuration`,async()=>{
        await page.getByText('Il caricamento con GitHub deve ancora essere attivato.').waitFor();
        assert.equal(await page.locator('#upload').isVisible(),false);
      });
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:1200,height:900}});
    const page=await context.newPage();
    await page.route('https://**/*',route=>route.abort());
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#tocVersion').click();
    await page.getByRole('option').last().waitFor();
    await page.route('**/Styles/RoccobotOS100.css',route=>route.abort());
    await page.getByRole('option').first().click();
    await page.getByText('Lo stile non si carica. La pagina conserva quello precedente.').waitFor();
    await check('failed stylesheet leaves default 1.41 active',async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS141.css'));
    await context.close();
    if (process.env.VERIFICATION_REPORT) await fs.writeFile(process.env.VERIFICATION_REPORT, JSON.stringify({ passed: results.length, checks: results }, null, 2));
    console.log(JSON.stringify({passed:results.length,checks:results},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
