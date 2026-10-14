<template>
  <div class="message-page">
    <!-- 顶部标题栏 -->
    <div class="msg-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="20"><BellFilled /></el-icon>
        </div>
        <div class="header-text">
          <h2>消息中心</h2>
          <p v-if="unreadCount > 0" class="header-sub">
            你有 <span class="highlight">{{ unreadCount }}</span> 条未读消息
          </p>
          <p v-else class="header-sub muted">暂无未读消息</p>
        </div>
      </div>
      <el-button
        v-if="unreadCount > 0"
        class="mark-all-btn"
        @click="handleMarkAllRead"
      >
        <el-icon><Check /></el-icon>
        <span>全部已读</span>
      </el-button>
    </div>

    <!-- 筛选 tab（药丸式） -->
    <div class="filter-tabs">
      <div
        v-for="tab in tabs"
        :key="String(tab.value)"
        class="filter-tab"
        :class="{ active: filter === tab.value }"
        @click="switchFilter(tab.value)"
      >
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.value === 0 && unreadCount > 0"
          class="tab-count"
        >{{ unreadCount }}</span>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="msg-body" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && !list.length" class="empty-state">
        <div class="empty-glow">
          <el-icon :size="40"><Bell /></el-icon>
        </div>
        <p class="empty-title">暂无消息</p>
        <p class="empty-tip">用户的评论会在这里提醒你</p>
      </div>

      <!-- 消息列表 -->
      <div v-else class="msg-list">
        <div
          v-for="msg in list"
          :key="msg.id"
          class="msg-card"
          :class="{ unread: msg.isRead === 0 }"
          @click="handleClick(msg)"
        >
          <!-- 左侧图标 -->
          <div class="card-icon" :class="msg.type">
            <el-icon :size="18">
              <ChatDotRound v-if="msg.type === 'comment'" />
              <Document v-else-if="msg.type === 'question'" />
              <Bell v-else />
            </el-icon>
            <span v-if="msg.isRead === 0" class="icon-dot"></span>
          </div>

          <!-- 内容 -->
          <div class="card-body">
            <div class="card-title-row">
              <span class="card-title">{{ msg.title }}</span>
              <span class="card-time">{{ formatTime(msg.createTime) }}</span>
            </div>
            <p class="card-content">{{ msg.content }}</p>
            <div class="card-meta">
              <span class="meta-tag">
                <el-icon :size="12"><Pointer /></el-icon>
                点击查看详情
              </span>
            </div>
          </div>

          <!-- 右侧箭头 -->
          <div class="card-arrow">
            <el-icon :size="16"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell, BellFilled, Check, ArrowRight,
  ChatDotRound, Document, Pointer
} from '@element-plus/icons-vue'
import {
  getMessagePage,
  markMessageRead,
  markAllRead,
  getUnreadCount
} from '@/api/message'

const router = useRouter()

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const filter = ref(null)
const loading = ref(false)
const unreadCount = ref(0)

const tabs = [
  { label: '全部', value: null },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 }
]

const formatTime = (t) => {
  if (!t) return ''
  const s = String(t).replace('T', ' ')
  const date = new Date(s.replace(/-/g, '/'))
  const now = new Date()
  const diff = (now - date) / 1000

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return s.slice(0, 16)
}

async function loadData() {
  loading.value = true
  try {
    const res = await getMessagePage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      isRead: filter.value
    })
    list.value = res.records || []
    total.value = res.total || 0
    await loadUnreadCount()
  } catch (e) {
    console.error('加载消息失败', e)
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount() {
  try {
    unreadCount.value = Number(await getUnreadCount()) || 0
  } catch (e) {}
}

function switchFilter(val) {
  filter.value = val
  pageNum.value = 1
  loadData()
}

async function handleClick(msg) {
  if (msg.isRead === 0) {
    try {
      await markMessageRead(msg.id)
      msg.isRead = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {}
  }
  if (msg.type === 'comment' && msg.refQuestionId) {
    router.push(`/comment/detail/${msg.refQuestionId}`)
  }
}

async function handleMarkAllRead() {
  try {
    await markAllRead()
    ElMessage.success('已全部标记为已读')
    await loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.message-page {
  padding: 4px;
}

/* ============ 顶部标题栏 ============ */
.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.06), rgba(124, 77, 255, 0.06));
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  color: #fff;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
}

.header-text h2 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #e0e6ff;
  font-weight: 700;
  letter-spacing: 1px;
}

