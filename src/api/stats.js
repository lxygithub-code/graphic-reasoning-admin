import request from './request'

export function getOverview() {
  return request({
    url: '/admin/stats',
    method: 'get'
  })
}

/** ★ 增量趋势 */
export function getGrowth(days = 7) {
  return request({ url: '/admin/stats/growth', method: 'get', params: { days } })
}

/** ★ 活跃统计 */
export function getActive(days = 7) {
  return request({ url: '/admin/stats/active', method: 'get', params: { days } })
}

/** ★ 四大类题目分布 */
export function getCategoryDist() {
  return request({ url: '/admin/stats/category', method: 'get' })
}