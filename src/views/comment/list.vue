<template>
  <div class="comment-list-page">
    <!-- 搜索卡片 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="评论内容 / 题目内容"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="评论状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option label="正常" :value="1" />
            <el-option label="已隐藏" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表卡片 -->
    <el-card class="table-card">
      <el-table
        :data="list"
        v-loading="loading"
        row-key="questionId"
        :empty-text="loading ? '加载中...' : '暂无评论数据'"
        @row-click="(row) => goDetail(row.questionId)"
      >
        <!-- 题目 -->
        <el-table-column label="题目" min-width="380">
          <template #default="{ row }">
            <div class="q-cell">
              <div class="q-content">{{ row.content || '-' }}</div>
              <img
                v-if="row.imageUrl"
                :src="fullUrl(row.imageUrl)"
                class="q-thumb"
                alt=""
              />
            </div>
          </template>
        </el-table-column>

        <!-- 类型 -->
        <el-table-column label="类型" min-width="220" class-name="category-cell">
          <template #default="{ row }">
            <span v-if="row.categoryLabel || row.category">
              {{ row.categoryLabel || row.category }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 来源 -->
        <el-table-column label="来源" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.source || '-' }}
          </template>
        </el-table-column>

        <!-- 评论数 -->
        <el-table-column label="评论数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain">{{ row.commentCount }}</el-tag>
          </template>
        </el-table-column>

        <!-- 最新评论 -->
        <el-table-column label="最新评论" min-width="260">
          <template #default="{ row }">
            <div class="last-comment">{{ row.lastCommentContent || '-' }}</div>
            <div class="last-time">{{ formatTime(row.lastCommentTime) }}</div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="goDetail(row.questionId)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { pageCommentQuestions } from '@/api/comment'

const BACKEND = '/api'
const fullUrl = (u) => (u ? (u.startsWith('http') ? u : BACKEND + u) : '')

const router = useRouter()

const list = ref([])
const total = ref(0)
const loading = ref(false)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: null
})

const formatTime = (t) => {
  if (!t) return '-'
  const s = String(t).replace('T', ' ')
  return s.slice(0, 16)   // 2026-10-14 12:30
}

async function loadData() {
  loading.value = true
  try {
    const res = await pageCommentQuestions(query)
    list.value = res.records || []
    total.value = res.total || 0
  } catch (e) {
    console.error('加载评论列表失败', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  loadData()
}

function resetQuery() {
  query.keyword = ''
  query.status = null
  query.pageNum = 1
  loadData()
}

function goDetail(questionId) {
  router.push(`/comment/detail/${questionId}`)
}

onMounted(loadData)
</script>

<style scoped>
.comment-list-page {
  padding: 16px;
}
.search-card {
  margin-bottom: 16px;
}
.table-card {
  padding: 0;
}
.q-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.q-content {
  flex: 1;
  font-size: 13px;
  color: #e0e6ff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}
.q-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 240, 255, 0.2);
}
.last-comment {
  font-size: 12px;
  color: #c4cce6;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.last-time {
  font-size: 11px;
  color: #8892c4;
}
:deep(.category-cell .cell) {
  white-space: normal !important;
  word-break: break-all;
  line-height: 1.5;
  overflow: visible;
  text-overflow: clip;
  padding: 8px 12px;
  box-sizing: border-box;
}
:deep(.el-table__row) {
  cursor: pointer;
}
</style>