import { createStore } from 'vuex'
const store = createStore({
  state: {
    userInfo: null,
    isRegister: false, // 是否注册完成,通过这个参数 判断 是否可以 发送消息
    chatUserList: [], // 聊天的用户列表
    chatHistoryList: [], // 聊天记录
    closeUserObj: null, // 客服id;用于 页面关闭主动 关闭与客服的聊天;保存客服头像
    pagingObj: {
      pageNum: 1, // 记录分页信息
      refresherEnabled: true // 是否可开启下拉
    },
    triggered: false, // 设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发
    newsObj: null // 发送的消息
  },
  mutations: {
    SET_USERINFO(state, payload) {
      state.userInfo = payload
    },
    SET_IS_REGISTER(state, payload) {
      // console.log('state, payload', state, payload)
      state.isRegister = payload
    },
    SET_CHAT_USER_LIST(state, payload) {
      // const arr = state.chatUserList.concat(...payload)
      // const uniqueMessages = arr.reduce((acc, curr) => {
      //   // 检查是否已有该 msgid
      //   const existing = acc.find(item => item.msgid === curr.msgid)
      //   if (!existing) {
      //     // 如果没有相同 msgid 的记录，直接添加
      //     acc.push(curr)
      //   } else {
      //     // 如果已有相同 msgid 的记录，比较 sendTime 保留最新的
      //     if (new Date(curr.sendTime) > new Date(existing.sendTime)) {
      //       // 替换为 sendtime 更新的记录
      //       const index = acc.indexOf(existing)
      //       acc[index] = curr
      //     }
      //   }
      //   return acc
      // }, [])
      // state.chatUserList = uniqueMessages
      const newArr = payload
      newArr.sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime))
      state.chatUserList = newArr
    },
    SET_CHAT_HISTORY_LIST(state, payload) {
      // console.log('state, payload', state, payload)
      const arr = state.chatHistoryList
      if (payload.type == 'push') {
        arr.push(payload.message)
      }
      if (payload.type == 'unshift') {
        arr.unshift(...payload.message)
      }
      // 去重
      const newArr = arr.reduce((acc, curr) => {
        if (!acc.some(item => item.msgId === curr.msgId)) {
          acc.push(curr)
        }
        return acc
      }, [])

      // 使用 sort() 方法对日期进行升序排序
      newArr.sort((a, b) => new Date(a.sendTime) - new Date(b.sendTime))
      state.chatHistoryList = newArr

      if (payload.type == 'clear') {
        state.chatHistoryList = []
      }
    },
    SET_CLOSE_USER_OBJ(state, payload) {
      state.closeUserObj = payload
    },
    SET_PAGING_OBG(state, payload) {
      state.pagingObj = payload
    },
    SET_TRIGGERD(state, payload) {
      state.triggered = payload
    },
    SET_NEWS_OBJ(state, payload) {
      state.newsObj = payload
    }
  },
  actions: {
    asyncRegisterUser({ commit }, payload) {
      commit('SET_USERINFO', payload)
    }
  }
})
export default store
