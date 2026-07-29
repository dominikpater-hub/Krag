/* Krąg — E2E kont w przeglądarce. Startuje serwer kont (pg-mem) + statyczny serwer index.html,
 * i sprawdza pełen obieg: rejestracja → wypchnięcie danych → drugie urządzenie loguje się i widzi te dane.
 * Uruchom: node accounts/scripts/e2e-accounts.mjs */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright-core');

const HERE = dirname(fileURLToPath(import.meta.url));
function dirname(p){ return p.slice(0, p.lastIndexOf('/')); }
const REPO = join(HERE, '..', '..');            // /tmp/Krag_probe
const ACC = join(REPO, 'accounts');
const API_PORT = 8091, WEB_PORT = 8093;
const API = `http://localhost:${API_PORT}`, WEB = `http://localhost:${WEB_PORT}`;
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json' };
const log = (...a) => console.log('•', ...a);
let apiProc, web;

function startWeb(){ web = http.createServer(async (req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html'; try{ const b=await readFile(join(REPO,p)); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(b);}catch{res.writeHead(404);res.end('x');} }); return new Promise(r=>web.listen(WEB_PORT,r)); }
function startApi(){ apiProc = spawn(join(ACC,'node_modules','.bin','tsx'),['src/dev-memory.ts'],{cwd:ACC,env:{...process.env,PORT:String(API_PORT)},stdio:'ignore',detached:true}); return waitHealth(); }
function killApi(){ try{ if(apiProc?.pid) process.kill(-apiProc.pid);}catch{} }
async function waitHealth(){ for(let i=0;i<40;i++){ try{ const r=await fetch(`${API}/health`); if(r.ok)return; }catch{} await new Promise(r=>setTimeout(r,250)); } throw new Error('serwer kont nie wstał'); }

async function newApp(browser){ const ctx=await browser.newContext(); const pg=await ctx.newPage(); await pg.addInitScript((a)=>{window.KRAG_ACCOUNTS_API=a;},API); pg.on('pageerror',e=>console.log('  [pageerror]',e.message)); await pg.goto(WEB); await pg.waitForSelector('#onbov.on'); return pg; }
// Onboarding otwiera się sam na starcie. Ustawiamy pseudonim (intro), przechodzimy do formularza konta.
async function openAccountForm(pg, pseudo){
  if(pseudo){ await pg.fill('#onbPseudoIn', pseudo); }
  await pg.click('#onbAcct');
  await pg.waitForSelector('#onbEmail');
}

let pass=0, fail=0;
const ok=(c,l)=>{ (c?pass++:fail++); console.log((c?'  ✓ ':'  ✗ FAIL ')+l); };

async function main(){
  await startWeb(); log('static index.html na', WEB);
  await startApi(); log('serwer kont (pg-mem) na', API);
  const br = await chromium.launch({ executablePath: CHROME, headless: true });

  // — Urządzenie A: rejestracja + wypchnięcie danych —
  const A = await newApp(br);
  await openAccountForm(A, 'Cichy Świt');
  await A.fill('#onbEmail','domo@krag.pl'); await A.fill('#onbPass','haslo1234');
  await A.click('#onbRegister');
  await A.waitForFunction(()=>!document.querySelector('#onbov').classList.contains('on') && !!localStorage.getItem('krag.token'), { timeout: 10000 });
  ok(true, 'A: rejestracja e-mailem → sesja zapisana');
  await A.evaluate(()=>window.KRAG.pushDoc({ note: 'wpis z urządzenia A' }));
  log('A: wypchnięto dokument (pseudonim + note)');

  // — Urządzenie B: logowanie tym samym kontem → widzi dane A —
  const B = await newApp(br);
  await openAccountForm(B, '');
  await B.fill('#onbEmail','domo@krag.pl'); await B.fill('#onbPass','haslo1234');
  await B.click('#onbLogin');
  await B.waitForFunction(()=>!document.querySelector('#onbov').classList.contains('on') && !!localStorage.getItem('krag.token'), { timeout: 10000 });
  const aDoc = await A.evaluate(()=>window.KRAG.pullDoc());
  console.log('   A po wypchnięciu, serwer ma:', JSON.stringify(aDoc));
  const doc = await B.evaluate(()=>window.KRAG.pullDoc());
  console.log('   B pobrał:', JSON.stringify(doc));
  ok(doc && doc.note === 'wpis z urządzenia A', 'B: logowanie → pobrał dane A: note="'+(doc&&doc.note)+'"');
  ok(doc && doc.pseudonym === 'Cichy Świt', 'B: pseudonim zsynchronizowany: "'+(doc&&doc.pseudonym)+'"');

  // — Złe hasło —
  const C = await newApp(br);
  await openAccountForm(C, '');
  await C.fill('#onbEmail','domo@krag.pl'); await C.fill('#onbPass','zle-haslo-9');
  await C.click('#onbLogin');
  await C.waitForFunction(()=>{ const e=document.querySelector('#onbErr'); return e && /Nie udało|Zły/.test(e.textContent); }, { timeout: 8000 }).catch(()=>{});
  const cTok = await C.evaluate(()=>localStorage.getItem('krag.token'));
  ok(!cTok, 'C: złe hasło → brak sesji, błąd pokazany');

  // — Anonimowo (bez serwera potrzebnego) —
  const D = await newApp(br);
  await D.waitForSelector('#onbAnon');
  await D.click('#onbAnon');
  await D.waitForFunction(()=>!document.querySelector('#onbov').classList.contains('on'), { timeout: 8000 });
  const dMode = await D.evaluate(()=>localStorage.getItem('krag.mode'));
  const dTok = await D.evaluate(()=>localStorage.getItem('krag.token'));
  ok(dMode === 'anon' && !dTok, 'D: wejście bez konta działa (mode=anon, brak tokenu)');

  await br.close();
  console.log('\n=== '+pass+' PASS · '+fail+' FAIL ===');
}
main().then(()=>{ killApi(); web?.close(); process.exit(fail?1:0); })
  .catch(e=>{ console.error('✖ TEST FAILED:', e.message); killApi(); web?.close(); process.exit(1); });
