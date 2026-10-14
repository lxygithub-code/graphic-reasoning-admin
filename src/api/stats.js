import request from './request'

export function getOverview() {
  return request({
    url: '/admin/stats',
    method: 'get'
  })
}


/** 四大类题目分布 */
export function getCategoryDist() {
  return request({ url: '/admin/stats/category', method: 'get' })
}

/** 活跃趋势 */
export function getActiveTrend(days = 7) {
  return request({
    url: '/admin/stats/active-trend',
    method: 'GET',
    params: { days }
  })
}

/** 今日活跃用户列表 */
export function getTodayActiveUsers(pageNum = 1, pageSize = 20) {
  return request({
    url: '/admin/stats/today-active-users',
    method: 'GET',
    params: { pageNum, pageSize }
  })
}

/** 可抽取题目趋势 */
export function getExtractableTrend(days = 7) {
  return request({
    url: '/admin/stats/extractable-trend',
    method: 'GET',
    params: { days }
  })
}

/** 今日活跃峰值时段 */
export function getPeakHour() {
  return request({
    url: '/admin/stats/peak-hour',
    method: 'GET'
  })
}

/** 今日各时段活跃用户数 */
export function getTodayHourlyActive() {
  return request({
    url: '/admin/stats/today-hourly-active',
    method: 'GET'
  })
}