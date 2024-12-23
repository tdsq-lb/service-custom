<template>
  <view class="container">
    <view class="go_back" v-if="userInfo && userInfo.isCustomerService == 1">
      <image src="@/static/back.png" mode="aspectFill" class="back" @click="goBack"></image>
      <view class="title">{{ title }}</view>
      <view class="back"></view>
    </view>
    <scroll-view
      scroll-y
      ref="scrollView"
      :refresher-enabled="pagingObj.refresherEnabled"
      :refresher-triggered="triggered"
      refresher-background="#f3f3f3"
      @refresherrefresh="onRefresh"
      @tap="handleInputBlur"
      scroll-with-animation
      :scroll-into-view="item"
      :scroll-top="scrollTop"
      :style="{
        height: scrollViewHeight + 'px',
        paddingTop: userInfo && userInfo.isCustomerService == 1 ? '40px' : '0'
      }"
    >
      <view class="box-1" id="list-box">
        <view class="talk-list">
          <view v-for="(item, index) in chatHistoryList" :key="index" :id="`msg-${item.requestId}`">
            <view class="item flex_col" :class="item.type == 1 ? 'push' : 'pull'">
              <image :src="getHttpImagedUrl(item.logo)" mode="aspectFill" class="pic"></image>
              <view class="content">
                <text v-if="item.msgType == 1">{{ item.message }}</text>
                <image
                  v-if="item.msgType == 3"
                  class="image_box"
                  :src="getHttpImagedUrl(item.message)"
                  mode="aspectFill"
                  @click="previewImage(item.message)"
                ></image>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    <!-- <transition name="fade"> -->
    <view
      ref="fixedView"
      class="box-2"
      v-if="isRegister || (userInfo && userInfo.isCustomerService == 0 && closeUserObj && closeUserObj.csUserId && closeUserObj.custUserId)"
    >
      <view class="flex_col">
        <view class="flex_grow">
          <input
            type="text"
            class="content"
            v-model="content"
            placeholder="请输入"
            placeholder-style="color:#DDD;"
            :cursor-spacing="6"
            @focus="handleInputFocus()"
            @blur="handleInputBlur()"
            @confirm="send()"
          />
        </view>
        <image class="btn_icon" src="@/static/emote.png" @click="handleBtnEmote()"></image>
        <image v-show="!isFocus && !isEmote" class="btn_icon" src="@/static/add.png" @click="handleBtnAdd()"> </image>
        <button v-show="isFocus || isEmote" class="send" @tap="send">发送</button>
      </view>
      <view class="emote_box" v-show="!isFocus && !isAdd && isEmote">
        <view class="emote_box_item" v-for="emoteItem in emoteArr" :key="emoteItem" @click="handleEmote(emoteItem)">{{ emoteItem }}</view>
      </view>
      <view class="more_box" v-show="!isFocus && !isEmote && isAdd">
        <image @click.stop="chooseImage" src="@/static/img.png"></image>
      </view>
    </view>
    <!-- </transition> -->
  </view>
</template>

