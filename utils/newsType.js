// 注册
export const CS1001 = {
  t: 100, //消息类型
  a: 1001,
  d: {}
}

// 注册 客服
export const CS1002 = {
  t: 100, //消息类型
  a: 1002,
  d: {}
}

// 客服聊天服务(400)
// 客服聊天执行动作：

// 发起客服聊天=4001
export const CS4001 = {
  t: 400,
  a: 4001,
  d: {}
}

// 与客服聊天=4002
export const CS4002 = {
  t: 400,
  a: 4002,
  u: null,
  d: {}
}

// 关闭客服聊天=4003
export const CS4003 = {
  t: 400,
  a: 4003,
  d: {}
}

// 拉取客服聊天=4005
export const CS4005 = {
  t: 400,
  a: 4005,
  d: {
    // requestId: '', // 本次请求ID，原样返回
    pageNum: 1, //可选，查询第一页
    pageSize: 10 //可选，每次返回数量
  }
}
