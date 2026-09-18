<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-num">{{ stats.userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-num">{{ stats.questionCount }}</div>
            <div class="stat-label">题目总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-num">{{ stats.practiceCount }}</div>
            <div class="stat-label">练习总次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-num">{{ stats.avgAccuracy }}%</div>
            <div class="stat-label">平均正确率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-num">{{ stats.todayUserCount }}</div>
            <div class="stat-label">今日新增用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <div class="stat-num">{{ stats.todayPracticeCount }}</div>
            <div class="stat-label">今日练习次数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverview } from '@/api/stats'

const stats = ref({
  userCount: 0,
  questionCount: 0,
  practiceCount: 0,
  avgAccuracy: 0,
  todayUserCount: 0,
  todayPracticeCount: 0
})

onMounted(async () => {
  stats.value = await getOverview()
})
</script>

<style scoped>
.stat { text-align: center; }
.stat-num { font-size: 32px; font-weight: bold; color: #1abc9c; }
.stat-label { color: #909399; margin-top: 8px; }
</style>