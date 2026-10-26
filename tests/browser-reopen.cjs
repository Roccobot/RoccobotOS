const {webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch({...(process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE } : {}),headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.route('https://**/*',r=>r.abort());
 let release;const gate=new Promise(r=>release=r);
 let requests=0;
 await page.route('**/styles/index.json',async r=>{requests++;await gate;await r.continue()});
 await page.goto('http://127.0.0.1:18770/',{waitUntil:'domcontentloaded'});
 await page.locator('#tocVersion').click();
 await page.getByRole('button',{name:'Chiudi il selettore'}).click();
 await page.locator('#tocVersion').click();
 release();
 await page.getByRole('option').first().waitFor();
 await page.waitForLoadState('networkidle');
 assert.equal(requests,1,'a reopened selector shares its existing catalogue request');
 assert.equal(await page.getByRole('option').count(),3);
 console.log('Riapertura durante il caricamento: una richiesta e tre stili, senza duplicati.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
