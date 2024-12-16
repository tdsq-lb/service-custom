let socketOpen = false
import store from '@/store/index.js'
import response from './response'
import { CS1001 } from '@/utils/newsType.js'
import { generateRandomString } from '@/utils/index.js'

function initSocketControl() {
  uni.connectSocket({
    url: window.WS_BASEURL,
    success(res) {
      console.log('链接成功=======>>>>', res)
    },
    fail(err) {
      console.log('链接失败=======>>>>', err)
    }
  })
  // 监听 WebSocket 连接打开事件;开启发送消息
  uni.onSocketOpen(function (res) {
    console.log('onSocketOpen', res)
    socketOpen = true
    receiveMessage()
    console.log('WebSocket连接已打开！')
    handleSendCS1001()
  })
  uni.onSocketError(function (res) {
    console.log('WebSocket连接打开失败，请检查！', res)
  })
}

function handleSendCS1001() {
  console.log('handleSendCS1001', store.state)
  if (store.state && store.state.userInfo) {
    CS1001.d = store.state.userInfo
    sendSocketMessage(CS1001)
  }
}

function receiveMessage() {
  // 监听WebSocket接受到服务器的消息事件。
  uni.onSocketMessage(function (res) {
    // console.log('收到服务器内容：' + JSON.stringify(res));
    response(res)
  })
  // 监听WebSocket错误。
  uni.onSocketError(function (res) {
    console.log('WebSocket连接打开失败，请检查！', res)
  })
}

// 发送消息
function sendSocketMessage(reqType) {
  if (socketOpen) {
    uni.sendSocketMessage({
      data: JSON.stringify(reqType),
      complete(res) {
        console.log(JSON.stringify(reqType), '发送完成=======>>>>', res)
      },
      fail(err) {
        console.log('发送失败=======>>>>', err)
        store.commit('SET_IS_REGISTER', false)
        store.commit('SET_PAGING_OBG', { pageNum: store.state.pagingObj.pageNum, refresherEnabled: false })
        uni.hideLoading() // 隐藏 loading
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        })
      }
    })
  }
}

export { initSocketControl, sendSocketMessage, handleSendCS1001 }
