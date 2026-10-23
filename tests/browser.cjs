const { webkit } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const url = 'http://127.0.0.1:18770/';
const results = [];
async function check(name, action) { await action(); results.push(name); }
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
      await check(`${width}/${theme}: 1.55 is the default`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS155.css'));
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
          assert.equal(aw.border,theme==='light'?'rgb(35, 108, 128)':'rgb(232, 184, 106)');
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
        await check(`${width}/${theme}: 1.55 code colours: dark blocks olive with light text, inline code unchanged, light blocks unchanged`,async()=>{
          const c=await p2.evaluate(()=>{const g=e=>getComputedStyle(e);const pre=document.querySelector('div.code-toolbar>pre');const code=pre.querySelector('code');const inl=[...document.querySelectorAll('#markdown_content :not(pre)>code')].find(e=>!e.closest('table,a'));const btn=document.querySelector('div.code-toolbar>.toolbar button');return {pre:[g(pre).backgroundColor,g(pre).color],code:[g(code).backgroundColor,g(code).color],inl:[g(inl).backgroundColor,g(inl).color],btn:g(btn).color}});
          if(theme==='dark'){assert.deepEqual(c.pre,['rgb(61, 70, 57)','rgb(247, 248, 245)']);assert.deepEqual(c.inl,['rgb(146, 162, 121)','rgb(10, 26, 18)']);assert.equal(c.btn,'rgb(247, 248, 245)');}
          else{assert.deepEqual(c.pre,['rgb(0, 114, 123)','rgb(255, 255, 255)']);assert.deepEqual(c.inl,['rgb(0, 114, 123)','rgb(255, 255, 255)']);assert.equal(c.btn,'rgb(255, 255, 255)');}
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
      await check(`${width}/${theme}: 1.55 light index, orange h1, section dividers, teal code with white text, equal header contrast`,async()=>{
        const r=await page.evaluate(()=>{const g=e=>getComputedStyle(e);const lum=c=>{const v=c.match(/\d+/g).slice(0,3).map(x=>{x=x/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a')&&e.parentElement.tagName==='P');const pre=document.querySelector('#markdown_content pre');const th=document.querySelector('#markdown_content table th');const hs=['SezioneSistema','ScorciatoieApp'].map(i=>{const a=document.getElementById(i);return [g(a.closest('h1')).color,g(a).color]});const h1=[...document.querySelectorAll('#markdown_content h1')].find(h=>!h.querySelector('#SezioneSistema,#ScorciatoieApp'));return {toc:g(document.querySelector('.mweb_toc_wrap_ct')).backgroundColor,h1:g(h1).color,hs,body:g(document.querySelector('.markdown-body')).color,icr:cr(g(ic).color,g(ic).backgroundColor),pcr:cr(g(pre).color,g(pre).backgroundColor),pbc:g(pre).borderTopColor,thc:g(th).color,thb:g(th).backgroundColor,thr:cr(g(th).color,g(th).backgroundColor),tha:(()=>{const a=document.querySelector('#markdown_content th a');return a?g(a).color:null})(),h1cr:cr(g(h1).color,g(document.body).backgroundColor)}});
        assert.ok(r.icr>=4.5&&r.pcr>=4.5,'code text contrast '+r.icr+' '+r.pcr);
        if(theme==='light'){
          assert.equal(r.toc,'rgb(230, 244, 239)');
          assert.equal(r.h1,'rgb(157, 90, 24)');assert.ok(r.h1cr>=4.5&&r.h1cr<5.1,'h1 contrast '+r.h1cr);
          for(const h of r.hs){assert.equal(h[0],h[1]);assert.equal(h[0],'rgb(82, 99, 95)');assert.notEqual(h[0],r.body)}
          assert.ok(r.icr>=5.6&&r.pcr>=5.6,'white on teal '+r.icr+' '+r.pcr);
          assert.equal(r.thc,'rgb(15, 74, 63)');assert.equal(r.thb,'rgb(197, 222, 211)');assert.ok(Math.abs(r.thr-7.13)<.01,'light header '+r.thr);
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
      await check(`${width}/${theme}: inline code is sage in dark and aqua in light, dark blocks are olive with light text, tables have 1rem corners`,async()=>{
        const r=await page.evaluate(()=>{const g=e=>getComputedStyle(e);const ic=[...document.querySelectorAll('#markdown_content code')].find(e=>!e.closest('pre,a')&&e.parentElement.tagName==='P');const pre=document.querySelector('#markdown_content pre');const h=document.querySelector('a#SezioneSistema').closest('h1');const t=document.querySelector('#markdown_content table:not(.index-grid)');const h1o=[...document.querySelectorAll('#markdown_content h1')].find(e=>!e.querySelector('#SezioneSistema,#ScorciatoieApp'));const ap=document.querySelector('a#ScorciatoieApp').closest('h1');return {body:g(document.querySelector('#markdown_content p')).color,hfs:g(h).fontSize+'/'+g(ap).fontSize+'/'+g(ap).color,h1fs:g(h1o).fontSize+'/'+g(h1o).fontSize+'/'+g(h).color,ib:g(ic).backgroundColor,ic:g(ic).color,ibw:g(ic).borderTopWidth,pb:g(pre).backgroundColor,pc:g(pre).color,pbw:g(pre).borderTopWidth,h:g(h).color,rad:g(t).borderTopLeftRadius,tables:document.documentElement.dataset.tables}});
        if(theme==='dark'){
          assert.equal(r.ib,'rgb(146, 162, 121)');assert.equal(r.pb,'rgb(61, 70, 57)');
          assert.equal(r.ic,'rgb(10, 26, 18)');assert.equal(r.pc,'rgb(247, 248, 245)');
          assert.equal(r.ibw,'0px');assert.equal(r.pbw,'0px');
          assert.equal(r.h,r.body);assert.equal(r.h,'rgb(222, 229, 225)');assert.equal(r.hfs,r.h1fs);
        }else{
          assert.equal(r.ib,'rgb(0, 114, 123)');assert.equal(r.ic,'rgb(255, 255, 255)');
          assert.equal(r.pb,'rgb(0, 114, 123)');assert.equal(r.pc,'rgb(255, 255, 255)');
          assert.equal(r.ibw,'0px');assert.equal(r.pbw,'0px');
        }
        if(r.tables!=='cards')assert.equal(r.rad,'16px');
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
          assert.equal(r.btn.color,'rgb(255, 255, 255)');
          assert.equal(r.ibc,'rgb(67, 181, 158)');assert.equal(r.pbc,'rgb(67, 181, 158)');
        }else assert.equal(r.btn.color,'rgb(247, 248, 245)');
      });
      await check(`${width}/${theme}: both formats expose one version`,async()=>assert.equal(await page.locator('[data-style-picker]:visible').count(),1));
      const before=await page.locator('h1').first().evaluate(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,padding:getComputedStyle(e).paddingBottom}));
      await trigger.click();
      const list=page.getByRole('listbox');
      await page.getByRole('option').last().waitFor();
      await check(`${width}/${theme}: three registered styles`,async()=>assert.equal(await page.getByRole('option').count(),3));
      await check(`${width}/${theme}: SlimVer names without Paper`,async()=>{
        const labels=await page.getByRole('option').allTextContents();
        assert.deepEqual(labels,['RoccobotOS1.00','RoccobotOS1.42','RoccobotOS1.55']);
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
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS155.css'));
      await check(`${width}/${theme}: Escape restores initial style and focus`,async()=>{
        assert.equal(await page.getByRole('dialog').isVisible(),false);
        assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);
      });
      await trigger.click();
      await list.press('ArrowUp');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS142.css'));
      await list.press('Enter');
      await check(`${width}/${theme}: keyboard selection commits on Enter`,async()=>assert.equal(await page.getByRole('dialog').isVisible(),false));
      await trigger.click();
      await list.press('End'); await list.press('Home'); await list.press('End');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS155.css'));
      await check(`${width}/${theme}: rapid selection leaves one active sheet`,async()=>assert.equal(await page.locator('link[data-site-style]').count(),1));
      await page.getByRole('button',{name:'Chiudi il selettore'}).click();
      await trigger.click();
      await list.press('Home');
      await page.waitForFunction(()=>document.querySelector('link[data-site-style]').href.endsWith('/RoccobotOS100.css'));
      await list.press('Enter');
      await page.reload({waitUntil:'domcontentloaded'});
      await check(`${width}/${theme}: reload discards the temporary choice`,async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS155.css'));
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
    await check('failed stylesheet leaves default 1.55 active',async()=>assert.equal(await page.locator('link[data-site-style]').getAttribute('href'),'Styles/RoccobotOS155.css'));
    await context.close();
    if (process.env.VERIFICATION_REPORT) await fs.writeFile(process.env.VERIFICATION_REPORT, JSON.stringify({ passed: results.length, checks: results }, null, 2));
    console.log(JSON.stringify({passed:results.length,checks:results},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