<script>
import { sendSocketMessage } from '@/utils/socketControl.js'
import { CS4002, CS4005, CS4008 } from '@/utils/newsType.js'
import { generateRandomString } from '@/utils/index.js'
import { emote } from '@/utils/index.js'
import { mapState } from 'vuex'
import { watch } from 'vue'
export default {
  data() {
    return {
      title: null,
      custUserId: null,
      scrollViewHeight: 0, // 存储动态计算的 scroll-view 高度
      scrollTop: 0,
      emoteArr: emote,
      content: '',
      isFocus: false, // 输入框聚焦
      isEmote: false, // 是否开启表情
      isAdd: false, // 是否开启 图片 拍照
      uploading: false, // 上传状态
      uploadSuccess: false, // 上传成功
      uploadError: false, // 上传失败
      item: ''
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.userInfo,
      isRegister: state => state.isRegister,
      chatHistoryList: state => state.chatHistoryList,
      closeUserObj: state => state.closeUserObj,
      pagingObj: state => state.pagingObj,
      triggered: state => state.triggered
    }),
    getScrollViewHeight: function () {
      return this.scrollViewHeight
    }
  },
  watch: {
    chatHistoryList(newVal) {
      console.log('chatHistoryList::newVal', newVal)
      this.$nextTick(() => {
        this.item = 'item-' + (newVal.length - 1)
        console.log(this.item, '2222222item')
      })
    },
    deep: true,
    immediate: true
  },
  onLoad(options) {
    console.log(options.custUserId, 'options') // 输出: 123
    if (this.userInfo && this.userInfo.isCustomerService == 1 && options.custUserId) {
      this.getHistoryMsg(options.custUserId)
      this.title = options.sendName
      this.custUserId = options.custUserId
    }
  },

  mounted() {
    console.log('mounted::this.userInfo', this.userInfo)
    if (this.userInfo && this.userInfo.isCustomerService == 1 && this.custUserId) {
      // 客服 进入聊天和退出聊天 发 4008消息
      CS4008.d.userId = this.custUserId
      sendSocketMessage(CS4008)
    }
    this.$nextTick(() => {
      this.updateHeight()
    })
  },
  onUnload() {
    if (this.userInfo && this.userInfo.isCustomerService == 1 && this.custUserId) {
      // 客服 进入聊天和退出聊天 发 4008消息
      CS4008.d.userId = this.custUserId
      sendSocketMessage(CS4008)
    }
    if (this.userInfo && this.userInfo.isCustomerService == 0) {
      CS4008.d.userId = (this.closeUserObj && this.closeUserObj.csUserId) || 0
      sendSocketMessage(CS4008)
    }
  },
  updated() {
    // 当 DOM 更新时，重新计算高度
    // console.log('updated')
    // this.updateHeight()
  },
  methods: {
    goBack() {
      uni.navigateBack()
      // 返回时 初始化 vuex
      this.$store.commit('SET_CHAT_HISTORY_LIST', { type: 'clear' })
      this.$store.commit('SET_PAGING_OBG', { pageNum: 1, refresherEnabled: true })
    },
    // 获取 ref 元素的高度
    updateHeight() {
      const screenHeight = uni.getSystemInfoSync().screenHeight
      let tabBarHeight = 0

      this.$nextTick(() => {
        console.log('this.$refs.fixedView', this.$refs.fixedView)
        if (this.$refs.fixedView) {
          // 获取 ref 元素的高度
          // tabBarHeight = this.$refs.fixedView.offsetHeight
          const query = uni.createSelectorQuery().in(this)
          // 获取该 fixed 元素的高度
          query
            .select('.box-2')
            .boundingClientRect(rect => {
              console.log('box-2 固定定位元素的高度:', rect.height)
              tabBarHeight = rect.height + 40
            })
            .exec()
        }
        // tabBarHeight += 50
        // 设置 scroll-view 高度为屏幕高度减去 tabBar 高度
        // this.scrollViewHeight = screenHeight - tabBarHeight
        // this.scrollToBottom()
        this.$set(this, 'scrollViewHeight', screenHeight - tabBarHeight)
        console.log('scrollViewHeight', this.scrollViewHeight)
      })
    },
    // 上拉加载更多数据
    onRefresh() {
      console.log('加载更多数据...')
      this.getHistoryMsg()
    },
    // 获取历史消息
    getHistoryMsg(custUserId) {
      console.log('getHistoryMsg')
      this.$store.commit('SET_TRIGGERD', true)
      if (custUserId) {
        CS4005.d.custUserId = custUserId
      }
      if (this.chatHistoryList && this.chatHistoryList.length > 0) {
        CS4005.d.sendTime = this.chatHistoryList[0].sendTime
      } else {
        // CS4005.d.sendTime = new Date().getTime()
        CS4005.d.sendTime = null
      }
      CS4005.d.requestId = generateRandomString()
      CS4005.d.pageNum = this.pagingObj.pageNum
      sendSocketMessage(CS4005)
    },
    // 滚动到最底部
    scrollToBottom() {
      const query = uni.createSelectorQuery().in(this)
      // 获取该 fixed 元素的高度
      query
        .select('.box-1')
        .boundingClientRect(rect => {
          console.log('box-1的高度:', rect.height)
          this.$set(this, 'scrollTop', rect.height)
        })
        .exec()
    },
    // 拼接图片
    getHttpImagedUrl(str) {
      return `${window.IMAGE_BASEURL}${str}`
    },
    // 预览图片
    previewImage(str) {
      uni.previewImage({
        current: 0, // 当前展示的图片索引
        urls: [this.getHttpImagedUrl(str)] // 图片列表
      })
    },
    // 处理表情
    handleEmote(emote) {
      this.content += emote
    },
    // 发送信息
    send() {
      if (!this.content) {
        uni.showToast({
          title: '请输入有效的内容',
          icon: 'none'
        })
        return
      }
      uni.showLoading({
        title: '正在发送'
      })
      this.handleSendCS4002(1)
    },
    // 处理 input @focus
    handleInputFocus() {
      this.isFocus = true
      this.isEmote = false
      this.isAdd = false
    },
    // 处理 input @blur
    handleInputBlur() {
      setTimeout(() => {
        this.isFocus = false
        this.isEmote = false
        this.isAdd = false
      }, 0)
    },
    // 处理 emote @click 事件 延时处理
    handleBtnEmote() {
      setTimeout(() => {
        this.isFocus = false
        this.isEmote = true
        this.isAdd = false
      }, 10)
    },
    // 处理 add @click 事件 延时处理
    handleBtnAdd() {
      setTimeout(() => {
        this.isFocus = false
        this.isEmote = false
        this.isAdd = true
      }, 10)
    },
    handleSendCS4002(type, imgUrl) {
      uni.showLoading({
        title: '正在发送'
      })
      // 将当前发送信息 添加到消息列表。
      console.log('this.closeUserObj', this.closeUserObj)
      if (this.userInfo.isCustomerService == 1) {
        CS4002.u = this.custUserId
      } else {
        CS4002.u = this.closeUserObj && this.closeUserObj.csUserId //接收用户
      }

      CS4002.d = {
        requestId: generateRandomString(),
        type: 1, //此为消息类别，设 1 为发出去的消息，0 为收到对方的消息,
        sendTime: new Date().getTime(),
        logo: this.userInfo.logo // 头像
      }
      //   msgType: '1', //消息类型： 1=普通文本  2=表情符号， 3=图片
      //   message: this.content, //表情符号使用代号，app客户端标记映射
      if (type == 1) {
        CS4002.d.msgType = 1
        CS4002.d.message = this.content
      }
      // type 3 为上传图片
      if (type == 3) {
        CS4002.d.msgType = 3
        CS4002.d.message = imgUrl.data
      }
      this.$store.commit('SET_NEWS_OBJ', CS4002.d)
      this.$store.commit('SET_IS_REGISTER', false)

      sendSocketMessage(CS4002)

      this.$nextTick(() => {
        // 清空内容框中的内容
        this.content = ''
        this.scrollToBottom()
      })
    },
    // 选择图片
    chooseImage() {
      const maxSize = 5 * 1024 * 1024 // 限制最大文件大小为 5MB
      uni.chooseImage({
        count: 1, // 选择一张图片
        success: res => {
          // 获取图片路径
          const tempFilePath = res.tempFilePaths[0]
          // 检查文件大小
          if (tempFilePath.size > maxSize) {
            // 如果文件大小超过限制，提示用户
            uni.showToast({
              title: '图片大小不能超过 5MB',
              icon: 'none'
            })
            return // 退出，不上传
          }
          this.imageUrl = tempFilePath
          this.uploadImage(tempFilePath) // 调用上传方法
        },
        fail: err => {
          console.log('选择图片失败', err)
        }
      })
    },
    // 上传图片
    uploadImage(filePath) {
      this.uploading = true // 设置上传状态为上传中
      uni.uploadFile({
        url: `${window.API_BASEURL}/app/uploadFile`, // 替换为你的上传接口地址
        filePath: filePath, // 图片文件路径
        name: 'file', // 后端接收文件的字段名
        formData: {
          type: 'chat' // 上传聊天图片
        },
        header: {
          Authorization: this.userInfo.Authorization, // 自定义请求头，例如 Authorization
          ContentType: 'multipart/form-data' // 可选，通常上传文件时可以设置为 multipart/form-data
        },
        success: uploadFileRes => {
          this.uploading = false
          this.uploadSuccess = true

          const result = JSON.parse(uploadFileRes.data)
          console.log(result, 'result')
          if (result.code == 0) {
            console.log('上传成功')
            this.handleSendCS4002(3, JSON.parse(uploadFileRes.data))
          } else {
            console.log('上传失败')
            uni.showToast({
              title: result.message,
              icon: 'error',
              duration: 2000
            })
          }

          this.handleInputBlur()
          // 如果需要处理返回的数据，可以解析 uploadFileRes.data
        },
        fail: error => {
          this.uploading = false
          this.uploadError = true
          console.log('上传失败', error)
        }
      })
    }
  }
}
</script>

