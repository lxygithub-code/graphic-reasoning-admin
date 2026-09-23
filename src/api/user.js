import request from './request'

export function pageUser(data) {
  return request({
    url: '/admin/user/page',
    method: 'post',
    data
  })
}

export function updateUserStatus(id, status) {
  return request({
    url: `/admin/user/${id}/status`,
    method: 'put',
    params: { status }
  })
}

export function deleteUser(id) {
  return request({
    url: `/admin/user/${id}`,
    method: 'delete'
  })
}

/** 更新用户权限 */
export function updateUserPermission(id, data) {
  return request({
    url: `/admin/user/${id}/permission`,
    method: 'put',
    params: data
  })
}