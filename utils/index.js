/**
 * 生成随机 6位数的 字符串
 */
export const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }
  return new Date().getTime() + result
}

/**
 * 拼接图片前缀
 */
export const getHttpImagedUrl = str => {
  return `${window.IMAGE_BASEURL}${str}`
}

/**
 * 表情数组
 */
export const emote = [
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '🤣',
  '😂',
  '🙂',
  '🙃',
  '😉',
  '😊',
  '😇',
  '😍',
  '🤩',
  '😘',
  '😗',
  '😚',
  '😙',
  '😋',
  '😛',
  '😜',
  '🤪',
  '😝',
  '🤑',
  '🤗',
  '🤭',
  '🤫',
  '🤔',
  '🤐',
  '🤨',
  '😐',
  '😑',
  '😶',
  '😏',
  '😒',
  '🙄',
  '😬',
  '🤥',
  '😌',
  '😔',
  '😪',
  '🤤',
  '😴',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤮',
  '🤧',
  '😵',
  '🤯',
  '🤠',
  '😎',
  '🤓',
  '🧐',
  '😕',
  '😟',
  '🙁',
  '😮',
  '😯',
  '😲',
  '😳',
  '😦',
  '😧',
  '😨',
  '😰',
  '😥',
  '😢',
  '😭',
  '😱',
  '😖',
  '😣',
  '😞',
  '😓',
  '😩',
  '😫',
  '😤',
  '😡',
  '😠',
  '🤬',
  '😀',
  '👋',
  '🤚',
  '🖐',
  '✋',
  '🖖',
  '👌',
  '✌',
  '🤞',
  '🤟',
  '🤘',
  '🤙',
  '👈',
  '👉',
  '👆',
  '🖕',
  '👇',
  '☝',
  '👍',
  '👎',
  '✊',
  '👊',
  '🤛',
  '🤜',
  '👏',
  '🙌',
  '👐',
  '🤲',
  '🙏',
  '✍',
  '💅',
  '🤳',
  '💪'
]

// 判断当前运行系统 输出 "Android" 或 "iOS" 或 "unknown"
export const getPlatformType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  if (userAgent.indexOf('Android') > -1) {
    return 'Android'
  }
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return 'iOS'
  }
  // 判断是否为 macOS
  if (/Macintosh/i.test(userAgent) || /Mac OS X/i.test(userAgent)) {
    return 'macOS'
  }
  return 'unknown'
}

// 发送消息给 app
export const globalSendMessage = typeObj => {
  console.log('这是一个全局方法', JSON.stringify(typeObj))
  // 当前运行到系统环境
  const GLOBAL_SYSTEM = getPlatformType()
  const windowObj = window
  try {
    if (GLOBAL_SYSTEM == 'iOS' || GLOBAL_SYSTEM == 'macOS') {
      windowObj.webkit.messageHandlers.encryptMessages.postMessage(JSON.stringify(typeObj))
    } else if (GLOBAL_SYSTEM == 'Android') {
      windowObj.JsBridge.encryptMessages(JSON.stringify(typeObj))
    }
  } catch (error) {}
}

// 日期格式化
export function parseTime(time, pattern) {
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time
        .replace(new RegExp(/-/gm), '/')
        .replace('T', ' ')
        .replace(new RegExp(/\.[\d]{3}/gm), '')
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value]
    }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return time_str
}
