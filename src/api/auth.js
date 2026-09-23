import request from './request'

export function login(data) {
  return request({
    url: '/auth/admin/login',   // ★ 改成管理端登录
    method: 'post',
    data
  })
}

export function getCurrentUser() {
  return request({
    url: '/admin/profile',
    method: 'get'
  })
}


/** 修改账号/昵称/头像 */
export function updateProfile(data) {
  return request({
    url: '/admin/profile',
    method: 'put',
    data
  })
}

/** 修改密码 */
export function changePassword(data) {
  return request({
    url: '/admin/profile/password',
    method: 'put',
    data
  })
}

/** 退出登录 */
export function logout() {
  return request({
    url: '/auth/admin/logout',
    method: 'post'
  })
}