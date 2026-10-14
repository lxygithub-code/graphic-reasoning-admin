<template>
  <div class="dashboard">
    <!-- 顶部 4 个核心指标卡 -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="(k, i) in kpiList" :key="i">
        <div class="kpi-icon" :style="{ background: k.color }">
          <el-icon :size="28"><component :is="k.icon" /></el-icon>
        </div>
        <div class="kpi-info">
          <div
            class="kpi-value"
            :class="{ 'kpi-value-sm': k.size === 'small' }"
            :style="{ color: k.color }"
          >
            {{ k.value }}
          </div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
        <div class="kpi-glow" :style="{ background: k.color }"></div>
      </div>
    </div>

    <!-- 第二行：可抽取题目趋势 + 今日数据 -->
    <div class="chart-row">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">可抽取题目趋势</span>
          <el-radio-group v-model="extractDays" size="small" @change="loadExtractableTrend">
            <el-radio-button :value="7">7天</el-radio-button>
            <el-radio-button :value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="extractChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">今日数据</span>
          <el-button link type="primary" size="small" @click="showTodayUsers = true">
            查看今日用户 ›
          </el-button>
        </div>
        <div class="today-panel">
          <div class="circle-wrap">
            <div
              class="circle-progress"
              :style="{ '--percent': todayActivePercent + '%', '--color': '#00f0ff' }"
            >
              <div class="circle-inner">
                <div class="circle-num">{{ activeTrend.todayCount || 0 }}</div>
                <div class="circle-label">今日活跃</div>
              </div>
            </div>
            <div class="circle-desc">
              占总用户 <span class="highlight">{{ todayActivePercent }}%</span>
            </div>
          </div>

          <div class="circle-wrap">
            <div
              class="circle-progress"
              :style="{ '--percent': todayNewUserPercent + '%', '--color': '#7c4dff' }"
            >
              <div class="circle-inner">
                <div class="circle-num purple">{{ stats.todayUserCount || 0 }}</div>
                <div class="circle-label">今日新增</div>
              </div>
            </div>
            <div class="circle-desc">
              占总用户 <span class="highlight purple">{{ todayNewUserPercent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第三行：题目分类分布 + 今日各时段活跃度 -->
    <div class="chart-row">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">题库分类分布</span>
        </div>
        <div ref="categoryChartRef" class="chart-body"></div>
      </div>

      <!-- ★ 今日各时段活跃度 -->
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">今日各时段活跃度</span>
          <span class="hourly-hint">共 24 小时</span>
        </div>
        <div ref="hourlyChartRef" class="chart-body"></div>
      </div>
    </div>

    <!-- 今日活跃用户弹窗 -->
    <el-dialog
      v-model="showTodayUsers"
      title="今日活跃用户"
      width="780px"
      class="dark-dialog"
      append-to-body
    >
      <el-table
        :data="todayUsers"
        v-loading="usersLoading"
        size="small"
        :empty-text="usersLoading ? '加载中...' : '今日暂无活跃用户'"
        max-height="480"
      >
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <img
                v-if="row.avatarUrl"
                :src="row.avatarUrl"
                class="mini-avatar"
                alt=""
              />
              <div v-else class="mini-avatar placeholder">👤</div>
              <span>{{ row.nickname || '匿名' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="requestCount" label="请求次数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" effect="plain" size="small">
              {{ row.requestCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="首次活跃" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.firstTime) }}
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.lastTime) }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <span class="dialog-tip">共 {{ todayUsers.length }} 位用户今日活跃</span>
          <el-button @click="showTodayUsers = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import {
  User, Document, Clock, Calendar
} from '@element-plus/icons-vue'
import {
  getOverview,
  getCategoryDist,
  getActiveTrend,
  getTodayActiveUsers,
  getExtractableTrend,
  getPeakHour,
  getTodayHourlyActive
} from '@/api/stats'

// ============ 基础数据 ============
const stats = ref({
  userCount: 0,
  questionCount: 0,
  extractableCount: 0,
  practiceCount: 0,
  avgAccuracy: 0,
  todayUserCount: 0,
  todayPracticeCount: 0
})

