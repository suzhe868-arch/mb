"""H01/C01 visual ONLY. Reproduce Chromium screenshots and DOM layout checks.
No product UI/backend/API implementation; no write to main.
Requirements: Python playwright + Chromium + Pillow. Run inside C01 evidence folder.
The HTML references local assets and opens normally offline; for the controlled
Playwright headless environment which blocks file://, replace only img src
with equivalent original JPEG data URLs before page.set_content().
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from base64 import b64encode
from PIL import Image
import hashlib, json
D=Path(__file__).resolve().parent
html=(D/'C01_商业级视觉评审_离线预览.html').read_text(encoding='utf8')
for i in (1,2):
    path=D/'assets'/f'car_sample_{i}.jpg'
    html=html.replace(f'assets/car_sample_{i}.jpg', 'data:image/jpeg;base64,'+b64encode(path.read_bytes()).decode())
assert html.count('data:image/jpeg;base64,')==12
out=D/'rendered';out.mkdir(exist_ok=True)
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1700,'height':1120},device_scale_factor=1)
    page.set_content(html,wait_until='load',timeout=60000)
    page.wait_for_timeout(150)
    for w,mode in ((390,'full'),(390,'compact'),(320,'full'),(320,'compact')):
        el=page.locator(f'#phone-{w}-{mode}')
        data=el.evaluate('''p=>{const q=s=>Array.from(p.querySelectorAll(s)),b=x=>{const a=x.getBoundingClientRect();return{w:+a.width.toFixed(1),h:+a.height.toFixed(1),left:+a.left.toFixed(1),right:+a.right.toFixed(1)}};return {clientWidth:p.clientWidth,scrollWidth:p.scrollWidth, photos:q('.vehicle-photo img').map(x=>({loaded:x.complete&&x.naturalWidth>0,naturalWidth:x.naturalWidth,naturalHeight:x.naturalHeight,display:b(x),objectFit:getComputedStyle(x).objectFit,urlPrefix:x.currentSrc.slice(0,15)})), priceDisplays:q('.vehicle-price').map(x=>getComputedStyle(x).display),cards:q('.vehicle').map(x=>b(x)),title:q('.vehicle-title').map(x=>({box:b(x),fontSize:getComputedStyle(x).fontSize,lineHeight:getComputedStyle(x).lineHeight,clamp:getComputedStyle(x).webkitLineClamp})),filters:q('.filter').map(x=>({text:x.innerText.trim(),box:b(x)})),channels:q('.channel').map(x=>x.innerText),tabs:q('.nav-item').map(x=>x.innerText),banner:q('[data-banner="HOME_TOP"]').length,search:b(q('.search')[0]),nav:b(q('.nav')[0]),top:b(q('.topbar')[0]),height:p.clientHeight,text:p.innerText}}''')
        data.pop('text')
        data.update({'width':w,'mode':mode})
        data['pass']=bool(data['clientWidth']==w and data['scrollWidth']==w and len(data['photos'])==3 and all(x['loaded'] and x['naturalWidth']==1536 for x in data['photos']) and len(data['filters'])==6 and len(data['channels'])==3 and len(data['tabs'])==3 and (data['banner']==1)==(mode=='full') and all(x['box']['w']>=90 for x in data['filters']) and all(x['right'] <= data['cards'][0]['right']+.5 for x in data['cards']))
        path=out/f'C01_{w}_{mode}.png'
        el.screenshot(path=str(path))
        data['screenshot']=path.name
        data['screenshot_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
        data['screenshot_dimensions']=list(Image.open(path).size)
        results.append(data)
    # negative case: regular/LIMITED JYT feed hides precise numeric prices
    regular=page.locator('#phone-390-full')
    regular.evaluate("p=>p.setAttribute('data-entitlement','LIMITED')")
    regular_result=regular.evaluate("p=>[...p.querySelectorAll('.vehicle-price')].every(x=>getComputedStyle(x).display==='none')")
    regular.screenshot(path=str(out/'C01_390_full_LIMITED.png'))
    regular.evaluate("p=>p.setAttribute('data-entitlement','VIP')")
    page.screenshot(path=str(out/'C01_四态画廊.png'),full_page=True)
    browser.close()
report={
 'tool':'Chromium headless via Playwright; viewport 1700x1120 gallery; phone screenshots are exact 320/390 CSS px',
 'note':'Page content is source HTML with local JPEG URLs replaced by identical JPEG data URIs because file:// navigation is blocked by the tool sandbox. This does not change DOM structure/CSS.',
 'cases':results,'passes':sum(bool(x['pass']) for x in results),'case_count':len(results),
 'PDM10_LIMITED_no_price':bool(regular_result),
 'image_sources':[{'name':p.name,'width':Image.open(p).width,'height':Image.open(p).height,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted((D/'assets').glob('car_sample_?.jpg'))],
 'limitations':['A approval pending','not tested on physical 320/390 phones, Android/iOS, WeChat mini-program runtime','not connected to real Vehicle APIs','this is a static H01 design, not H02 or H03'],
}
(D/'C01_布局检查.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'cases':[{'width':x['width'],'mode':x['mode'],'pass':x['pass'],'imageWidths':[p['naturalWidth'] for p in x['photos']],'cardPx':x['cards'][0]['w'],'filterMinPx':min(v['box']['w'] for v in x['filters'])} for x in results],'LIMITED_no_price':regular_result,'totalPassed':report['passes']},ensure_ascii=False))
assert report['passes']==4 and regular_result