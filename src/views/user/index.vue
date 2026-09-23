<template>
  <div>
    <el-card>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatarUrl" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            {{ ['未知', '男', '女'][row.gender] || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="val => handleStatus(row, val)"
            />
          </template>
        </el-table-column>
       <el-table-column label="评论权限" width="120" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.canComment === 1"
              @change="val => handlePermissionChange(row, 'canComment', val ? 1 : 0)" active-color="#00f0ff"
              inactive-color="#5a6288" />
          </template>
        </el-table-column>

        <el-table-column label="展示评论" width="120" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.showComment === 1"
              @change="val => handlePermissionChange(row, 'showComment', val ? 1 : 0)" active-color="#00f0ff"
              inactive-color="#5a6288" />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最近登录" width="180" />
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 16px; justify-content: flex-end"
        background
        layout="total, prev, pager, next"
        :total="total"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageUser, updateUserStatus, deleteUser, updateUserPermission } from '@/api/user'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, nickname: '', status: null })

const loadData = async () => {
  loading.value = true
  try {
    const data = await pageUser(query)
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
/** 通用权限变更 */
const handlePermissionChange = async (row, field, value) => {
  try {
    await updateUserPermission(row.id, { [field]: value })
    row[field] = value
    ElMessage.success('已更新')
  } catch (e) {
    // 失败时回滚显示
    ElMessage.error('更新失败')
  }
}

/** 原来的 handleStatus 也改成这个逻辑 */
const handleStatus = async (row, val) => {
  const status = val ? 1 : 0
  await updateUserPermission(row.id, { status })
  row.status = status
  ElMessage.success('状态已更新')
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除用户「${row.nickname}」吗？`, '提示', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #00f0ff !important;
  border-color: #00f0ff !important;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
}
</style>