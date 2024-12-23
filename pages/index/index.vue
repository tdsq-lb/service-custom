<template>
  <view class="container">
    <scroll-view
      scroll-y
      ref="scrollView"
      :refresher-enabled="enabled"
      :refresher-triggered="triggered"
      refresher-background="#f3f3f3"
      @refresherrefresh="onRefresh"
      :style="{ height: '100vh' }"
    >
      <view class="list">
        <view class="list_item" v-for="item in chatUserList" :key="item.msgId" @click="hnadleJump(item)">
          <!-- // chatType 聊天类型:0=正常聊天,1=客户发送给客服,2客服回复客户 -->
          <!-- <image :src="getHttpImagedUrl(item.sendAvatar)" mode="aspectFill" class="avatar"></image> -->
          <image
            :src="getHttpImagedUrl(item.chatType == 1 ? item.sendAvatar : item.receiveAvatar)"
            mode="aspectFill"
            class="avatar"
          ></image>
          <view class="info">
            <view class="top">
              <text class="top_name">{{ item.chatType == 1 ? item.sendName || item.sendUser : item.receiveName }}</text>
              <text class="top_time">{{ item.time }}</text>
              <!-- <text class="top_name">{{ item.receiveName }}</text>
              <text class="top_time">{{ item.receiveTime }}</text> -->
            </view>
            <view class="top grayTxtColor">
              <text>{{ item.message }}</text>
              <text v-if="item.isNew" class="badge" style="">●</text>
            </view>
          </view>
        </view>
        <view class="empty grayTxtColor" v-if="chatUserList && chatUserList.length == 0">{{
          userInfo && userInfo.language == 'zh' ? '暂无新消息' : 'No new news at the moment'
        }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { mapState } from 'vuex'
import { handleSendCS1001 } from '@/utils/socketControl.js'
export default {
  data() {
    return {
      enabled: true
    }
  },
  computed: {
    ...mapState(['userInfo', 'triggered', 'chatUserList'])
  },
  onShow: function () {
    this.enabled = true
  },
  methods: {
    // 下拉刷新
    onRefresh() {
      if (this.enabled) {
        console.log('下拉刷新...onRefreshonRefresh')
        this.$store.commit('SET_TRIGGERD', true)
        handleSendCS1001()
      }
    },
    // 拼接图片
    getHttpImagedUrl(str) {
      return `${window.IMAGE_BASEURL}${str}`
    },
    hnadleJump(item) {
      let a, b
      if (item.chatType == 1) {
        a = item.sendUser
        b = item.sendName || item.sendUser
      } else {
        a = item.receiveUser
        b = item.receiveName
      }
      this.enabled = false
      this.$store.commit('SET_CHAT_HISTORY_LIST', { type: 'clear' })
      this.$store.commit('SET_CHAT_USER_LIST', { type: 'flag', message: item.sendTime })
      // this.$store.commit('SET_CURRENT_SEND_USERID', item.sendUser)
      this.$store.commit('SET_CURRENT_SEND_USERID', a)
      uni.navigateTo({
        url: `/pages/chat/chat?custUserId=${a}&sendName=${b}`
      })
    }
  }
}
</script>

<style lang="scss">
page {
  background-color: #f3f3f3;
  // background-color: red;
  font-size: 28rpx;
}

.container {
  position: relative;

  .empty {
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -40%);
    // color: #959595;
  }

  .grayTxtColor {
    color: #959595;
  }
}

.list_item {
  width: 100%;
  height: 152rpx;
  // background-color: red;
  display: flex;
  padding: 0 40rpx;
  box-sizing: border-box;
  align-items: center;
  border-bottom: 1rpx solid #d5d4d4;

  .avatar {
    flex-shrink: 0;
    /* 不压缩 */
    display: block;
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 28rpx;
  }

  .info {
    flex: 1;
    overflow: hidden;

    .top {
      display: flex;
      justify-content: space-between;

      &_name {
        font-size: 32rpx;
        // line-height: 32rpx;
        font-weight: 500;
        color: #10161b;

        width: 60%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        -webkit-line-clamp: 1;
      }

      &_time {
        font-size: 24rpx;
        color: #bbbab4;
      }

      .badge {
        color: red;
        // display: flex;
        // align-items: center;
        // justify-content: center;
        // font-size: 20rpx;
        // // width: 20rpx;
        // height: 20rpx;
        // background-color: red;
        // color: white;
        // border-radius: 20rpx;
        // padding: 5rpx;
      }
    }

    // .bottom {
    // 	margin-top: 10rpx;
    // 	font-weight: 500;
    // 	font-size: 26rpx;
    // 	// line-height: 24rpx;

    // 	// display: -webkit-box;
    // 	// -webkit-box-orient: vertical;
    // 	// overflow: hidden;
    // 	// text-overflow: ellipsis;
    // 	// -webkit-line-clamp: 1;

    // 	display: flex;
    // 	flex-direction: row;
    // 	/* 垂直方向 */

    // 	overflow: hidden;

    // 	text {
    // 		text-overflow: ellipsis;
    // 		overflow: hidden;
    // 		white-space: nowrap;
    // 		/* 防止换行 */
    // 		text-align: left;
    // 	}
    // }
  }
}
</style>
