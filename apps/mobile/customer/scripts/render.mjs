import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'
const root=process.env.C_APP_BASE_URL||'http://127.0.0.1:4173'
const out='../evidence/浏览器截图'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const checks=[]
try {
 for(const [width,height] of [[320,568],[375,812],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(root,{waitUntil:'domcontentloaded',timeout:45000})
  await page.locator('.channel').first().waitFor({timeout:30000})
  await page.waitForTimeout(1800)
  const state=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.car')]
   const viewport=document.documentElement.clientWidth
   return {cards:cards.length,scrollWidth:document.documentElement.scrollWidth,viewport,
    source:document.querySelector('.channel.active')?.textContent,
    banner:!!document.querySelector('.hero'),
    demo:document.querySelector('.demo')?.textContent,
    imageRatios:[...document.querySelectorAll('.car-picture')].slice(0,5).map(el=>{const r=el.getBoundingClientRect();return r.height? r.width/r.height:0}),
    channelHeights:[...document.querySelectorAll('.channel')].map(el=>el.getBoundingClientRect().height)}
  })
  if(state.source!=='批发车源')throw Error('默认来源错误 '+JSON.stringify(state))
  if(state.cards<1)throw Error('无真实 DOM 车辆卡片 '+JSON.stringify(state))
  if(state.scrollWidth>width+2)throw Error('存在水平溢出 '+JSON.stringify(state))
  if(state.imageRatios.some(r=>Math.abs(r-4/3)>0.055))throw Error('车辆4:3图片布局失真 '+JSON.stringify(state.imageRatios))
  if(state.channelHeights.some(h=>h<44))throw Error('频道点击区高度不足 '+JSON.stringify(state.channelHeights))
  if(errors.length)throw Error('页面JS错误 '+errors.join('; '))
  await page.screenshot({path:out+'/'+width+'x'+height+'_首屏.png'})
  await page.screenshot({path:out+'/'+width+'x'+height+'_首页.png',fullPage:true})
  checks.push({width,height,...state,jsErrors:errors})
  if(width===390){
   await page.locator('.channel').nth(1).click()
   if(!(await page.locator('.channel').nth(1).evaluate(n=>n.classList.contains('active'))))throw Error('名邦频道未切换')
   await page.locator('.filter-trigger').click()
   await page.locator('.sheet').waitFor()
   await page.screenshot({path:out+'/390x844_筛选弹层.png'})
   await page.getByText('关闭 ✕').click()
   await page.locator('.sort-trigger').click()
   await page.locator('.sort-choice').waitFor()
   if(await page.locator('.sort-choice').count()!==7)throw Error('排序不是七种')
   await page.locator('.sort-choice').nth(1).click()
   await page.locator('.car').first().click()
   await page.locator('.detail').waitFor()
   await page.screenshot({path:out+'/390x844_安全只读详情.png',fullPage:true})
   if(await page.locator('.detail-name').count()!==1)throw Error('详情未正常渲染')
   await page.locator('.detail-header').getByText('返回车源').click()
   await page.locator('.channel').first().waitFor()
   if(!(await page.locator('.channel').nth(1).evaluate(n=>n.classList.contains('active'))))throw Error('详情返回未保留来源')
  }
  await page.close()
 }
 writeFileSync(out+'/实际浏览器证据.json',JSON.stringify({source:'GitHub Actions Chromium 真渲染',url:root,checks},null,2))
 console.log('Chromium 四屏宽/切换/筛选/排序/详情/返回：PASS')
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
