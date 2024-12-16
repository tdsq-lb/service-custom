import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import { sendSocketMessage } from '@/utils/socketControl.js'
const store = new Vuex.Store({
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
    triggered: false // 设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发
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
      state.chatUserList = payload
    },
    SET_CHAT_HISTORY_LIST(state, payload) {
      // console.log('state, payload', state, payload)
      if (payload.type == 'push') {
        state.chatHistoryList.push(payload.message)
      }
      if (payload.type == 'unshift') {
        state.chatHistoryList.unshift(...payload.message)
      }
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
    }
  },
  actions: {
    asyncRegisterUser({ commit }, payload) {
      commit('SET_USERINFO', payload)
    }
  }
})
export default store
