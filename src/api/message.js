import request from './request'

/** 消息分页 */
export function getMessagePage(params) {
  return request({
    url: '/admin/message/page',
    method: 'GET',
    params
  })
}

/** 未读数 */
export function getUnreadCount() {
  return request({
    url: '/admin/message/unread-count',
    method: 'GET'
  })
}

/** 标记单条已读 */
export function markMessageRead(id) {
  return request({
    url: `/admin/message/${id}/read`,
    method: 'PUT'
  })
}

/** 全部已读 */
export function markAllRead() {
  return request({
    url: '/admin/message/read-all',
    method: 'PUT'
  })
}