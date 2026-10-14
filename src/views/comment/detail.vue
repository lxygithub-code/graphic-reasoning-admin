<template>
  <div class="comment-detail-page">
    <el-card v-loading="loading">
      <!-- 返回 -->
      <div class="page-header">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h3>评论详情</h3>
      </div>

      <!-- 题目信息 -->
      <el-divider content-position="left">题目信息</el-divider>

      <el-descriptions v-if="detail.question" :column="2" border>
        <el-descriptions-item label="题目ID">{{ detail.question.id }}</el-descriptions-item>
        <el-descriptions-item label="难度">{{ detail.question.difficulty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="类型" :span="2">
          {{ detail.question.categoryLabel || detail.question.category || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="来源" :span="2">
          {{ detail.question.source || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="题目内容" :span="2">
          <div style="white-space: pre-wrap">{{ detail.question.content }}</div>
        </el-descriptions-item>

        <el-descriptions-item v-if="detail.question.imageUrl" label="题目图片" :span="2">
          <img
            :src="fullUrl(detail.question.imageUrl)"
            style="max-width: 320px; border-radius: 6px"
            alt=""
          />
        </el-descriptions-item>

        <el-descriptions-item v-if="detail.question.analysis" label="默认解析" :span="2">
          <div style="white-space: pre-wrap">{{ detail.question.analysis }}</div>
        </el-descriptions-item>

        <!-- 平台解析 -->
        <el-descriptions-item
          v-if="detail.question.analyses && detail.question.analyses.length"
          label="平台解析"
          :span="2"
        >
          <div v-for="(a, i) in detail.question.analyses" :key="i" class="analysis-item">
            <el-tag size="small" effect="plain" type="warning" style="margin-bottom: 6px">
              {{ a.platform }}
            </el-tag>
            <div v-if="a.type !== 'image'" class="analysis-text">{{ a.content }}</div>
            <img v-else :src="fullUrl(a.content)" class="analysis-img" alt="" />
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 评论列表 -->
      <el-divider content-position="left">
        评论列表（{{ detail.comments.length }}）
      </el-divider>

      <div v-if="!detail.comments.length" class="empty">暂无评论</div>

      <div
        v-for="c in detail.comments"
        :key="c.id"
        class="comment-item"
        :class="{ hidden: c.status === 0 }"
      >
        <div class="comment-head">
          <img v-if="c.avatarUrl" :src="fullUrl(c.avatarUrl)" class="avatar" alt="" />
          <div v-else class="avatar-placeholder">👤</div>

          <div class="info">
            <span class="nickname">{{ c.nickname }}</span>
            <span class="time">{{ c.createTime }}</span>
          </div>

          <el-tag v-if="c.status === 0" type="info" size="small" effect="plain">
            已隐藏
          </el-tag>

          <div class="actions">
            <el-button
              v-if="c.status === 1"
              link
              type="warning"
              size="small"
              @click="toggleStatus(c, 0)"
            >
              隐藏
            </el-button>
            <el-button
              v-else
              link
              type="success"
              size="small"
              @click="toggleStatus(c, 1)"
            >
              恢复
            </el-button>

            <el-divider direction="vertical" />

            <el-button link type="danger" size="small" @click="handleDelete(c)">
              删除
            </el-button>
          </div>
        </div>

        <div class="comment-content">{{ c.content }}</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  getCommentQuestionDetail,
  updateCommentStatus,
  deleteComment
} from '@/api/comment'

const BACKEND = '/api'
const fullUrl = (u) => (u ? (u.startsWith('http') ? u : BACKEND + u) : '')

const route = useRoute()

const loading = ref(false)
const detail = ref({
  question: null,
  comments: []
})

async function loadData() {
  loading.value = true
  try {
    const questionId = route.params.questionId
    const res = await getCommentQuestionDetail(questionId)
    detail.value = {
      question: res.question || null,
      comments: res.comments || []
    }
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(comment, status) {
  try {
    await updateCommentStatus(comment.id, status)
    comment.status = status
    ElMessage.success(status === 1 ? '已恢复' : '已隐藏')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(comment) {
  try {
    await ElMessageBox.confirm('确定删除该评论吗？删除后不可恢复', '提示', {
      type: 'warning'
    })
    await deleteComment(comment.id)
    detail.value.comments = detail.value.comments.filter((c) => c.id !== comment.id)
    ElMessage.success('已删除')
  } catch (e) {
    // 用户取消
  }
}

onMounted(loadData)
</script>

<style scoped>
.comment-detail-page {
  padding: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.page-header h3 {
  margin: 0;
  font-size: 16px;
}
.analysis-item {
  margin-bottom: 12px;
}
.analysis-text {
  font-size: 13px;
  color: #c4cce6;
  line-height: 1.7;
  white-space: pre-wrap;
}
.analysis-img {
  max-width: 320px;
  border-radius: 6px;
  margin-top: 6px;
}
.comment-item {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.comment-item.hidden {
  background: rgba(255, 255, 255, 0.03);
  opacity: 0.65;
}
.comment-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}
.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2a3550;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.nickname {
  font-weight: 600;
  font-size: 13px;
  color: #e0e6ff;
}
.time {
  font-size: 11px;
  color: #8892c4;
  margin-top: 2px;
}
.actions {
  display: flex;
  align-items: center;
}
.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #e0e6ff;
  white-space: pre-wrap;
  word-break: break-all;
  padding-left: 48px;
}
.empty {
  text-align: center;
  color: #8892c4;
  padding: 40px 0;
  font-size: 13px;
}
</style>