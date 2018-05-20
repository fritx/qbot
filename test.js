const puppeteer = require('puppeteer')
const path = require('path')
const fetch = require('node-fetch')
const qbot = require('./qbot')

;(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  qbot.page = page

  await page.setRequestInterception(true)

  page.on('request', async request => {
    if (request.resourceType() === 'script') {
      const url = request.url()
      if (/\/mq\.js/.test(url)) {
        console.log('改写 mq.js')
        const res = await fetch(url)
        const originalJs = await res.text()

        let patchedJs = originalJs
        let matchStr
        let patch

        // matchStr = 'var html = tmpl({'
        // patch = `window.qbot_handleMessage(msgArr);`
        // patchedJs = patchedJs.replace(matchStr, `\n\n${patch}\n\n${matchStr}`)

        matchStr = 'this.sendMsg = function(param){'
        patch = 'window.qSendMsg ='
        patchedJs = patchedJs.replace(matchStr, `\n\n${patch}\n\n${matchStr}`)

        matchStr = 'onLoginSuccess:function(data){'
        patch = `console.log('onLoginSuccess', { data })`
        patchedJs = patchedJs.replace(matchStr, `${matchStr}\n\n${patch}\n\n`)

        matchStr = 'var member_m = mq.model.buddylist'
        patch = '\n\nwindow.qBuddyList\n\n'
        let matchArr = matchStr.split('=')
        matchArr.splice(1, 0, patch)
        patchedJs = patchedJs.replace(matchStr, matchArr.join('='))

        // Poll拉取成功回调
        // onPollSuccess:function(result){
        matchStr = 'result.sort(sortMessage);'
        patch = 'window.qbot_handleMessage(result)'
        patchedJs = patchedJs.replace(matchStr, `result = ${matchStr}\n\n${patch}\n\n`)

        request.respond({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          body: patchedJs
        })
        return
      }
    }
    request.continue()
  })

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.170 Safari/537.36')
  await page.goto('https://web2.qq.com/', { waitUntil: 'networkidle0' })

  await Promise.all(
    Object.keys(qbot).map(async key => {
      await page.exposeFunction(`qbot_${key}`, qbot[key])
    })
  )

  const loginFrameName = 'ptlogin'

  await page.waitFor(`iframe[name="${loginFrameName}"]`)

  const frames = await page.frames()
  const loginFrame = frames.find(f => f.name() === loginFrameName)

  await loginFrame.waitFor('#qrlogin_img[src]')

  const qrImgHandle = await loginFrame.$('#qrlogin_img')

  const qrImgPath = path.join(__dirname, 'qrimg.png')

  await qrImgHandle.screenshot({
    path: qrImgPath
  })
  // todo: 展示qrImgPath

  // await browser.close()
})()
