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

export function logout() {
  return request({
    url: '/auth/admin/logout',
    method: 'post'
  })
}