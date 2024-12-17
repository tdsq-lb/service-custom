import App from './App'
import store from '@/store/index.js' // 引入vuex

window.WS_BASEURL = 'ws://192.168.3.201:18001/director' // 长链接地址:::夏泉
window.API_BASEURL = 'http://192.168.3.201:8900/api' // 接口地址:::夏泉

// window.WS_BASEURL = 'ws://39.105.130.26:8022/director' // 长链接地址:::测试服
// window.API_BASEURL = 'http://39.105.130.26:8900/api' // 接口地址:::测试服
window.IMAGE_BASEURL = 'http://39.105.130.26:8050/' // 图片地址:::测试服

// window.WS_BASEURL = 'ws://43.198.225.157:8022/director' // 长链接地址:::正试服
// window.API_BASEURL = 'http://43.198.225.157:8900/api' // 接口地址:::正试服
// window.IMAGE_BASEURL = 'http://43.198.225.157:9000/' // 图片地址:::正试服

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App,
  store
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  return {
    app
  }
}
// #endif
