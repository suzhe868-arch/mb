// R3最终验证：此脚本由专属GitHub Actions在当前HEAD实际运行，截图仅作为安全Mock/UI证明。
import {chromium} from 'playwright'
import {mkdirSync,writeFileSync} from 'node:fs'

const root=process.env.C_APP_BASE_URL||'http://127.0.0.1:4173'
const out='../evidence/浏览器截图'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const checks=[]
const viewports=[[320,568],[375,812],[390,844],[430,932]]
const assert=(ok,message)=>{if(!ok)throw Error(message)}
async function state(page){
 return page.evaluate(()=>{
  const rect=e=>e?.getBoundingClientRect()
  const images=[...document.querySelectorAll('.car-picture')].slice(0,5)
  return {
   scrollWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
   cards:document.querySelectorAll('.car').length,
   firstCarTop:Math.round(rect(document.querySelector('.car'))?.top||-1),
   source:document.querySelector('.channel.active')?.textContent||'',
   bannedDemo:!!document.querySelector('.demo,.hero,.tier'),
   visibleQa:!!document.querySelector('.qa-panel'),
   imageRatios:images.map(x=>{const r=rect(x);return Number((r.width/r.height).toFixed(3))}),
   buttonHeight:Math.round(rect(document.querySelector('.filter-trigger'))?.height||0),
   hasHomeShare:!!document.querySelector('.home .share-demo,.home .head-share')
  }
 })
}
function routeUrl(from,params){
 const u=new URL(from)
 const h=u.hash
 if(h.startsWith('#/')){u.hash='#/pages/detail/index?'+new URLSearchParams(params).toString()}
 else {u.pathname='/pages/detail/index';u.search=new URLSearchParams(params).toString()}
 return u.toString()
}
async function screenshot(page,name){await page.screenshot({path:out+'/'+name+'.png'})}
try{
 for(const [width,height] of viewports){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(root,{waitUntil:'domcontentloaded',timeout:45000})
  await page.locator('.car').first().waitFor({timeout:18000})
  await page.waitForTimeout(700)
  const s=await state(page)
  assert(s.source==='批发车源','默认来源不正确')
  assert(s.cards>=1,'首页未展示任何车辆')
  assert(s.scrollWidth<=width+2,'首页横向溢出 '+JSON.stringify(s))
  assert(s.imageRatios.every(r=>Math.abs(r-4/3)<.055),'卡片车辆比例错误')
  assert(!s.bannedDemo&&!s.visibleQa&&!s.hasHomeShare,'客户首屏存在开发信息或旧分享')
  assert(s.buttonHeight>=44,'筛选按钮触控高度不足')
  if(width===390)assert(s.firstCarTop<420,'390首屏车辆被上部信息遮蔽')
  await screenshot(page,width+'x'+height+'_首页首屏')
  await page.locator('.car').nth(Math.min(5,s.cards-1)).scrollIntoViewIfNeeded()
  await screenshot(page,width+'x'+height+'_首页列表滚动')
  await page.locator('.car').first().click()
  await page.locator('.detail-name').waitFor({timeout:14000})
  await page.waitForTimeout(400)
  const detail=await page.evaluate(()=>({
   width:document.documentElement.scrollWidth,
   columns:document.querySelectorAll('.info-item').length,
   favorite:!!document.querySelector('.bottom-favorite'),
   consultation:document.querySelector('.bottom-consult')?.textContent,
   lock:document.querySelector('.bottom-lock')?.textContent,
   share:!!document.querySelector('.share-inline'),
   placeholder:!!document.querySelector('.detail-placeholder'),
   mockText:!!document.querySelector('.detail-header .demo')
  }))
  assert(detail.width<=width+2,'详情横向溢出')
  assert(detail.columns>=6,'详情资料区域缺失')
  assert(detail.favorite&&detail.consultation==='咨询'&&detail.lock==='锁车'&&detail.share,'详情独立CTA或微信官方分享入口缺失')
  assert(!detail.mockText,'详情出现显著Mock条')
  await screenshot(page,width+'x'+height+'_详情首屏及固定底栏')
  await page.locator('.advisor-box').scrollIntoViewIfNeeded()
  await screenshot(page,width+'x'+height+'_详情下滚顾问')
  const r=await page.locator('.detail-bottom').boundingBox()
  assert(r&&r.y+r.height<=height+2,'底部操作栏遮挡或越界')
  await page.locator('.bottom-consult').click()
  const toast=await page.getByText('咨询服务暂不可用，未提交任何申请').count()
  assert(toast>0,'咨询产生了虚假成功或缺少拒绝反馈')
  await page.locator('.detail-header .back').click()
  await page.locator('.car').first().waitFor({timeout:12000})
  assert((await page.locator('.channel.active').textContent())==='批发车源','详情返回丢失来源频道')
  checks.push({width,height,...s,detail,jsErrors:errors})
  assert(errors.length===0,'页面JS异常 '+errors.join('; '))
  if(width===390){
   const sampleUrl=page.url()
   for(const lock of ['pending','other_locked','waitlisted','mine_locked','transaction','sold','offline']){
    await page.goto(routeUrl(sampleUrl,{id:'MOCK-001',qa:'1',state:lock}),{waitUntil:'domcontentloaded'})
    await page.locator('.bottom-lock').waitFor({timeout:10000})
    await screenshot(page,'390x844_锁车状态_'+lock)
   }
   await page.goto(routeUrl(sampleUrl,{id:'MOCK-001',share:'1'}),{waitUntil:'domcontentloaded'})
   await page.locator('.bottom-more').waitFor({timeout:10000})
   assert(await page.locator('.bottom-more').count()===1
    &&await page.locator('.bottom-favorite').count()===1
    &&await page.locator('.bottom-consult').count()===1
    &&await page.locator('.bottom-lock').count()===1,'分享直达缺四操作：更多车源+收藏+咨询+锁车')
   await screenshot(page,'390x844_分享直达四操作')
   await page.goto(routeUrl(sampleUrl,{id:'MOCK-REVOKED',share:'1'}),{waitUntil:'domcontentloaded'})
   await page.locator('.denied-title').waitFor({timeout:10000})
   await screenshot(page,'390x844_旧分享撤权')
  }
  await page.close()
  // 长车型名称必须在所有代表宽度内自动换行，不能顶破卡片边界。
  const longPage=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
  await longPage.goto(root,{waitUntil:'domcontentloaded'})
  await longPage.locator('.channel').nth(2).click()
  const longName=longPage.locator('.car-name').filter({hasText:'超长文案演示'})
  await longName.first().waitFor({timeout:12000})
  await longName.first().scrollIntoViewIfNeeded()
  const over=await longPage.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
  assert(over<=2,'长车型内容导致横向溢出 '+width)
  await screenshot(longPage,width+'x'+height+'_长车型换行')
  await longPage.close()
 }
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.goto(root,{waitUntil:'domcontentloaded'})
 await page.locator('.filter-trigger').click()
 await page.locator('.sheet').waitFor()
 for(const text of ['品牌','车系','年款（不是首次上牌年份）','具体款型','首次上牌年份','表显里程（万公里）','能源类型','排量','车身颜色','变速箱']){
  assert(await page.getByText(text,{exact:true}).count()>0,'筛选缺字段 '+text)
 }
 await screenshot(page,'390x844_完整筛选弹层')
 await page.locator('.sheet').getByText('奥迪',{exact:true}).click()
 await page.locator('.sheet').getByText('A6',{exact:true}).click()
 await page.locator('.sheet').getByText('2026',{exact:true}).click()
 await page.locator('.sheet').getByText('45 TFSI 豪华动感型',{exact:true}).click()
 await page.getByText('查看符合条件的车辆').click()
 assert(await page.locator('.used .chip.picked').count()>=4,'四层筛选没有回显')
 await screenshot(page,'390x844_四级车型筛选结果')
 await page.locator('.used').getByText(/品牌.*×/).click()
 assert(await page.locator('.used .chip.picked').count()===0,'清除品牌未级联清理车系年款款型')
 await page.locator('.sort-trigger').click()
 assert(await page.locator('.sort-choice').count()===7,'排序选项不是七项')
 await screenshot(page,'390x844_排序弹层')
 await page.locator('.sort-choice').nth(1).click()
 await page.locator('.channel').nth(1).click()
 assert((await page.locator('.channel.active').textContent())==='名邦车源','来源切换失败')
 await screenshot(page,'390x844_名邦来源切换')
 await page.close()
 // QA状态不进入普通客户界面；通过独立路由参数复现，不模拟真实授权。
 for(const scenario of ['loading','empty','error','no_banner','no_image','revoked']){
  const qaPage=await browser.newPage({viewport:{width:390,height:844}})
  const u=new URL(root)
  u.hash='#/pages/index/index?qa=1&scenario='+scenario
  await qaPage.goto(u.toString(),{waitUntil:'domcontentloaded'})
  await qaPage.locator('.qa-panel').waitFor({timeout:10000})
  if(scenario==='loading')assert(await qaPage.getByText('车源加载中…').count()>0,'加载态缺失')
  if(scenario==='error'){
   assert(await qaPage.getByText('车源暂时无法加载').count()>0,'错误态缺失')
   await screenshot(qaPage,'390x844_错误态')
   await qaPage.getByText('重试',{exact:true}).click()
   await qaPage.locator('.car').first().waitFor()
   assert(await qaPage.locator('.car').count()>0,'错误重试不恢复')
  }
  if(scenario==='empty')assert(await qaPage.getByText('暂无符合条件的车辆').count()>0,'空态缺失')
  if(scenario==='no_image')assert(await qaPage.locator('.vehicle-placeholder').count()>0,'无图回退缺失')
  if(scenario==='no_banner')assert(await qaPage.locator('.hero').count()===0,'无Banner仍占位')
  if(scenario==='revoked'){
   await qaPage.locator('.car').first().click()
   await qaPage.locator('.denied-title').waitFor()
  }
  await screenshot(qaPage,'390x844_QA状态_'+scenario)
  await qaPage.close()
 }
 writeFileSync(out+'/实际浏览器证据.json',JSON.stringify({source:'GitHub Actions Chromium H5',root,checks,interactions:['四级车型联动与级联清除','七项排序','三来源切换','详情咨询拒绝','七种Lock视觉状态','撤权旧分享']},null,2))
 console.log('Chromium四机宽首页/详情+专项交互：PASS')
}catch(err){console.error(err);process.exitCode=1}
finally{await browser.close()}
