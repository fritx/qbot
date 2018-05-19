const puppeteer = require('puppeteer')
const path = require('path')
const fetch = require('node-fetch')
const qbot = require('./qbot')

const keyHandleMessage = 'qbotHandleMessage'

;(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  await page.setRequestInterception(true)

  page.on('request', async request => {
    if (request.resourceType() === 'script') {
      const url = request.url()
      if (/\/mq\.js/.test(url)) {
        console.log('改写 mq.js')
        const res = await fetch(url)
        const originalJs = await res.text()

        let patchedJs = originalJs

        let matchStr = 'var html = tmpl({'
        let patch = `window.${keyHandleMessage}(msgArr);`
        patchedJs = patchedJs.replace(matchStr, `\n\n${patch}\n\n${matchStr}`)

        matchStr = 'this.sendMsg = function(param){'
        patch = 'window.qbotSendMessage ='
        patchedJs = patchedJs.replace(matchStr, `\n\n${patch}\n\n${matchStr}`)

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
  await page.exposeFunction(keyHandleMessage, qbot.handleMessage)

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
