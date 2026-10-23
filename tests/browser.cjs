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
      await check(`${width}/${theme}: 1.51 is the default`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS151.css'));
      await check(`${width}/${theme}: table header stands apart from body and narrow cells`,async()=>{
        const fills=await page.evaluate(()=>{const bg=e=>getComputedStyle(e).backgroundColor;const t=document.querySelector('.markdown-body table.narrow-cols-odd, .markdown-body table.narrow-cols-even');return {th:bg(t.querySelector('th')),row:bg(t.querySelector('tbody tr')),narrow:bg(t.querySelector(t.classList.contains('narrow-cols-odd')?'tbody td:nth-child(odd)':'tbody td:nth-child(2n)'))};});
        assert.notEqual(fills.th,fills.row); assert.notEqual(fills.th,fills.narrow);
      });
      await check(`${width}/${theme}: table text rows are 2px taller and inline code padding is in em`,async()=>{
        const m=await page.evaluate(()=>{const t=[...document.querySelectorAll('#markdown_content table')].find(x=>x.querySelector('td code'));const td=t.querySelector('td');const c=getComputedStyle(td);const k=[...document.querySelectorAll('#markdown_content :not(pre)>code')].find(e=>!e.closest('a,pre,table'));const ks=getComputedStyle(k);return {lh:parseFloat(c.lineHeight)/parseFloat(c.fontSize),top:parseFloat(ks.paddingTop)/parseFloat(ks.fontSize),bottom:parseFloat(ks.paddingBottom)/parseFloat(ks.fontSize),weight:ks.fontWeight,trim:ks.textBox||ks.getPropertyValue('text-box')}});
        assert.ok(Math.abs(m.lh-1.639)<.002,'table line height '+m.lh);
        if(theme==='dark'){assert.ok(Math.abs(m.top-.264)<.002,'padding top '+m.top);assert.ok(Math.abs(m.bottom-.286)<.002,'padding bottom '+m.bottom);assert.equal(m.weight,'500');}
      });
      await check(`${width}/${theme}: page lengths follow the root font size`,async()=>{
        const m=await page.evaluate(()=>{const v=()=>{const b=getComputedStyle(document.body);const k=document.querySelector('#markdown_content table:not(.index-grid) td');return [parseFloat(b.paddingLeft),parseFloat(getComputedStyle(k).paddingLeft)]};const a=v();document.documentElement.style.fontSize='20px';const z=v();document.documentElement.style.fontSize='';return {a,z}});
        assert.ok(m.a[0]>0&&m.a[1]>0);
        assert.ok(Math.abs(m.z[0]-m.a[0]*1.25)<.01,'body padding '+m.a[0]+' -> '+m.z[0]);
        if(width<=600)assert.ok(Math.abs(m.z[1]-m.a[1]*1.25)<.01,'cell padding '+m.a[1]+' -> '+m.z[1]);
      });
      await check(`${width}/${theme}: double click on inline code copies its text and confirms`,async()=>{
        const testo=await page.evaluate(()=>{const c=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('a,pre,table')&&e.textContent.trim().length>2);c.id='prova-doppio-clic';window.__copiati=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__copiati.push(t);return Promise.resolve()}},configurable:true});return c.textContent});
        const code=page.locator('#prova-doppio-clic');
        await code.scrollIntoViewIfNeeded();
        await code.dblclick();
        await page.waitForFunction(()=>window.__copiati.length>0);
        assert.deepEqual(await page.evaluate(()=>window.__copiati),[testo]);
        assert.equal(await code.evaluate(e=>e.classList.contains('copiato')),true);
        assert.equal(await page.evaluate(()=>window.getSelection().toString()),testo);
        await page.waitForFunction(()=>!document.getElementById('prova-doppio-clic').classList.contains('copiato'));
      });
      await check(`${width}/${theme}: double click shows the Codice copiato notice`,async()=>{
        const code=page.locator('#prova-doppio-clic');
        const h0=await page.evaluate(()=>document.documentElement.scrollHeight);
        await code.dblclick();
        const toast=page.locator('.avviso-codice');
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('.avviso-codice')).visibility==='visible'&&document.querySelector('.avviso-codice').textContent==='Codice copiato');
        assert.equal(await toast.getAttribute('role'),'status');
        assert.equal(await toast.getAttribute('aria-live'),'polite');
        const st=await toast.evaluate(e=>{const c=getComputedStyle(e);return {pos:c.position,bg:c.backgroundColor,fg:c.color,h:document.documentElement.scrollHeight}});
        assert.equal(st.pos,'fixed');
        assert.equal(st.h,h0,'no layout shift');
        assert.equal(st.bg,theme==='dark'?'rgb(230, 240, 175)':'rgb(22, 48, 42)');
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('.avviso-codice')).visibility==='hidden',null,{timeout:4000});
        await page.emulateMedia({reducedMotion:'reduce'});
        assert.ok(parseFloat(await toast.evaluate(e=>getComputedStyle(e).transitionDuration))<.001,'reduced motion removes the fade');
        await page.emulateMedia({reducedMotion:'no-preference'});
      });
      await check(`${width}/${theme}: code text is 90% of the surrounding text`,async()=>{
        const r=await page.evaluate(()=>{const q=document.querySelectorAll('#markdown_content');const f=e=>parseFloat(getComputedStyle(e).fontSize);const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a,h1,h2,h3,h4,h5,h6')&&e.parentElement.tagName==='P');const pre=document.querySelector('#markdown_content pre');return {inline:f(ic)/f(ic.parentElement),pre:f(pre)/f(pre.parentElement),inner:f(pre.querySelector('code'))/f(pre)}});
        assert.ok(Math.abs(r.inline-.9)<.005,'inline '+r.inline);
        assert.ok(Math.abs(r.pre-.9)<.005,'pre '+r.pre);
        assert.equal(r.inner,1);
      });
      await check(`${width}/${theme}: the plist example is a normal code block`,async()=>{
        const r=await page.evaluate(()=>{const c=[...document.querySelectorAll('#markdown_content pre>code')].find(e=>e.textContent.includes('NOMEAPP</string>')&&e.textContent.includes('<plist'));return c?{cls:c.className,txt:c.textContent,small:!!c.closest('pre').querySelector('small'),old:document.querySelectorAll('.plist-box').length}:null});
        assert.ok(r,'plist block found');
        assert.equal(r.cls,'language-plain_text');
        assert.equal(r.old,0);assert.equal(r.small,false);
        const lines=r.txt.split('\n');
        assert.equal(lines[0],'<?xml version="1.0" encoding="UTF-8"?>');
        assert.equal(lines.length,17);
        assert.equal(lines[lines.length-2],'</plist>');
        assert.equal(lines[lines.length-1],'');
        assert.equal(lines[8],'    <string>/usr/bin/open</string>');
      });
      await check(`${width}/${theme}: dark code is sage with white text, light is unchanged, tables have 1rem corners`,async()=>{
        const r=await page.evaluate(()=>{const g=e=>getComputedStyle(e);const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a')&&e.parentElement.tagName==='P');const pre=document.querySelector('#markdown_content pre');const h=document.querySelector('a#SezioneSistema').closest('h1');const t=document.querySelector('#markdown_content table:not(.index-grid)');const h1o=[...document.querySelectorAll('#markdown_content h1')].find(e=>!e.querySelector('#SezioneSistema,#ScorciatoieApp'));const ap=document.querySelector('a#ScorciatoieApp').closest('h1');return {body:g(document.querySelector('#markdown_content p')).color,hfs:g(h).fontSize+'/'+g(ap).fontSize+'/'+g(ap).color,h1fs:g(h1o).fontSize+'/'+g(h1o).fontSize+'/'+g(h).color,ib:g(ic).backgroundColor,ic:g(ic).color,ibw:g(ic).borderTopWidth,pb:g(pre).backgroundColor,pc:g(pre).color,pbw:g(pre).borderTopWidth,h:g(h).color,rad:g(t).borderTopLeftRadius,tables:document.documentElement.dataset.tables}});
        if(theme==='dark'){
          assert.equal(r.ib,'rgb(146, 162, 121)');assert.equal(r.pb,'rgb(146, 162, 121)');
          assert.equal(r.ic,'rgb(10, 26, 18)');assert.equal(r.pc,'rgb(10, 26, 18)');
          assert.equal(r.ibw,'0px');assert.equal(r.pbw,'0px');
          assert.equal(r.h,r.body);assert.equal(r.h,'rgb(222, 229, 225)');assert.equal(r.hfs,r.h1fs);
        }else{
          assert.equal(r.ib,'rgb(230, 244, 239)');assert.equal(r.ic,'rgb(20, 89, 76)');
        }
        if(r.tables!=='cards')assert.equal(r.rad,'16px');
      });
      await check(`${width}/${theme}: both formats expose one version`,async()=>assert.equal(await page.locator('[data-style-picker]:visible').count(),1));
      const before=await page.locator('h1').first().evaluate(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,padding:getComputedStyle(e).paddingBottom}));
      await trigger.click();
      const list=page.getByRole('listbox');
      await page.getByRole('option').last().waitFor();
      await check(`${width}/${theme}: thirteen registered styles`,async()=>assert.equal(await page.getByRole('option').count(),13));
      await check(`${width}/${theme}: SlimVer names without Paper`,async()=>{
        const labels=await page.getByRole('option').allTextContents();
        assert.deepEqual(labels,['RoccobotOS1.00','RoccobotOS1.40','RoccobotOS1.41','RoccobotOS1.42','RoccobotOS1.43','RoccobotOS1.44','RoccobotOS1.45','RoccobotOS1.46','RoccobotOS1.47','RoccobotOS1.48','RoccobotOS1.49','RoccobotOS1.50','RoccobotOS1.51']);
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
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS151.css'));
      await check(`${width}/${theme}: Escape restores initial style and focus`,async()=>{
        assert.equal(await page.getByRole('dialog').isVisible(),false);
        assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);
      });
      await trigger.click();
      await list.press('ArrowUp');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS150.css'));
      await list.press('Enter');
      await check(`${width}/${theme}: keyboard selection commits on Enter`,async()=>assert.equal(await page.getByRole('dialog').isVisible(),false));
      await trigger.click();
      await list.press('End'); await list.press('Home'); await list.press('End');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS151.css'));
      await check(`${width}/${theme}: rapid selection leaves one active sheet`,async()=>assert.equal(await page.locator('link[data-site-style]').count(),1));
      await page.getByRole('button',{name:'Chiudi il selettore'}).click();
      await trigger.click();
      await list.press('Home');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS100.css'));
      await list.press('Enter');
      await page.reload({waitUntil:'domcontentloaded'});
      await check(`${width}/${theme}: reload discards the temporary choice`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS151.css'));
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
    await check('failed stylesheet leaves default 1.51 active',async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS151.css'));
    await context.close();
    if (process.env.VERIFICATION_REPORT) await fs.writeFile(process.env.VERIFICATION_REPORT, JSON.stringify({ passed: results.length, checks: results }, null, 2));
    console.log(JSON.stringify({passed:results.length,checks:results},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
