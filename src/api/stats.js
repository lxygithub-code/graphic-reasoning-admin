import request from './request'

export function getOverview() {
  return request({
    url: '/admin/stats',
    method: 'get'
  })
}