// 活跃趋势
const activeTrend = ref({
  dates: [],
  counts: [],
  todayCount: 0,
  yesterdayCount: 0
})

// 峰值时段
const peakHour = ref({ hour: null, count: 0 })

const extractDays = ref(7)

// 峰值时段副标题
const peakHourLabel = computed(() => {
  const h = peakHour.value.hour
  if (h === null || h === undefined) return '今日暂无活跃'
  const start = String(h).padStart(2, '0')
  const end = String(h + 1).padStart(2, '0')
  return `今日 ${start}:00-${end}:00 最活跃`
})

// KPI 列表
const kpiList = computed(() => [
  {
    label: '用户总数',
    value: stats.value.userCount || 0,
    color: '#00f0ff',
    icon: User
  },
  {
    label: '可抽取 / 题目总数',
    value: `${stats.value.extractableCount || 0} / ${stats.value.questionCount || 0}`,
    color: '#7c4dff',
    icon: Document,
    size: 'small'
  },
  {
    label: peakHourLabel.value,
    value: peakHour.value.count || 0,
    color: '#ff4d94',
    icon: Clock
  },
  {
    label: '昨日活跃',
    value: activeTrend.value.yesterdayCount || 0,
    color: '#ffaa33',
    icon: Calendar
  }
])

// 今日活跃占比
const todayActivePercent = computed(() => {
  if (!stats.value.userCount) return 0
  return Math.min(100, Math.round((activeTrend.value.todayCount / stats.value.userCount) * 100))
})

// 今日新增占比
const todayNewUserPercent = computed(() => {
  if (!stats.value.userCount) return 0
  return Math.min(100, Math.round((stats.value.todayUserCount / stats.value.userCount) * 100))
})

// ============ 图表 refs ============
const extractChartRef = ref()
const categoryChartRef = ref()
const hourlyChartRef = ref()
let extractChart = null
let categoryChart = null
let hourlyChart = null

// ============ 今日用户弹窗 ============
const showTodayUsers = ref(false)
const todayUsers = ref([])
const usersLoading = ref(false)

// ============ 通用深色主题 ============
const darkTooltip = {
  backgroundColor: 'rgba(20, 24, 40, 0.95)',
  borderColor: 'rgba(0, 240, 255, 0.3)',
  borderWidth: 1,
  textStyle: { color: '#e0e6ff' }
}

const darkAxis = {
  axisLine: { lineStyle: { color: 'rgba(120, 140, 200, 0.3)' } },
  axisLabel: { color: '#8892c4' },
  splitLine: { lineStyle: { color: 'rgba(120, 140, 200, 0.1)' } }
}

// ============ 工具 ============
const formatTime = (t) => {
  if (!t) return '-'
  const s = String(t).replace('T', ' ')
  return s.slice(0, 16)
}

// ============ 数据加载 ============
const loadOverview = async () => {
  try {
    stats.value = await getOverview()
  } catch (e) {
    console.error('加载概览失败', e)
  }
}

const loadActiveTrend = async () => {
  try {
    const res = await getActiveTrend(7)
    activeTrend.value = res || {
      dates: [], counts: [], todayCount: 0, yesterdayCount: 0
    }
  } catch (e) {
    console.error('加载活跃趋势失败', e)
  }
}

const loadPeakHour = async () => {
  try {
    const res = await getPeakHour()
    peakHour.value = res || { hour: null, count: 0 }
  } catch (e) {
    console.error('加载峰值时段失败', e)
  }
}

const loadTodayUsers = async () => {
  usersLoading.value = true
  try {
    const res = await getTodayActiveUsers(1, 100)
    todayUsers.value = res.records || []
  } catch (e) {
    console.error('加载今日用户失败', e)
  } finally {
    usersLoading.value = false
  }
}

