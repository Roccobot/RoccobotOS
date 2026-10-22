const { webkit }=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const root='cloud/styles/public/';
const sample='/*\n#NAME: Prova\n#VERSION: 1.0\n#NOTE: Una prova.\n#COMMENT: A test palette.\n*/\nbody { color: #303735; }';
(async()=>{
 const browser=await webkit.launch({...(process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE } : {}),headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const writes=[]; let signedIn=true;
  await page.route('https://styles.test/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   if(path==='/config.json') return route.fulfill({json:{apiBase:'https://styles.test'}});
   if(path==='/auth/session')return route.fulfill({status:signedIn?200:401,json:signedIn?{user:{login:'Roccobot'},csrf:'proof'}:{error:'Accesso richiesto.'}});
   if(path==='/styles'){
    writes.push(req.postDataJSON());
    assert.equal(req.headers()['x-csrf-token'],'proof');
    return route.fulfill({status:201,json:{style:{name:'Prova'},commit:'test'}});
   }
   if(path==='/auth/logout'){signedIn=false;return route.fulfill({json:{ok:true}});}
   const types={html:'text/html',mjs:'text/javascript',css:'text/css'};
   return route.fulfill({body:await fs.readFile(root+path.slice(1)),contentType:types[path.split('.').pop()]});
  });
  await page.goto('https://styles.test/manage.html');
  await page.getByText('Accesso come Roccobot').waitFor();
  assert.equal(await page.locator('#upload').isVisible(),true);
  await page.locator('#files').setInputFiles({name:'Prova.css',mimeType:'text/css',buffer:Buffer.from(sample)});
  await page.getByRole('button',{name:'Aggiungi alla raccolta'}).click();
  await page.getByText('Aggiunto alla raccolta.',{exact:true}).waitFor();
  assert.deepEqual(writes,[{filename:'Prova.css',content:sample}]);
  await page.locator('#files').setInputFiles({name:'Bad.css',mimeType:'text/css',buffer:Buffer.from(sample+'body{background:url(https://evil.test/x)}')});
  await page.getByText(/Bad.css: Lo stile deve essere autonomo/).waitFor();
  assert.equal(writes.length,1);
  await page.getByRole('button',{name:'Esci',exact:true}).click();
  await page.getByRole('link',{name:'Accedi con GitHub'}).waitFor();
  assert.equal(await page.locator('#upload').isVisible(),false);
  console.log('Gestione: sessione, upload reale del modulo, rifiuto risorse esterne e uscita verificati. API simulate, nessun accesso GitHub reale.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
