const puppeteer = require('puppeteer')
const opn = require('opn')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.170 Safari/537.36')
  await page.goto('https://web2.qq.com/')

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

  await opn(qrImgPath)

  // await browser.close()
})()