.header-sub {
  margin: 0;
  font-size: 13px;
  color: #8892c4;
}

.header-sub .highlight {
  color: #00f0ff;
  font-weight: 700;
  font-size: 14px;
}

.header-sub.muted {
  color: #5a6288;
}

.mark-all-btn {
  background: rgba(0, 240, 255, 0.1) !important;
  border: 1px solid rgba(0, 240, 255, 0.4) !important;
  color: #00f0ff !important;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  background: rgba(0, 240, 255, 0.2) !important;
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.4);
}

.mark-all-btn .el-icon {
  margin-right: 6px;
}

/* ============ 筛选 tab ============ */
.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 4px;
  background: rgba(15, 22, 40, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(0, 240, 255, 0.1);
  width: fit-content;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  color: #8892c4;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.filter-tab:hover {
  color: #00f0ff;
}

.filter-tab.active {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(124, 77, 255, 0.2));
  color: #00f0ff;
  font-weight: 600;
  box-shadow: inset 0 0 12px rgba(0, 240, 255, 0.15);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ff4d6d, #f56c6c);
  border-radius: 9px;
}

/* ============ 消息列表 ============ */
.msg-body {
  min-height: 320px;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background: rgba(15, 22, 40, 0.5);
  border: 1px solid rgba(0, 240, 255, 0.08);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}

.msg-card:hover {
  background: rgba(0, 240, 255, 0.04);
  border-color: rgba(0, 240, 255, 0.3);
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(0, 240, 255, 0.08);
}

.msg-card.unread {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.06), rgba(124, 77, 255, 0.05));
  border-color: rgba(0, 240, 255, 0.25);
}

.msg-card.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: linear-gradient(180deg, #00f0ff, #7c4dff);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 10px #00f0ff;
}

/* 左侧图标 */
.card-icon {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.25);
}

.card-icon.comment {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.25);
}

.card-icon.question {
  color: #7c4dff;
  background: rgba(124, 77, 255, 0.1);
  border-color: rgba(124, 77, 255, 0.25);
}

.icon-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff4d6d;
  border: 2px solid #0a0f1e;
  box-shadow: 0 0 8px #ff4d6d;
}

/* 中间内容 */
.card-body {
  flex: 1;
  min-width: 0;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0e6ff;
}

.msg-card.unread .card-title {
  color: #00f0ff;
}

.card-time {
  font-size: 12px;
  color: #5a6288;
  flex-shrink: 0;
}

.card-content {
  margin: 0 0 10px;
  font-size: 13px;
  color: #c4cce6;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #00f0ff;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.msg-card:hover .meta-tag {
  opacity: 1;
}

/* 右侧箭头 */
.card-arrow {
  display: flex;
  align-items: center;
  align-self: center;
  color: #5a6288;
  transition: all 0.2s;
}

.msg-card:hover .card-arrow {
  color: #00f0ff;
  transform: translateX(4px);
}

/* ============ 空状态 ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-glow {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 70%);
  color: #5a6288;
  margin-bottom: 20px;
  animation: glow-breathe 3s ease-in-out infinite;
}

@keyframes glow-breathe {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 240, 255, 0.25);
  }
}

.empty-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #8892c4;
  font-weight: 500;
}

.empty-tip {
  margin: 0;
  font-size: 12px;
  color: #5a6288;
}

/* ============ 分页 ============ */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 16px 0;
}

.pagination-wrap :deep(.el-pagination) {
  --el-pagination-bg-color: rgba(15, 22, 40, 0.6);
  --el-pagination-text-color: #8892c4;
  --el-pagination-button-color: #8892c4;
  --el-pagination-hover-color: #00f0ff;
}

.pagination-wrap :deep(.el-pagination button),
.pagination-wrap :deep(.el-pager li) {
  background: rgba(15, 22, 40, 0.6) !important;
  color: #8892c4 !important;
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-radius: 8px;
  margin: 0 3px;
}

.pagination-wrap :deep(.el-pager li.is-active) {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(124, 77, 255, 0.2)) !important;
  color: #00f0ff !important;
  border-color: rgba(0, 240, 255, 0.4);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
}

.pagination-wrap :deep(.el-pagination__total),
.pagination-wrap :deep(.el-pagination__sizes .el-input__wrapper) {
  color: #8892c4 !important;
}
</style>