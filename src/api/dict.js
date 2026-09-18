import request from './request'

/** 平铺列表 */
export function listDict(dictType, level) {
  return request({
    url: '/dict/list',
    method: 'get',
    params: { dictType, level }
  })
}

/** 树形结构 */
export function treeDict(dictType) {
  return request({
    url: '/dict/tree',
    method: 'get',
    params: { dictType }
  })
}

export function adminListDictTypes() {
  return request({
    url: '/dict/types',
    method: 'get'
  })
}

export function adminPageDict(data) {
  return request({
    url: '/dict/page',
    method: 'post',
    data
  })
}

export function adminSaveDict(data) {
  return request({
    url: '/dict',
    method: 'post',
    data
  })
}

export function adminUpdateDict(data) {
  return request({
    url: '/dict',
    method: 'put',
    data
  })
}

export function adminDeleteDict(id) {
  return request({
    url: `/dict/${id}`,
    method: 'delete'
  })
}

export function adminListAllDict() {
  return request({
    url: '/dict/all',
    method: 'get'
  })
}