<style lang="scss">
@import '../../lib/global.scss';

.fade-enter-active,
.fade-leave-active {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.fade-enter,
.fade-leave-to {
  transform: translateY(20px); /* 初始位置向下偏移 */
  opacity: 0;
}

page {
  background-color: #f3f3f3;
  // background-color: yellow;
  font-size: 28rpx;
}

.go_back {
  width: 100%;
  height: 40px;
  position: fixed;
  z-index: 999;
  background-color: #333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-size: 44rpx;
  color: #8a8989;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20rpx;
  box-sizing: border-box;

  .back {
    display: block;
    width: 46.51rpx;
    height: 46.51rpx;
  }

  .title {
    flex: 1;
    text-align: center;
    font-weight: 500;
    font-size: 28rpx;
    color: #fffcf3;
  }
}

.container {
  //   display: flex;
  //   flex-direction: column;
  //   height: 100vh; /* 父容器占满整个屏幕 */
}

/* 加载数据提示 */
.tips {
  position: fixed;
  left: 0;
  top: var(--window-top);
  width: 100%;
  z-index: 9;
  background-color: rgba(0, 0, 0, 0.15);
  height: 72rpx;
  line-height: 72rpx;
  transform: translateY(-80rpx);
  transition: transform 0.3s ease-in-out 0s;

  &.show {
    transform: translateY(0);
  }
}

.box-1 {
  width: 100%;

  height: auto;
  padding-bottom: 100rpx;
  box-sizing: content-box;
  //   background-color: red;

  /* 兼容iPhoneX */
  margin-bottom: 0;
  margin-bottom: constant(safe-area-inset-bottom);
  margin-bottom: env(safe-area-inset-bottom);

  .image_box {
    width: 300rpx;
    height: 200rpx;
    image {
      width: 100%;
      height: 100%;
    }
  }
}

.box-2 {
  position: fixed;
  left: 0;
  width: 100%;
  bottom: 0;
  height: auto;
  z-index: 99;
  // border-top: #e5e5e5 solid 1px;
  box-sizing: content-box;
  background-color: #fff;

  /* 兼容iPhoneX */
  padding-bottom: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .flex_col {
    padding: 0 20rpx;
    height: 150rpx;
  }

  .content {
    // background-color: #fff;
    height: 80rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    background: #efefef;
    border-radius: 44rpx;
  }

  .btn_icon {
    display: block;
    width: 56rpx;
    height: 56rpx;
    margin-left: 20rpx;
  }

  .send {
    background-color: #42b983;
    color: #fff;
    height: 64rpx;
    margin-left: 20rpx;
    border-radius: 32rpx;
    padding: 0;
    width: 120rpx;
    line-height: 62rpx;

    &:active {
      background-color: #5fc496;
    }
  }

  .emote_box {
    width: 100%;
    max-height: 400rpx;
    // background-color: red;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;

    &_item {
      font-size: 55rpx;
      width: 75rpx;
      height: 75rpx;
      text-align: center;
      line-height: 60rpx;
    }
  }

  .more_box {
    width: 100%;
    height: 200rpx;
    padding: 0 50rpx;
    // background-color: red;
    display: flex;
    align-items: center;

    image {
      display: block;
      width: 104rpx;
      height: 104rpx;
    }
  }
}

.talk-list {
  padding-bottom: 80rpx;

  /* 消息项，基础类 */
  .item {
    padding: 20rpx 20rpx 0 20rpx;
    // margin: 20rpx 20rpx 0 20rpx;
    align-items: flex-start;
    align-content: flex-start;
    color: #333;

    .pic {
      width: 92rpx;
      height: 92rpx;
      border-radius: 50%;
      border: #fff solid 1px;
    }

    .content {
      padding: 15rpx 20rpx;

      border-radius: 4px;
      max-width: 500rpx;
      word-break: break-all;
      min-height: 82rpx;
      line-height: 52rpx;
      position: relative;
    }

    /* 收到的消息 */
    &.pull {
      .content {
        margin-left: 32rpx;
        background-color: #fff;

        &::after {
          content: '';
          display: block;
          width: 0;
          height: 0;
          border-top: 16rpx solid transparent;
          border-bottom: 16rpx solid transparent;
          border-right: 20rpx solid #fff;
          position: absolute;
          top: 30rpx;
          left: -18rpx;
        }
      }
    }

    /* 发出的消息 */
    &.push {
      /* 主轴为水平方向，起点在右端。使不修改DOM结构，也能改变元素排列顺序 */
      flex-direction: row-reverse;

      .content {
        margin-right: 32rpx;
        background-color: #f1cfa8;

        &::after {
          content: '';
          display: block;
          width: 0;
          height: 0;
          border-top: 16rpx solid transparent;
          border-bottom: 16rpx solid transparent;
          border-left: 20rpx solid #f1cfa8;
          position: absolute;
          top: 30rpx;
          right: -18rpx;
        }
      }
    }
  }
}
</style>
