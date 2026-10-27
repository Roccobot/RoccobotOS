const { webkit } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const url = 'http://127.0.0.1:18770/';
const results = [];
async function check(name, action) { await action(); results.push(name); }
// With a single registered style the picker has nothing to choose, so the selector checks run on a
// catalogue with two throwaway styles in front of the real Roccobot MD.
const stubStyles = {
  'Prova_A.css': { name: 'Prova A', version: '1.00', css: 'body{background-color:rgb(1,2,3)!important}h1{border-bottom:1px solid rgb(4,5,6)}' },
  'Prova_B.css': { name: 'Prova B', version: '1.42', css: 'body{background-color:rgb(7,8,9)!important}' }
};
async function stubCatalogue(page) {
  await page.route('**/styles/index.json', async route => {
    const real = await (await route.fetch()).json();
    const stubs = Object.entries(stubStyles).map(([file, s]) => ({ file, name: s.name, version: s.version, note: 'Test style.', comment: 'Test.' }));
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ styles: [...stubs, ...real.styles] }) });
  });
  for (const [file, s] of Object.entries(stubStyles)) {
    // A style replaces the whole sheet, so each throwaway one is the real default sheet plus its own rules.
    await page.route('**/styles/' + file, async route => {
      const classic = await (await route.fetch({ url: new URL('RoccobotMD.css', route.request().url()).href })).text();
      await route.fulfill({ contentType: 'text/css', body: `${classic}\n${s.css}` });
    });
  }
}
(async () => {
  const browser = await webkit.launch({...(process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE } : {}),headless:true});
  try {
    const lay={};
    for(const width of [390,1440]) for(const theme of ['light','dark']) {
      const context = await browser.newContext({viewport:{width,height:1000},colorScheme:theme});
      const page = await context.newPage();
      await page.route('https://**/*', route=>route.abort());
      const errors=[]; page.on('pageerror', e=>errors.push(e.message));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      const trigger=page.locator(width>860?'#tocVersion':'#siteVersion');
      await trigger.waitFor({state:'visible'});
      await check(`${width}/${theme}: Roccobot MD is the default`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'styles/RoccobotMD.css'));
      await check(`${width}/${theme}: table header stands apart from body and narrow cells`,async()=>{
        const fills=await page.evaluate(()=>{const bg=e=>getComputedStyle(e).backgroundColor;const t=document.querySelector('.markdown-body table.narrow-cols-odd, .markdown-body table.narrow-cols-even');return {th:bg(t.querySelector('th')),row:bg(t.querySelector('tbody tr')),narrow:bg(t.querySelector(t.classList.contains('narrow-cols-odd')?'tbody td:nth-child(odd)':'tbody td:nth-child(2n)'))};});
        assert.notEqual(fills.th,fills.row); assert.notEqual(fills.th,fills.narrow);
      });
      await check(`${width}/${theme}: table text rows are 2px taller and inline code padding is in em`,async()=>{
        const m=await page.evaluate(()=>{const t=[...document.querySelectorAll('#markdown_content table')].find(x=>x.querySelector('td code'));const td=t.querySelector('td');const c=getComputedStyle(td);const k=[...document.querySelectorAll('#markdown_content :not(pre)>code')].find(e=>!e.closest('a,pre,table'));const ks=getComputedStyle(k);return {lh:parseFloat(c.lineHeight)/parseFloat(c.fontSize),top:parseFloat(ks.paddingTop)/parseFloat(ks.fontSize),bottom:parseFloat(ks.paddingBottom)/parseFloat(ks.fontSize),weight:ks.fontWeight,trim:ks.textBox||ks.getPropertyValue('text-box')}});
        assert.ok(Math.abs(m.lh-1.639)<.002,'table line height '+m.lh);
        assert.ok(Math.abs(m.top-.264)<.002,'padding top '+m.top);assert.ok(Math.abs(m.bottom-.286)<.002,'padding bottom '+m.bottom);assert.equal(m.weight,'500');
      });
      await check(`${width}/${theme}: anti-jitter, light and dark have the same layout (every element box and the page length)`,async()=>{
        const m=await page.evaluate(()=>{const r=[];for(const e of document.querySelectorAll('#markdown_content, #markdown_content *')){const b=e.getBoundingClientRect();r.push([e.tagName,+(b.left+scrollX).toFixed(2),+(b.top+scrollY).toFixed(2),+b.width.toFixed(2),+b.height.toFixed(2)].join(','))}const g=e=>getComputedStyle(e);const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a,table'));const pre=document.querySelector('#markdown_content pre');const td=document.querySelector('#markdown_content td');const css=e=>['fontFamily','fontSize','fontWeight','lineHeight','paddingTop','paddingBottom','paddingLeft','paddingRight','borderTopWidth','borderBottomWidth','marginTop','marginBottom','letterSpacing'].map(k=>g(e)[k]).join('|');return {page:document.documentElement.scrollHeight,boxes:r,css:[css(ic),css(pre),css(pre.querySelector('code')),css(td)]}});
        lay[width+theme]=m;
        if(theme==='dark'){const l=lay[width+'light'];assert.ok(l,'light measured first');assert.deepEqual(m.css,l.css);assert.equal(m.page,l.page);assert.equal(m.boxes.length,l.boxes.length);const diff=m.boxes.filter((x,i)=>x!==l.boxes[i]).length;assert.equal(diff,0,diff+' elements move between the themes');}
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
      await check(`${width}/${theme}: Fn shortcuts show the globe centred in the box, copy as Fn and keep the box size`,async()=>{
        const r=await page.evaluate(()=>{const cs=[...document.querySelectorAll('#markdown_content code')];const fn=cs.filter(e=>e.querySelector('svg.ic-fn'));const ref=[...document.querySelectorAll('#markdown_content li code')].find(e=>!e.querySelector('svg')&&!e.closest('a')&&e.textContent==='⌘');const f=[...document.querySelectorAll('#markdown_content li code')].find(e=>e.querySelector('svg.ic-fn')&&e.textContent==='Fn F');const s=f.querySelector('svg');const g=getComputedStyle(s);return {n:fn.length,text:cs.filter(e=>/Fn/.test([...e.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join(''))).length,all:fn.every(e=>e.textContent.startsWith('Fn')&&e.querySelector('svg').getAttribute('aria-label')==='Fn'&&e.querySelector('svg').getAttribute('role')==='img'),hf:f.getBoundingClientRect().height,hr:ref.getBoundingClientRect().height,lf:f.parentElement.getBoundingClientRect().height>0,sh:s.getBoundingClientRect().height,fs:parseFloat(getComputedStyle(f).fontSize),stroke:getComputedStyle(s.querySelector('g')).stroke,color:getComputedStyle(f).color,sTop:s.getBoundingClientRect().top-f.getBoundingClientRect().top,sBot:f.getBoundingClientRect().bottom-s.getBoundingClientRect().bottom,cen:Math.max(...fn.map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e),q=e.querySelector('svg').getBoundingClientRect();return Math.abs((q.top+q.bottom)/2-(r.top+parseFloat(c.borderTopWidth)+r.bottom-parseFloat(c.borderBottomWidth))/2)}))}});
        assert.equal(r.n,26);assert.equal(r.text,0,'no Fn text left in inline code');assert.ok(r.all,'every globe copies as Fn and is labelled');
        assert.ok(Math.abs(r.hf-r.hr)<.01,'box height '+r.hf+' vs '+r.hr);assert.ok(Math.abs(r.sh-r.fs)<.01,'globe 1em '+r.sh);
        assert.ok(r.sTop>0&&r.sBot>0,'globe inside the box '+r.sTop+' '+r.sBot);assert.ok(r.cen<.25,'globe off the box centre by '+r.cen);assert.equal(r.stroke,r.color);
        const mc=await page.evaluate(()=>{const s=document.querySelector('#markdown_content li code svg.ic-mission'),c=s.closest('code'),ref=[...document.querySelectorAll('#markdown_content li code')].find(e=>!e.querySelector('svg')&&!e.closest('a')&&e.textContent==='⌘'),r=c.getBoundingClientRect(),q=s.getBoundingClientRect();return {t:c.textContent,h:r.height,hr:ref.getBoundingClientRect().height,lines:c.getClientRects().length,top:q.top-r.top,bot:r.bottom-q.bottom,cen:Math.abs((q.top+q.bottom)/2-(r.top+r.bottom)/2)}});
        assert.equal(mc.t,'⌘');assert.ok(Math.abs(mc.h-mc.hr)<.01,'Mission Control box height '+mc.h+' vs '+mc.hr);assert.equal(mc.lines,1);assert.ok(mc.top>0&&mc.bot>0,'Mission Control inside the box '+mc.top+' '+mc.bot);assert.ok(mc.cen<.25,'Mission Control off the box centre by '+mc.cen);
        const t=await page.evaluate(()=>{const f=[...document.querySelectorAll('#markdown_content li code')].find(e=>e.querySelector('svg.ic-fn')&&e.textContent==='Fn F');f.id='prova-fn';window.__copiati=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__copiati.push(t);return Promise.resolve()}},configurable:true});return f.textContent});
        const c=page.locator('#prova-fn');await c.scrollIntoViewIfNeeded();await c.dblclick();
        await page.waitForFunction(()=>window.__copiati.length>0);assert.deepEqual(await page.evaluate(()=>window.__copiati),['Fn F']);assert.equal(t,'Fn F');
        await page.waitForFunction(()=>!document.getElementById('prova-fn').classList.contains('copiato'));
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
      {
        const p2=await context.newPage();
        await p2.route('https://**/*',route=>route.abort());
        await p2.goto(url,{waitUntil:'load'});
        await p2.waitForTimeout(400);
        const aw=await p2.evaluate(()=>{const a=document.querySelector('p.avviso');const m=a.querySelector('mark');const h=document.querySelector('.markdown-body h2');const c=e=>getComputedStyle(e);const r=a.getBoundingClientRect();return {markBg:c(m).backgroundColor,markFg:c(m).color,pFg:c(a).color,markPad:c(m).padding,weight:c(m.querySelector('strong')).fontWeight,strongFg:c(m.querySelector('strong')).color,border:c(a).borderTopColor,bw:c(a).borderTopWidth,rad:c(a).borderTopLeftRadius,pad:c(a).paddingTop,h2:c(h).color,box:[+r.width.toFixed(2),+r.height.toFixed(2)],marks:document.querySelectorAll('mark').length}});
        await check(`${width}/${theme}: 1.55 marked text has no highlight and reads as the paragraph text`,async()=>{
          assert.equal(aw.markBg,'rgba(0, 0, 0, 0)');assert.equal(aw.markFg,aw.pFg);assert.equal(aw.strongFg,aw.pFg);
          assert.equal(aw.markPad,'0px');assert.equal(aw.weight,'600');assert.equal(aw.marks,1);
        });
        await check(`${width}/${theme}: 1.55 warning border has the h2 colour of the theme, geometry unchanged`,async()=>{
          assert.equal(aw.border,theme==='light'?'rgb(35, 108, 128)':'rgb(206, 178, 133)');
          assert.equal(aw.border,aw.h2);assert.equal(aw.bw,'2px');assert.equal(aw.pad,'16px');assert.equal(aw.rad,'16px');
          (lay['avviso'+width]=lay['avviso'+width]||{})[theme]=aw.box;
          if(lay['avviso'+width].light&&lay['avviso'+width].dark)assert.deepEqual(lay['avviso'+width].light,lay['avviso'+width].dark);
        });
        // Prism builds div.code-toolbar after load and the CDN is blocked here: build the same wrapper by hand.
        await p2.evaluate(()=>{for(const pre of document.querySelectorAll('#markdown_content pre')){const wrap=document.createElement('div');wrap.className='code-toolbar';pre.replaceWith(wrap);wrap.appendChild(pre);const t=document.createElement('div');t.className='toolbar';t.style.cssText='position:absolute;top:.3em;right:.2em';t.innerHTML='<div class="toolbar-item"><button type="button" class="copy-to-clipboard-button"><span>Copia</span></button></div>';wrap.appendChild(t)}});
        await p2.waitForTimeout(500);
        const blocks=()=>p2.evaluate(()=>[...document.querySelectorAll('div.code-toolbar')].map(d=>{const pre=d.querySelector(':scope>pre');const tb=getComputedStyle(d.querySelector('.toolbar'));return {scroll:pre.scrollWidth>pre.clientWidth+1,cls:d.classList.contains('scorre'),btn:tb.display!=='none',tab:pre.getAttribute('tabindex'),sbw:pre.offsetHeight-pre.clientHeight,sbWidth:getComputedStyle(pre).scrollbarWidth,h:pre.offsetHeight}}));
        const b0=await blocks();
        await check(`${width}/${theme}: 1.55 copy button is hidden on blocks that scroll sideways and kept on the others`,async()=>{
          assert.ok(b0.length>30);
          assert.ok(b0.some(b=>b.scroll)&&b0.some(b=>!b.scroll),'need both kinds of block');
          for(const b of b0){assert.equal(b.cls,b.scroll);assert.equal(b.btn,!b.scroll);}
          (lay['scroll'+width]=lay['scroll'+width]||{})[theme]=b0.map(b=>[b.scroll,b.h]);
          if(lay['scroll'+width].light&&lay['scroll'+width].dark)assert.deepEqual(lay['scroll'+width].light,lay['scroll'+width].dark);
        });
        await check(`${width}/${theme}: 1.55 code blocks show no scrollbar and a scrolling block is still keyboard reachable`,async()=>{
          for(const b of b0){assert.equal(b.sbWidth,'none');assert.equal(b.sbw,0);if(b.scroll)assert.equal(b.tab,'0');}
          const moved=await p2.evaluate(()=>{const d=document.querySelector('div.code-toolbar.scorre>pre');d.scrollLeft=60;return d.scrollLeft});
          assert.ok(moved>0,'scrollLeft '+moved);
        });
        await check(`${width}/${theme}: 1.55 double click still copies a block that scrolls and shows the notice`,async()=>{
          const t=await p2.evaluate(()=>{const d=document.querySelector('div.code-toolbar.scorre>pre');d.id='prova-scorre';window.__copiati=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:x=>{window.__copiati.push(x);return Promise.resolve()}},configurable:true});return d.textContent});
          const pre=p2.locator('#prova-scorre code');await pre.scrollIntoViewIfNeeded();await pre.dblclick({position:{x:8,y:4}});
          await p2.waitForFunction(()=>window.__copiati.length>0);
          assert.ok(t.includes((await p2.evaluate(()=>window.__copiati))[0].trim().slice(0,6)));
          await p2.waitForFunction(()=>getComputedStyle(document.querySelector('.avviso-codice')).visibility==='visible'&&document.querySelector('.avviso-codice').textContent==='Codice copiato');
        });
        await check(`${width}/${theme}: 1.55 copy button follows a block built later and a change of width`,async()=>{
          const n=await p2.evaluate(()=>{const src=document.querySelector('div.code-toolbar.scorre>pre');const pre=document.createElement('pre');pre.innerHTML='<code>'+'x'.repeat(600)+'</code>';const wrap=document.createElement('div');wrap.className='code-toolbar';wrap.appendChild(pre);const t=document.createElement('div');t.className='toolbar';t.style.cssText='position:absolute;top:.3em;right:.2em';t.innerHTML='<div class="toolbar-item"><button type="button" class="copy-to-clipboard-button"><span>Copia</span></button></div>';wrap.appendChild(t);src.parentElement.after(wrap);wrap.id='nuovo-blocco';return 1});
          await p2.waitForFunction(()=>document.getElementById('nuovo-blocco').classList.contains('scorre'));
          assert.equal(await p2.evaluate(()=>getComputedStyle(document.querySelector('#nuovo-blocco .toolbar')).display),'none');
          await p2.setViewportSize({width:width===390?1440:390,height:1000});
          await p2.waitForTimeout(500);
          const b1=await blocks();
          for(const b of b1)assert.equal(b.cls,b.scroll);
          assert.ok(b1.filter(b=>b.scroll).length!==b0.filter(b=>b.scroll).length);
        });
        await p2.setViewportSize({width,height:1000});await p2.waitForTimeout(400);
        await check(`${width}/${theme}: 1.64 code colours: dark blocks green grey, dark inline bright green, light blocks on the sage index colour with near black text, light inline peach with black text`,async()=>{
          const c=await p2.evaluate(()=>{const g=e=>getComputedStyle(e);const pre=document.querySelector('div.code-toolbar>pre');const code=pre.querySelector('code');const inl=[...document.querySelectorAll('#markdown_content :not(pre)>code')].find(e=>!e.closest('table,a'));const btn=document.querySelector('div.code-toolbar>.toolbar button');return {pre:[g(pre).backgroundColor,g(pre).color],code:[g(code).backgroundColor,g(code).color],inl:[g(inl).backgroundColor,g(inl).color],btn:g(btn).color}});
          if(theme==='dark'){assert.deepEqual(c.pre,['rgb(56, 69, 65)','rgb(247, 248, 245)']);assert.deepEqual(c.inl,['rgb(108, 188, 136)','rgb(6, 19, 34)']);assert.equal(c.btn,'rgb(247, 248, 245)');}
          else{assert.deepEqual(c.pre,['rgb(234, 241, 232)','rgb(6, 18, 12)']);assert.deepEqual(c.inl,['rgb(255, 225, 184)','rgb(0, 0, 0)']);assert.equal(c.btn,'rgb(6, 18, 12)');}
          assert.equal(c.code[0],'rgba(0, 0, 0, 0)');assert.equal(c.code[1],c.pre[1]);
        });
        if(width>600)await check(`${width}/${theme}: 1.55 DiskUtil commands stay on one line and the cell scrolls, columns unchanged`,async()=>{
          const m=await p2.evaluate(()=>{const t=document.querySelector('table.cmd-scorrevoli');const r=t.getBoundingClientRect();const cont=document.getElementById('markdown_content').getBoundingClientRect().width;const cells=[...t.querySelectorAll('td:first-child>div.cmd')];const first=t.querySelector('tbody tr').children;return {n:cells.length,tw:r.width,cont,left:first[0].getBoundingClientRect().width,right:first[1].getBoundingClientRect().width,ctl:t.scrollWidth>t.clientWidth+1,dbg:[t.scrollWidth,t.clientWidth,innerWidth],lines:cells.map(c=>c.querySelector('code').getClientRects().length),scr:cells.map(c=>c.scrollWidth>c.clientWidth+1),tab:cells.map(c=>c.getAttribute('tabindex')),sb:cells.map(c=>getComputedStyle(c).scrollbarWidth),ws:cells.map(c=>getComputedStyle(c.querySelector('code')).whiteSpace),h:cells.map(c=>c.getBoundingClientRect().height),other:document.querySelectorAll('table.cmd-scorrevoli').length}});
          assert.equal(m.other,1);assert.equal(m.n,9);assert.ok(Math.abs(m.tw-m.cont)<1.5,'table width '+m.tw+' vs '+m.cont);assert.equal(m.ctl,false,JSON.stringify(m.dbg));
          assert.ok(m.lines.every(n=>n===1));assert.ok(m.ws.every(w=>w==='nowrap'));assert.ok(m.sb.every(w=>w==='none'));
          assert.ok(m.scr.some(Boolean),'at least one command is cut off');assert.deepEqual(m.tab,m.scr.map(x=>x?'0':null));
          assert.ok(m.h.every(x=>Math.abs(x-m.h[0])<1),'one-line cells '+m.h);
          if(width===1440){assert.ok(Math.abs(m.left-357)<1&&Math.abs(m.right-401)<1.5,'columns '+m.left+' '+m.right)}
          (lay['disk'+width]=lay['disk'+width]||{})[theme]=[m.left,m.right,m.tw,m.scr];
          if(lay['disk'+width].light&&lay['disk'+width].dark)assert.deepEqual(lay['disk'+width].light,lay['disk'+width].dark);
          const moved=await p2.evaluate(()=>{const c=[...document.querySelectorAll('table.cmd-scorrevoli td>div.cmd')].find(c=>c.scrollWidth>c.clientWidth+1);c.scrollLeft=40;return c.scrollLeft});
          assert.ok(moved>0,'scrollLeft '+moved);
        });
        await p2.close();
      }
      await check(`${width}/${theme}: 1.57 light index, raspberry h1 and its anchors, section dividers, mint blocks with near black text, teal inline code with white text, equal header contrast`,async()=>{
        const r=await page.evaluate(()=>{const g=e=>getComputedStyle(e);const lum=c=>{const v=c.match(/\d+/g).slice(0,3).map(x=>{x=x/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a')&&e.parentElement.tagName==='P');const pre=document.querySelector('#markdown_content pre');const th=document.querySelector('#markdown_content table th');const hs=['SezioneSistema','ScorciatoieApp'].map(i=>{const a=document.getElementById(i);return [g(a.closest('h1')).color,g(a).color]});const h1=[...document.querySelectorAll('#markdown_content h1')].find(h=>!h.querySelector('#SezioneSistema,#ScorciatoieApp'));const h1x=[...document.querySelectorAll('#markdown_content h1')].filter(h=>!h.querySelector('#SezioneSistema,#ScorciatoieApp')&&h.querySelector('a'));return {h1a:h1x.length?g(h1x[0].querySelector('a')).color:g(h1).color,toc:g(document.querySelector('.mweb_toc_wrap_ct')).backgroundColor,h1:g(h1).color,hs,body:g(document.querySelector('.markdown-body')).color,icr:cr(g(ic).color,g(ic).backgroundColor),pcr:cr(g(pre).color,g(pre).backgroundColor),pbc:g(pre).borderTopColor,thc:g(th).color,thb:g(th).backgroundColor,thr:cr(g(th).color,g(th).backgroundColor),tha:(()=>{const a=document.querySelector('#markdown_content th a');return a?g(a).color:null})(),h1cr:cr(g(h1).color,g(document.body).backgroundColor)}});
        assert.ok(r.icr>=4.5&&r.pcr>=4.5,'code text contrast '+r.icr+' '+r.pcr);
        if(theme==='light'){
          assert.equal(r.toc,'rgb(234, 241, 232)');
          {const w=await page.evaluate(()=>{const g=e=>getComputedStyle(e).backgroundColor;const t=document.querySelector('table.narrow-cols-odd');return [g(document.documentElement),g(document.body),g(t.querySelectorAll('tbody tr')[0]),g(t.querySelectorAll('tbody tr')[1]),g(t.querySelector('tbody td'))]});assert.deepEqual(w,['rgb(248, 247, 242)','rgb(248, 247, 242)','rgb(248, 247, 242)','rgb(243, 242, 237)','rgb(253, 252, 247)'],'warm page, rows and narrow cells')}
          assert.equal(r.h1,'rgb(188, 74, 97)');assert.equal(r.h1a,r.h1);assert.ok(r.h1cr>=4.5&&r.h1cr<4.7,'h1 contrast '+r.h1cr);
          for(const h of r.hs){assert.equal(h[0],h[1]);assert.equal(h[0],'rgb(82, 99, 95)');assert.notEqual(h[0],r.body)}
          assert.ok(r.icr>=16.5,'black on inline peach '+r.icr);assert.ok(r.pcr>=16.5,'near black on sage block '+r.pcr);
          assert.equal(r.thc,'rgb(15, 74, 63)');assert.equal(r.thb,'rgb(195, 221, 211)');assert.ok(Math.abs(r.thr-7.05)<.01,'light header '+r.thr);
        }else{
          assert.equal(r.toc,'rgb(27, 46, 40)');
          assert.equal(r.thc,'rgb(231, 245, 240)');assert.equal(r.thb,'rgb(30, 90, 76)');
          assert.ok(r.thr>=7.126&&r.thr<7.2,'dark header '+r.thr);
          if(r.tha)assert.equal(r.tha,'rgb(231, 245, 240)');
        }
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
      await check(`${width}/${theme}: inline code is green in dark and peach in light, dark blocks are green grey with light text, tables have .5rem corners`,async()=>{
        const r=await page.evaluate(()=>{const g=e=>getComputedStyle(e);const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a')&&e.parentElement.tagName==='P');const pre=document.querySelector('#markdown_content pre');const h=document.querySelector('a#SezioneSistema').closest('h1');const t=document.querySelector('#markdown_content table:not(.index-grid)');const h1o=[...document.querySelectorAll('#markdown_content h1')].find(e=>!e.querySelector('#SezioneSistema,#ScorciatoieApp'));const ap=document.querySelector('a#ScorciatoieApp').closest('h1');return {body:g(document.querySelector('#markdown_content p')).color,hfs:g(h).fontSize+'/'+g(ap).fontSize+'/'+g(ap).color,h1fs:g(h1o).fontSize+'/'+g(h1o).fontSize+'/'+g(h).color,ib:g(ic).backgroundColor,ic:g(ic).color,ibw:g(ic).borderTopWidth,pb:g(pre).backgroundColor,pc:g(pre).color,pbw:g(pre).borderTopWidth,h:g(h).color,rad:g(t).borderTopLeftRadius,tables:document.documentElement.dataset.tables}});
        if(theme==='dark'){
          assert.equal(r.ib,'rgb(108, 188, 136)');assert.equal(r.pb,'rgb(56, 69, 65)');
          assert.equal(r.ic,'rgb(6, 19, 34)');assert.equal(r.pc,'rgb(247, 248, 245)');
          assert.equal(r.ibw,'0px');assert.equal(r.pbw,'0px');
          assert.equal(r.h,r.body);assert.equal(r.h,'rgb(222, 229, 225)');assert.equal(r.hfs,r.h1fs);
        }else{
          assert.equal(r.ib,'rgb(255, 225, 184)');assert.equal(r.ic,'rgb(0, 0, 0)');
          assert.equal(r.pb,'rgb(234, 241, 232)');assert.equal(r.pc,'rgb(6, 18, 12)');
          assert.equal(r.ibw,'0px');assert.equal(r.pbw,'0px');
        }
        if(r.tables!=='cards')assert.equal(r.rad,'8px');
      });
      if(width===390)await check(`${width}/${theme}: MD 0.9 on a phone the index table fits, tables show no scrollbar and the Tasti funzione cell is centred`,async()=>{
        const r=await page.evaluate(()=>{const t=document.querySelector('#markdown_content table.index-grid');const td=[...document.querySelectorAll('td.cell-extra-line')].find(e=>e.textContent.includes('tasti Mac'));const b=td.getBoundingClientRect();const cs=[...td.querySelectorAll('code')].map(c=>c.getBoundingClientRect());return {fit:t.scrollWidth<=t.clientWidth,right:t.getBoundingClientRect().right<=innerWidth,bars:[...document.querySelectorAll('#markdown_content table')].every(e=>getComputedStyle(e).scrollbarWidth==='none'),off:Math.abs((Math.min(...cs.map(c=>c.top))-b.top)-(b.bottom-Math.max(...cs.map(c=>c.bottom))))}});
        assert.ok(r.fit&&r.right,'index table fits');assert.ok(r.bars,'no table scrollbar');assert.ok(r.off<2.5,'Tasti funzione cell off centre by '+r.off);
      });
      await check(`${width}/${theme}: code boxes have the same shape in both themes (the Prism toolbar is rebuilt by hand because the CDN is blocked)`,async()=>{
        const r=await page.evaluate(()=>{const g=e=>getComputedStyle(e);const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a,table')&&e.parentElement.tagName==='P');const pre=[...document.querySelectorAll('#markdown_content pre')].find(e=>e.textContent.includes('NOMEAPP</string>'));let wrap=pre.parentElement;if(!wrap.classList.contains('code-toolbar')){wrap=document.createElement('div');wrap.className='code-toolbar';pre.replaceWith(wrap);wrap.appendChild(pre);const t0=document.createElement('div');t0.className='toolbar';t0.innerHTML='<div class="toolbar-item"><button type="button" class="copy-to-clipboard-button"><span>Copy</span></button></div>';wrap.appendChild(t0);}const tb=wrap.querySelector('.toolbar');const btn=wrap.querySelector('button.copy-to-clipboard-button');const bb=g(btn);const rem=parseFloat(g(document.documentElement).fontSize);return {icb:[g(ic).borderTopWidth,g(ic).borderRadius,g(ic).fontFamily===g(ic.parentElement).fontFamily,g(ic).fontWeight],ibc:g(ic).borderTopColor,pb:[g(pre).borderTopWidth,g(pre).borderRadius,g(pre).fontFamily===g(wrap).fontFamily],pbc:g(pre).borderTopColor,wrapFit:g(wrap).width===Math.round(wrap.getBoundingClientRect().width*100)/100+'px'||Math.abs(wrap.getBoundingClientRect().width-pre.getBoundingClientRect().width)<1,narrower:wrap.getBoundingClientRect().width<=wrap.parentElement.getBoundingClientRect().width+.5,pr:parseFloat(g(pre).paddingRight)/rem,top:parseFloat(g(tb).top)/rem,right:parseFloat(g(tb).right)/rem,btn:{bg:bb.backgroundColor,shadow:bb.boxShadow,radius:bb.borderTopLeftRadius,color:bb.color,bw:bb.borderTopWidth},code:g(pre.querySelector('code')).fontFamily===g(pre).fontFamily&&!/mono/i.test(g(pre).fontFamily)}});
        assert.deepEqual(r.icb,['0px','8px',true,'500']);
        assert.deepEqual(r.pb,['0px','16px',true]);
        assert.equal(r.code,true);
        assert.equal(r.wrapFit,true);assert.equal(r.narrower,true);
        assert.ok(Math.abs(r.pr-2.6)<.01,'pre right padding '+r.pr);
        assert.ok(Math.abs(r.top-.6)<.01&&Math.abs(r.right-.7)<.01,'toolbar '+r.top+' '+r.right);
        assert.equal(r.btn.bg,'rgba(0, 0, 0, 0)');assert.equal(r.btn.shadow,'none');assert.equal(r.btn.radius,'0px');assert.equal(r.btn.bw,'0px');
        if(theme==='light'){
          assert.equal(r.btn.color,'rgb(6, 18, 12)');
          assert.notEqual(r.ibc,'rgb(67, 181, 158)','no dead #43B59E border on inline code');assert.notEqual(r.pbc,'rgb(67, 181, 158)','no dead #43B59E border on blocks');
        }else assert.equal(r.btn.color,'rgb(247, 248, 245)');
      });
      await check(`${width}/${theme}: both formats expose one version`,async()=>assert.equal(await page.locator('[data-style-picker]:visible').count(),1));
      await trigger.click();
      await page.getByRole('option').first().waitFor();
      await check(`${width}/${theme}: the real catalogue has one style, Roccobot MD 0.9`,async()=>assert.deepEqual(await page.getByRole('option').allTextContents(),['Roccobot MD0.9']));
      await page.getByRole('button',{name:'Chiudi il selettore'}).click();
      await stubCatalogue(page);
      await page.reload({waitUntil:'domcontentloaded'});
      await trigger.waitFor({state:'visible'});
      const before=await page.locator('h1').first().evaluate(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,padding:getComputedStyle(e).paddingBottom}));
      await trigger.click();
      const list=page.getByRole('listbox');
      await page.getByRole('option').last().waitFor();
      await check(`${width}/${theme}: three styles in the stubbed catalogue`,async()=>assert.equal(await page.getByRole('option').count(),3));
      await check(`${width}/${theme}: SlimVer names without Paper`,async()=>{
        const labels=await page.getByRole('option').allTextContents();
        assert.deepEqual(labels,['Prova A1.00','Prova B1.42','Roccobot MD0.9']);
        assert.equal(await page.getByRole('link',{name:'Aggiungi uno stile'}).count(),0);
      });
      await page.getByRole('option').first().click();
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/Prova_A.css'));
      await check(`${width}/${theme}: a style can be previewed`,async()=>{
        assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(1, 2, 3)');
        assert.equal(await page.locator('h1').first().evaluate(e=>getComputedStyle(e).borderBottomWidth),'1px');
      });
      await check(`${width}/${theme}: typography and layout preserved`,async()=>assert.deepEqual(await page.locator('h1').first().evaluate(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,padding:getComputedStyle(e).paddingBottom})),before));
      await list.press('Escape');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotMD.css'));
      await check(`${width}/${theme}: Escape restores initial style and focus`,async()=>{
        assert.equal(await page.getByRole('dialog').isVisible(),false);
        assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);
      });
      await trigger.click();
      await list.press('ArrowUp');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/Prova_B.css'));
      await list.press('Enter');
      await check(`${width}/${theme}: keyboard selection commits on Enter`,async()=>assert.equal(await page.getByRole('dialog').isVisible(),false));
      await trigger.click();
      await list.press('End'); await list.press('Home'); await list.press('End');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotMD.css'));
      await check(`${width}/${theme}: rapid selection leaves one active sheet`,async()=>assert.equal(await page.locator('link[data-site-style]').count(),1));
      await page.getByRole('button',{name:'Chiudi il selettore'}).click();
      await trigger.click();
      await list.press('Home');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/Prova_A.css'));
      await list.press('Enter');
      await page.reload({waitUntil:'domcontentloaded'});
      await check(`${width}/${theme}: reload discards the temporary choice`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'styles/RoccobotMD.css'));
      await check(`${width}/${theme}: no JavaScript errors`,async()=>assert.deepEqual(errors,[]));
      await page.goto(url+'styles/admin/manage.html',{waitUntil:'domcontentloaded'});
      await check(`${width}/${theme}: management remains closed without configuration`,async()=>{
        await page.getByText('Il caricamento con GitHub deve ancora essere attivato.').waitFor();
        assert.equal(await page.locator('#upload').isVisible(),false);
      });
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:1200,height:900}});
    const page=await context.newPage();
    await page.route('https://**/*',route=>route.abort());
    await stubCatalogue(page);
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#tocVersion').click();
    await page.getByRole('option').last().waitFor();
    await page.route('**/styles/Prova_A.css',route=>route.abort());
    await page.getByRole('option').first().click();
    await page.getByText('Lo stile non si carica. La pagina conserva quello precedente.').waitFor();
    await check('failed stylesheet leaves the default Roccobot MD active',async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'styles/RoccobotMD.css'));
    await context.close();
    {
      const context=await browser.newContext({viewport:{width:1200,height:900}});
      const page=await context.newPage();
      await page.route('https://**/*',route=>route.abort());
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await check('a note back link returns to the reference that was clicked',async()=>{
        const info=await page.evaluate(()=>({one:document.getElementById('Nota13').parentElement.querySelectorAll('a.nota-ritorno').length,label:document.getElementById('Nota13').parentElement.querySelector('a.nota-ritorno').getAttribute('aria-label'),none:document.getElementById('NotaFTop').parentElement.querySelectorAll('a.nota-ritorno').length,ids:[...document.querySelectorAll('sup a[href="#Nota13"]')].every(a=>a.id)}));
        assert.deepEqual(info,{one:1,label:'Torna al richiamo',none:0,ids:true});
        const ref=page.locator('sup a[href="#Nota13"]').nth(2);const id=await ref.getAttribute('id');
        await ref.scrollIntoViewIfNeeded();await ref.click();await page.waitForFunction(()=>location.hash==='#Nota13');
        const h=await page.evaluate(()=>history.length);
        await page.locator('#Nota13').locator('xpath=..').locator('a.nota-ritorno').click();
        const r=await page.evaluate(id=>{const a=document.getElementById(id),row=a.closest('li'),b=row.getBoundingClientRect();return {focus:document.activeElement===a,seen:b.top>=0&&b.bottom<=innerHeight,flash:row.classList.contains('richiamo-lampo'),hash:location.hash,h:history.length}},id);
        assert.deepEqual(r,{focus:true,seen:true,flash:true,hash:'#Nota13',h});
      });
      await context.close();
    }
    if (process.env.VERIFICATION_REPORT) await fs.writeFile(process.env.VERIFICATION_REPORT, JSON.stringify({ passed: results.length, checks: results }, null, 2));
    console.log(JSON.stringify({passed:results.length,checks:results},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
