import store from '@/store/index.js'
import { generateRandomString, parseTime } from '@/utils/index.js'
import { CS4001 } from '@/utils/newsType.js'
import { sendSocketMessage } from '@/utils/socketControl.js'

function handleChatUserList(obj) {
  // 如果为客服 需要把 聊天的每一条记录 放到 SET_CHAT_USER_LIST chatUserList聊天记录列表
  const newChat = store.state.chatUserList.map(item => {
    if (obj.chatType == 1) {
      if (obj.sendUser == item.sendUser) {
        return { ...obj, ...item, message: obj.message, time: parseTime(obj.sendTime, '{y}-{m}-{d} {h}:{i}'), sendTime: obj.sendTime }
      }
    } else {
      if (obj.receiveUser == item.receiveUser) {
        return { obj, ...item, message: obj.message, time: parseTime(obj.sendTime, '{y}-{m}-{d} {h}:{i}'), sendTime: obj.sendTime }
      }
    }
    return item
  })
  // console.log('newChatnewChatnewChatnewChatnewChat', newChat)
  store.commit('SET_CHAT_USER_LIST', newChat)
}

// 处理响应 参数
function response(resData) {
  const { data } = resData
  if (data && data == 'ping') {
    console.log('心跳=======>>>>', data)
  } else {
    const parseData = JSON.parse(data)
    const { t, a, d } = parseData
    console.log('响应动作=======>>>>', JSON.parse(data))
    switch (a) {
      case 1002:
        console.log('注册成功响应：1002')
        // isCustomerService :::  1:为客服;2:为普通用户,普通用户需要先注册 4001
        if (store.state.userInfo.isCustomerService == 0) {
          CS4001.d = {
            requestId: generateRandomString(),
            msgType: '1'
          }
          sendSocketMessage(CS4001)
        } else {
          if (d && d.chatUserList && d.chatUserList.length > 0) {
            const result = d.chatUserList.map(item => {
              item.time = parseTime(item.sendTime, '{y}-{m}-{d} {h}:{i}')
              return item
            })
            store.commit('SET_CHAT_USER_LIST', result)
          }
          if (d && d.token) {
            // 如果下发了新 token 则更新token
            store.dispatch('asyncRegisterUser', { ...store.state.userInfo, Authorization: d.token })
          }
        }
        store.commit('SET_IS_REGISTER', true)
        store.commit('SET_TRIGGERD', false)
        break
      case 1003:
        console.log('注册鉴权失败响应：1003')
        store.commit('SET_IS_REGISTER', false)
        break
      case 1004:
        console.log('其他异常响应：1004')
        store.commit('SET_IS_REGISTER', false)
        break
      case 4004:
        console.log('发起客服聊天响应动作=4004')
        if (d.message === '') return
        // 判断客服是否在线
        if (d && d.sendUser && d.receiveUser) {
          const newD = {
            ...d,
            type: 0,
            msgId: generateRandomString(),
            logo: d.sendAvatar
          }

          if (store.state.userInfo.isCustomerService == 1) {
            // 如果为客服 需要把 聊天的每一条记录 放到 SET_CHAT_USER_LIST chatUserList聊天记录列表
            handleChatUserList(newD)
          }
          store.commit('SET_CHAT_HISTORY_LIST', { type: 'push', message: newD })
          store.commit('SET_CLOSE_USER_OBJ', {
            csUserId: newD.sendUser,
            custUserId: newD.receiveUser,
            logo: d.sendAvatar
          })
        } else {
          store.commit('SET_IS_REGISTER', false)
          store.commit('SET_PAGING_OBG', { pageNum: store.state.pagingObj.pageNum, refresherEnabled: true })
          // uni.showLoading({
          //   title: d.message
          // })
          uni.showToast({
            title: d.message,
            icon: 'none',
            duration: 5000
          })
        }
        break
      case 4006:
        console.log('响应客服离线聊天=4006', d)
        store.commit('SET_TRIGGERD', false)
        const { content } = d
        if (content && content.length > 0) {
          store.commit('SET_PAGING_OBG', { pageNum: (store.state.pagingObj.pageNum += 1), refresherEnabled: true })
          const newNewsData = content.map(item => {
            // chatType 聊天类型:0=正常聊天,1=客户发送给客服,2客服回复客户
            if (item.chatType == 1) {
              // item.type = 1
              item.type = store.state.userInfo.isCustomerService == 0 ? 1 : 0
              item.logo = item.sendAvatar
              item.requestId = item.msgId
            }
            if (item.chatType == 2) {
              // item.type = 0
              item.type = store.state.userInfo.isCustomerService == 0 ? 0 : 1
              item.logo = item.sendAvatar
              item.requestId = item.msgId
            }
            return item
          })
          console.log('4006,newNewsData', JSON.stringify(newNewsData))

          store.commit('SET_CHAT_HISTORY_LIST', { type: 'unshift', message: newNewsData.reverse() })
        } else {
          store.commit('SET_PAGING_OBG', { pageNum: store.state.pagingObj.pageNum, refresherEnabled: false })
        }
        break
      case 4007:
        console.log('响应发送完成的消息=4007', d)
        let newsObj = store.state.newsObj
        if (d && newsObj) {
          if (d.requestId == newsObj.requestId) {
            newsObj = { ...newsObj, ...d, msgId: d.msgId }
            // newsObj.msgId = d.msgId
            // 清空 newsObj
            // 添加到chatHistoryList
            store.commit('SET_NEWS_OBJ', null)
            store.commit('SET_IS_REGISTER', true)
            store.commit('SET_CHAT_HISTORY_LIST', { type: 'push', message: newsObj })
            uni.hideLoading()
            if (store.state.userInfo.isCustomerService == 1) {
              // 如果为客服 需要把 聊天的每一条记录 放到 SET_CHAT_USER_LIST chatUserList聊天记录列表
              handleChatUserList(newsObj)
            }
          }
        }
        break
      default:
        console.log('default')
    }
  }
}

export default response
