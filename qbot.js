exports.handleMessage = handleMessage
exports.sendMessage = sendMessage
exports.page = null

// eslint-disable-next-line
const fontArr = ["font",{"name":"宋体","size":10,"style":[0,0,0],"color":"000000"}]

async function handleMessage (msgArr) {
  console.log('handleMessage', { msgArr })
}

// contentArr
// 包含face 参照项目qqface
async function sendMessage (to, content) {
  const contentArr = Array.isArray(content)
    ? content
    : [content]
  await exports.page.evaluate(obj => {
    window.qSendMsg(obj)
  }, {
    to,
    content: JSON.stringify([...contentArr, fontArr])
  })
}
