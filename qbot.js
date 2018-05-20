exports.handleMessage = handleMessage
exports.sendMessage = sendMessage
exports.page = null

// fixme 过滤自己
exports.selfUin = null

// eslint-disable-next-line
const fontArr = ["font",{"name":"宋体","size":10,"style":[0,0,0],"color":"000000"}]

async function handleMessage (resultArr) {
  await Promise.all(resultArr.map(async item => {
    const msg = { poll_type: item.poll_type, ...item.value }

    // fixme 过滤自己

    msg.content = msg.content.slice(1)

    if (!msg.content.length) return

    console.log('收到消息', msg)

    if (msg.poll_type === 'message') {
      const to = msg.from_uin
      const content = msg.content
      console.log('自动回复', { to, content })
      await sendMessage(to, content)
    }
    // todo: group_message
  }))
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
