import request from './request'

/** 有评论的题目列表（分页） */
export function pageCommentQuestions(data) {
  return request({
    url: '/admin/comment/question-page',
    method: 'POST',
    data
  })
}

/** 某题目的评论详情 */
export function getCommentQuestionDetail(questionId) {
  return request({
    url: `/admin/comment/question/${questionId}`,
    method: 'GET'
  })
}

/** 隐藏 / 恢复评论 */
export function updateCommentStatus(id, status) {
  return request({
    url: `/admin/comment/${id}/status`,
    method: 'PUT',
    params: { status }
  })
}

/** 删除评论 */
export function deleteComment(id) {
  return request({
    url: `/admin/comment/${id}`,
    method: 'DELETE'
  })
}