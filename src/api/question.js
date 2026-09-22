import request from './request'

export function pageQuestion(data) {
  return request({
    url: '/admin/question/page',
    method: 'post',
    data
  })
}

export function saveQuestion(data) {
  return request({
    url: '/admin/question',
    method: 'post',
    data
  })
}

export function updateQuestion(data) {
  return request({
    url: '/admin/question',
    method: 'put',
    data
  })
}

export function getQuestionDetail(id) {
  return request({
    url: `/admin/question/${id}`,
    method: 'get'
  })
}

export function deleteQuestion(id) {
  return request({
    url: `/admin/question/${id}`,
    method: 'delete'
  })
}

export function batchDeleteQuestion(ids) {
  return request({
    url: '/admin/question/batch',
    method: 'delete',
    data: ids
  })
}

export function listQuestionSources(params = {}) {
  return request({
    url: '/admin/question/sources',
    method: 'get',
    params
  })
}

export function listQuestionsBySource(source) {
  return request({
    url: '/admin/question/by-source',
    method: 'get',
    params: { source }
  })
}