// 可抽取题目趋势
const loadExtractableTrend = async () => {
  try {
    const data = await getExtractableTrend(extractDays.value)
    if (!extractChart) return

    extractChart.setOption({
      tooltip: { ...darkTooltip, trigger: 'axis' },
      legend: {
        data: ['国考', '省考', '事业编'],
        textStyle: { color: '#8892c4' },
        top: 0
      },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: data.dates, ...darkAxis, boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1, ...darkAxis },
      series: [
        {
          name: '国考',
          type: 'line',
          smooth: true,
          data: data.guokao,
          itemStyle: { color: '#00f0ff' },
          lineStyle: { width: 3, shadowColor: '#00f0ff', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.35)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0)' }
            ])
          }
        },
        {
          name: '省考',
          type: 'line',
          smooth: true,
          data: data.shengkao,
          itemStyle: { color: '#7c4dff' },
          lineStyle: { width: 3, shadowColor: '#7c4dff', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124, 77, 255, 0.35)' },
              { offset: 1, color: 'rgba(124, 77, 255, 0)' }
            ])
          }
        },
        {
          name: '事业编',
          type: 'line',
          smooth: true,
          data: data.shiye,
          itemStyle: { color: '#00ff9d' },
          lineStyle: { width: 3, shadowColor: '#00ff9d', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 255, 157, 0.35)' },
              { offset: 1, color: 'rgba(0, 255, 157, 0)' }
            ])
          }
        }
      ]
    })
  } catch (e) {
    console.error('加载可抽取题目趋势失败', e)
  }
}

// ★ 今日各时段活跃度
const loadHourlyActive = async () => {
  try {
    const data = await getTodayHourlyActive()
    if (!hourlyChart) return

    const counts = data.counts || []
    const maxCount = Math.max(...counts, 1)

    hourlyChart.setOption({
      tooltip: {
        ...darkTooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0]
          return `${p.name}<br/>活跃用户：<b style="color:#00f0ff">${p.value}</b>`
        }
      },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: data.hours,
        ...darkAxis,
        axisLabel: {
          color: '#8892c4',
          fontSize: 11,
          // 只显示偶数小时（间隔显示）
          interval: 1
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        ...darkAxis
      },
      series: [
        {
          name: '活跃用户',
          type: 'bar',
          data: counts.map((v) => ({
            value: v,
            itemStyle: {
              color: v === maxCount
                ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#ff4d94' },
                    { offset: 1, color: 'rgba(255, 77, 148, 0.2)' }
                  ])
                : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#00f0ff' },
                    { offset: 1, color: 'rgba(0, 240, 255, 0.15)' }
                  ]),
              borderRadius: [6, 6, 0, 0],
              shadowColor: v === maxCount ? '#ff4d94' : '#00f0ff',
              shadowBlur: v === maxCount ? 16 : 6
            }
          })),
          barWidth: '60%'
        }
      ]
    })
  } catch (e) {
    console.error('加载今日时段活跃失败', e)
  }
}

const loadCategory = async () => {
  const data = await getCategoryDist()
  if (!categoryChart) return
  categoryChart.setOption({
    tooltip: { ...darkTooltip, trigger: 'item' },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: { color: '#8892c4' }
    },
    series: [
      {
        name: '题目分类',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#0a0e1a', borderWidth: 3 },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#8892c4',
          fontSize: 12
        },
        labelLine: { lineStyle: { color: '#8892c4' } },
        data: data,
        color: ['#00f0ff', '#7c4dff', '#00ff9d', '#ff4d94', '#ffaa33', '#666']
      }
    ]
  })
}

// ============ 初始化 ============
const initCharts = () => {
  extractChart = echarts.init(extractChartRef.value)
  categoryChart = echarts.init(categoryChartRef.value)
  hourlyChart = echarts.init(hourlyChartRef.value)
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  extractChart?.resize()
  categoryChart?.resize()
  hourlyChart?.resize()
}

watch(showTodayUsers, (v) => {
  if (v) loadTodayUsers()
})

