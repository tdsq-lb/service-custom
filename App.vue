<script>
import { initSocketControl, sendSocketMessage } from '@/utils/socketControl.js'
import { CS4003 } from '@/utils/newsType.js'
import { globalSendMessage } from '@/utils/index.js'
import { mapState } from 'vuex'
import * as webUni from './static/uni.webview.js'
export default {
  computed: {
    ...mapState({
      closeUserObj: 'closeUserObj'
    })
  },
  onLaunch: function () {
    console.log('App Launch:::发送消息给App')
    globalSendMessage({ type: 'CUSTOMER_SERVICE' })
    // 待触发 `UniAppJSBridgeReady` 事件后，即可调用 uni 的 API。
    //h5的页面 mounted生命周期中
    document.addEventListener(
      'UniAppJSBridgeReady',
      function () {
        console.log('进入::: ===>>> UniAppJSBridgeReady')
        uni.webView.getEnv(function (res) {
          console.log('当前环境：' + JSON.stringify(res))
        })
        uni.webView.postMessage({
          data: {
            action: 'message',
            type: 'CUSTOMER_SERVICE'
          }
        })
      },
      false
    )
  },

  mounted() {},
  onShow: function () {
    console.log('App Show:::接收APP消息 并 初始化 socket')
    // const userObj = {
    //   Authorization: '',
    //   userId: '',
    //   visitorId: 'visitor_' + '123456789',
    //   language: 'zh',
    //   isCustomerService: 0,
    //   logo: 'other/aaa_20240902162455A001.png'
    // }
    // this.$store.dispatch('asyncRegisterUser', userObj)
    // initSocketControl()
    window['CUSTOMER_SERVICE_MESSAGES'] = data => {
      const appMessagesData = JSON.parse(data)
      console.log('这里是 app 传递给我的消息', appMessagesData)
      if (appMessagesData.Authorization != '') {
        appMessagesData.Authorization = `Bearer ${appMessagesData.Authorization.replace(/"/g, '')}`
      }
      if (appMessagesData.isCustomerService == '') {
        appMessagesData.isCustomerService = 0
      } else {
        appMessagesData.isCustomerService = Number(appMessagesData.isCustomerService)
      }
      this.$store.dispatch('asyncRegisterUser', appMessagesData)
      initSocketControl()
    }
  },
  onHide: function () {
    console.log('App Hide')
  },
  onUnload() {
    // console.log('页面被关闭或销毁')
    // // 这里去 断开链接
    // CS4003.d = {
    //   ...this.closeUserObj
    // }
    // sendSocketMessage(CS4003)
  }
}
</script>

<style>
/*每个页面公共css */
</style>
