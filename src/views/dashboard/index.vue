<template>
  <div class="dashboard">
    <!-- 顶部 4 个核心指标卡 -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="(k, i) in kpiList" :key="i">
        <div class="kpi-icon" :style="{ background: k.color }">
          <el-icon :size="28"><component :is="k.icon" /></el-icon>
        </div>
        <div class="kpi-info">
          <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
        <div class="kpi-glow" :style="{ background: k.color }"></div>
      </div>
    </div>

    <!-- 第二行：增量趋势 + 活跃统计 -->
    <div class="chart-row">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">近 7 天增量趋势</span>
          <el-radio-group v-model="growthDays" size="small" @change="loadGrowth">
            <el-radio-button :value="7">7天</el-radio-button>
            <el-radio-button :value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="growthChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">活跃用户 & 刷题量</span>
          <el-radio-group v-model="activeDays" size="small" @change="loadActive">
            <el-radio-button :value="7">7天</el-radio-button>
            <el-radio-button :value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="activeChartRef" class="chart-body"></div>
      </div>
    </div>

    <!-- 第三行：题目分类分布 + 今日数据 -->
    <div class="chart-row">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">题库分类分布</span>
        </div>
        <div ref="categoryChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">今日实时</span>
        </div>
        <div class="today-panel">
          <div class="today-item">
            <div class="today-num">{{ stats.todayUserCount }}</div>
            <div class="today-label">今日新增用户</div>
            <div class="today-bar">
              <div class="today-bar-inner" :style="{ width: todayUserPercent + '%' }"></div>
            </div>
          </div>
          <div class="today-item">
            <div class="today-num">{{ stats.todayPracticeCount }}</div>
            <div class="today-label">今日练习次数</div>
            <div class="today-bar">
              <div class="today-bar-inner" :style="{ width: todayPracticePercent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { User, Document, DataLine, TrendCharts } from '@element-plus/icons-vue'
import {
  getOverview,
  getGrowth,
  getActive,
  getCategoryDist
} from '@/api/stats'

const stats = ref({
  userCount: 0,
  questionCount: 0,
  practiceCount: 0,
  avgAccuracy: 0,
  todayUserCount: 0,
  todayPracticeCount: 0
})

const growthDays = ref(7)
const activeDays = ref(7)

const kpiList = computed(() => [
  { label: '用户总数', value: stats.value.userCount, color: '#00f0ff', icon: User },
  { label: '题目总数', value: stats.value.questionCount, color: '#7c4dff', icon: Document },
  { label: '练习总次数', value: stats.value.practiceCount, color: '#00ff9d', icon: DataLine },
  { label: '平均正确率', value: stats.value.avgAccuracy + '%', color: '#ff4d94', icon: TrendCharts }
])

// 今日百分比（相对于总数）
const todayUserPercent = computed(() => {
  if (!stats.value.userCount) return 0
  return Math.min(100, (stats.value.todayUserCount / stats.value.userCount) * 100)
})
const todayPracticePercent = computed(() => {
  if (!stats.value.practiceCount) return 0
  return Math.min(100, (stats.value.todayPracticeCount / stats.value.practiceCount) * 100)
})

const growthChartRef = ref()
const activeChartRef = ref()
const categoryChartRef = ref()
let growthChart = null
let activeChart = null
let categoryChart = null

// ============ 通用深色主题配置 ============
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

// ============ 加载数据 ============
const loadOverview = async () => {
  stats.value = await getOverview()
}

const loadGrowth = async () => {
  const data = await getGrowth(growthDays.value)
  if (!growthChart) return
  growthChart.setOption({
    tooltip: { ...darkTooltip, trigger: 'axis' },
    legend: {
      data: ['新增用户', '新增题目', '新增练习'],
      textStyle: { color: '#8892c4' },
      top: 0
    },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: data.dates, ...darkAxis, boundaryGap: false },
    yAxis: { type: 'value', ...darkAxis },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: data.newUsers,
        itemStyle: { color: '#00f0ff' },
        lineStyle: { width: 3, shadowColor: '#00f0ff', shadowBlur: 10 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 240, 255, 0.4)' },
            { offset: 1, color: 'rgba(0, 240, 255, 0)' }
          ])
        }
      },
      {
        name: '新增题目',
        type: 'line',
        smooth: true,
        data: data.newQuestions,
        itemStyle: { color: '#7c4dff' },
        lineStyle: { width: 3, shadowColor: '#7c4dff', shadowBlur: 10 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(124, 77, 255, 0.4)' },
            { offset: 1, color: 'rgba(124, 77, 255, 0)' }
          ])
        }
      },
      {
        name: '新增练习',
        type: 'line',
        smooth: true,
        data: data.newPractices,
        itemStyle: { color: '#00ff9d' },
        lineStyle: { width: 3, shadowColor: '#00ff9d', shadowBlur: 10 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 255, 157, 0.4)' },
            { offset: 1, color: 'rgba(0, 255, 157, 0)' }
          ])
        }
      }
    ]
  })
}

const loadActive = async () => {
  const data = await getActive(activeDays.value)
  if (!activeChart) return
  activeChart.setOption({
    tooltip: { ...darkTooltip, trigger: 'axis' },
    legend: {
      data: ['活跃用户数', '刷题量'],
      textStyle: { color: '#8892c4' },
      top: 0
    },
    grid: { left: 40, right: 40, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: data.dates, ...darkAxis },
    yAxis: [
      { type: 'value', name: '用户', ...darkAxis },
      { type: 'value', name: '刷题', ...darkAxis }
    ],
    series: [
      {
        name: '活跃用户数',
        type: 'bar',
        data: data.activeUsers,
        barWidth: 16,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ff4d94' },
            { offset: 1, color: 'rgba(255, 77, 148, 0.2)' }
          ]),
          shadowColor: '#ff4d94',
          shadowBlur: 12
        }
      },
      {
        name: '刷题量',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.practiceCount,
        itemStyle: { color: '#00f0ff' },
        lineStyle: { width: 3, shadowColor: '#00f0ff', shadowBlur: 10 }
      }
    ]
  })
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
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0a0e1a',
          borderWidth: 3
        },
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
  growthChart = echarts.init(growthChartRef.value)
  activeChart = echarts.init(activeChartRef.value)
  categoryChart = echarts.init(categoryChartRef.value)

  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  growthChart?.resize()
  activeChart?.resize()
  categoryChart?.resize()
}

onMounted(async () => {
  await nextTick()
  initCharts()
  await Promise.all([
    loadOverview(),
    loadGrowth(),
    loadActive(),
    loadCategory()
  ])
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  growthChart?.dispose()
  activeChart?.dispose()
  categoryChart?.dispose()
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
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 20px currentColor;
}

.kpi-label {
  font-size: 14px;
  color: #8892c4;
  margin-top: 4px;
}

/* 卡片角落发光 */
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

/* ============ 今日实时面板 ============ */
.today-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 280px;
  gap: 40px;
}

.today-item {
  text-align: center;
}

.today-num {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
}

.today-label {
  font-size: 14px;
  color: #8892c4;
  margin: 8px 0 12px;
}

.today-bar {
  height: 8px;
  background: rgba(120, 140, 200, 0.15);
  border-radius: 4px;
  overflow: hidden;
  max-width: 240px;
  margin: 0 auto;
}

.today-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #00f0ff, #7c4dff);
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
  transition: width 0.8s ease;
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