onMounted(async () => {
  await nextTick()
  initCharts()
  await Promise.all([
    loadOverview(),
    loadActiveTrend(),
    loadPeakHour(),
    loadExtractableTrend(),
    loadHourlyActive(),
    loadCategory()
  ])
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  extractChart?.dispose()
  categoryChart?.dispose()
  hourlyChart?.dispose()
})
</script>

<style scoped>
/* ============ 整体深色背景 ============ */
.dashboard {
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(ellipse at top, #0d1428 0%, #050810 80%);
  color: #e0e6ff;
  box-sizing: border-box;
}

/* ============ KPI 卡片 ============ */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.kpi-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(20, 28, 48, 0.9), rgba(15, 20, 38, 0.9));
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.kpi-card:hover {
  border-color: rgba(0, 240, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 240, 255, 0.15);
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.kpi-info {
  flex: 1;
  min-width: 0;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 20px currentColor;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value-sm {
  font-size: 24px !important;
  letter-spacing: 0;
}

.kpi-label {
  font-size: 13px;
  color: #8892c4;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.kpi-glow {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.4;
}

/* ============ 图表卡片 ============ */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: linear-gradient(135deg, rgba(20, 28, 48, 0.9), rgba(15, 20, 38, 0.9));
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s;
}

.chart-card:hover {
  border-color: rgba(0, 240, 255, 0.4);
  box-shadow: 0 8px 30px rgba(0, 240, 255, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #e0e6ff;
  position: relative;
  padding-left: 12px;
}

.chart-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #00f0ff, #7c4dff);
  border-radius: 2px;
  box-shadow: 0 0 10px #00f0ff;
}

.chart-body {
  width: 100%;
  height: 280px;
}

.hourly-hint {
  font-size: 12px;
  color: #5a6288;
  letter-spacing: 1px;
}

/* ============ 今日数据双环 ============ */
.today-panel {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 280px;
  gap: 30px;
}

.circle-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.circle-progress {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color) var(--percent),
    rgba(120, 140, 200, 0.12) var(--percent)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.5s ease;
  filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.15));
}

.circle-progress::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #141c30, #0f1426);
}

.circle-inner {
  position: relative;
  z-index: 1;
  text-align: center;
}

.circle-num {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
}

.circle-num.purple {
  background: linear-gradient(135deg, #7c4dff, #b47cff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.circle-label {
  font-size: 13px;
  color: #8892c4;
  margin-top: 8px;
  letter-spacing: 1px;
}

.circle-desc {
  font-size: 12px;
  color: #5a6288;
}

.highlight {
  color: #00f0ff;
  font-weight: 700;
}

.highlight.purple {
  color: #b47cff;
}

/* ============ 今日用户弹窗 ============ */
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(0, 240, 255, 0.3);
  flex-shrink: 0;
}

.mini-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 240, 255, 0.1);
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-tip {
  font-size: 13px;
  color: #8892c4;
}

/* ============ Element Plus 深色适配 ============ */
:deep(.el-radio-button__inner) {
  background: rgba(20, 28, 48, 0.8);
  border-color: rgba(0, 240, 255, 0.3);
  color: #8892c4;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  border-color: #00f0ff;
  color: #fff;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
}

/* 弹窗深色适配 */
:deep(.dark-dialog) {
  background: linear-gradient(135deg, #141c30, #0f1426);
  border: 1px solid rgba(0, 240, 255, 0.25);
}

:deep(.dark-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
}

:deep(.dark-dialog .el-dialog__title) {
  color: #e0e6ff;
}

:deep(.dark-dialog .el-dialog__body) {
  color: #e0e6ff;
}

:deep(.dark-dialog .el-table),
:deep(.dark-dialog .el-table tr),
:deep(.dark-dialog .el-table th.el-table__cell) {
  background: transparent;
}

:deep(.dark-dialog .el-table th.el-table__cell) {
  color: #8892c4;
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
}

:deep(.dark-dialog .el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(0, 240, 255, 0.08);
  color: #c4cce6;
}

:deep(.dark-dialog .el-table__body tr:hover > td.el-table__cell) {
  background: rgba(0, 240, 255, 0.05) !important;
}

/* ============ 响应式 ============ */
@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>