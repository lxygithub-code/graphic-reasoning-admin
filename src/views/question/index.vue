<template>
  <div>
    <!-- 搜索栏 -->
   <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="套卷">
          <el-input v-model="query.source" placeholder="输入关键词模糊搜索" clearable style="width: 220px"
            @keyup.enter="loadSources" @clear="loadSources">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="考试">
          <el-select v-model="query.examType" placeholder="全部" clearable style="width: 140px"
            @change="handleQueryExamTypeChange">
            <el-option v-for="item in examTypeL1Options" :key="item.dictValue" :label="item.dictLabel"
              :value="item.dictValue" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="queryL2Options.length" label="子类">
          <el-select v-model="query.examSubType" placeholder="全部" clearable style="width: 100px" @change="loadSources">
            <el-option v-for="item in queryL2Options" :key="item.dictValue" :label="item.dictLabel"
              :value="item.dictValue" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadSources">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>

        <el-form-item style="float: right">
          <el-button type="primary" @click="openEdit()">新增题目</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 套卷列表 -->
    <el-card class="table-card">
      <el-table ref="sourceTableRef" :data="sourceList" v-loading="loading" row-key="rowKey" @row-click="handleRowClick"
        @expand-change="handleExpandChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-wrap">
              <el-table :data="row.questions || []" v-loading="row.loading" size="small" border
                :empty-text="row.loading ? '加载中...' : '该套卷暂无题目'">
                <el-table-column type="index" width="60" label="序号" align="center" />
                <el-table-column prop="content" label="题目内容" show-overflow-tooltip />
                <el-table-column prop="category" label="类型" width="160" />
               <el-table-column label="考试" width="140" align="center">
                  <template #default="{ row: q }">
                    {{ examTypeLabel(q.examType) }}
                    <template v-if="q.examSubType">-{{ q.examSubType }}类</template>
                  </template>
                </el-table-column>
                <el-table-column prop="difficulty" label="难度" width="80" align="center" />
                <el-table-column label="操作" width="200" fixed="right" align="center">
                  <template #default="{ row: q }">
                    <el-button link type="primary" size="small" @click.stop="openDetail(q)">查看</el-button>
                    <el-divider direction="vertical" />
                    <el-button link type="primary" size="small" @click.stop="openEdit(q)">编辑</el-button>
                    <el-divider direction="vertical" />
                    <el-button link type="danger" size="small" @click.stop="handleDelete(q)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="label" label="套卷名称" min-width="240">
          <template #default="{ row }">
            <div class="source-cell">
              <el-icon><Files /></el-icon>
              <span class="source-name">{{ row.label }}</span>
              <el-tag v-if="!row.source" type="warning" size="small" effect="plain">未分类</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="题目数量" width="140" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.count }} 题</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="toggleExpand(row)">
              {{ row.expanded ? '收起' : '展开' }}
            </el-button>
            <el-divider direction="vertical" />
            <el-button link type="primary" size="small" @click.stop="addQuestionToSource(row.source)">新增题目</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无套卷" />
        </template>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑题目' : '新增题目'" width="700px"
      :close-on-click-modal="false" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="题目内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>

        <el-form-item label="题目图片">
          <div class="form-block">
            <div class="image-uploader">
              <el-upload :http-request="handleUpload" :show-file-list="false" accept="image/*"
                :before-upload="beforeUpload" class="image-upload">
                <img v-if="form.imageUrl" :src="fullUrl(form.imageUrl)" class="upload-img" alt=""
                  @error="form.imageUrl = ''" />
                <div v-else class="upload-placeholder">
                  <el-icon :size="24">
                    <Plus />
                  </el-icon>
                  <span>点击上传</span>
                </div>
              </el-upload>

              <el-button size="small" type="primary" plain @click="handleScreenshot('question')">
                <el-icon>
                  <Camera />
                </el-icon>
                <span style="margin-left: 4px">截图上传</span>
              </el-button>

              <el-button v-if="form.imageUrl" size="small" type="danger" plain @click="form.imageUrl = ''">
                清除
              </el-button>
            </div>
            <div class="upload-tip">
              截图上传：点击按钮唤起系统截图工具（或直接按 Win+Shift+S），截图后按 Ctrl+V 自动上传
            </div>
          </div>
        </el-form-item>

        <el-form-item label="选项" prop="options">
          <div class="form-block">
            <div v-for="(opt, idx) in form.options" :key="idx" class="option-row">
              <el-input v-model="opt.key" placeholder="A" style="width: 60px" />

              <el-select v-model="opt.type" style="width: 100px; margin: 0 8px">
                <el-option label="文字" value="text" />
                <el-option label="图片" value="image" />
              </el-select>

              <el-input v-if="opt.type === 'text'" v-model="opt.value" placeholder="选项内容" style="flex: 1" />

              <div v-else class="option-image-upload">
                <el-upload :http-request="({ file }) => handleOptionUpload(file, opt)" :show-file-list="false"
                  accept="image/*" class="option-upload">
                  <img v-if="opt.value" :src="fullUrl(opt.value)" class="option-thumb" alt="" />
                  <el-icon v-else class="option-upload-icon">
                    <Plus />
                  </el-icon>
                </el-upload>
                <el-button size="small" type="primary" plain @click="handleScreenshot('option', idx)">
                  截图
                </el-button>
                <el-button v-if="opt.value" link type="danger" size="small" @click="opt.value = ''">
                  清除
                </el-button>
              </div>

              <el-button type="danger" :icon="Delete" circle style="margin-left: 8px"
                @click="form.options.splice(idx, 1)" />
            </div>
            <el-button link type="primary" @click="addOption" style="margin-top: 4px">
              + 添加选项
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="正确答案" prop="correctOption">
          <el-input v-model="form.correctOption" placeholder="如 A" style="width: 120px" />
        </el-form-item>

        <!-- 分平台解析 -->
        <el-form-item label="分平台解析">
          <div class="form-block">
            <div v-for="(item, idx) in form.analyses" :key="idx" class="analysis-row">
              <el-select v-model="item.platform" placeholder="平台" style="width: 110px; flex-shrink: 0">
                <el-option v-for="p in platformOptions" :key="p.dictValue" :label="p.dictLabel" :value="p.dictValue" />
              </el-select>

              <el-select v-model="item.type" style="width: 90px; margin: 0 8px; flex-shrink: 0">
                <el-option label="文字" value="text" />
                <el-option label="图片" value="image" />
              </el-select>

              <el-input v-if="item.type === 'text'" v-model="item.content" type="textarea" :rows="2"
                placeholder="该平台的解析内容" style="flex: 1" />

              <div v-else class="analysis-image-upload">
                <el-upload :http-request="({ file }) => handleAnalysisUpload(file, item)" :show-file-list="false"
                  accept="image/*" class="analysis-upload">
                  <img v-if="item.content" :src="fullUrl(item.content)" class="analysis-thumb" alt="" />
                  <div v-else class="analysis-upload-icon">
                    <el-icon>
                      <Plus />
                    </el-icon>
                  </div>
                </el-upload>
                <el-button size="small" type="primary" plain
                  @click="handleScreenshot('analysis', idx)">截图</el-button>
                <el-button v-if="item.content" link type="danger" size="small" @click="item.content = ''">清除</el-button>
              </div>

              <el-button type="danger" :icon="Delete" circle style="margin-left: 8px"
                @click="form.analyses.splice(idx, 1)" />
            </div>

            <el-button link type="primary" @click="addAnalysis" style="margin-top: 4px">
              + 添加平台解析
            </el-button>
          </div>
        </el-form-item>

        <!-- ★ 题目类型：改为级联选择器，支持任意层级 -->
        <el-form-item label="题目类型" prop="category">
          <el-cascader
            v-model="form.categoryPath"
            :options="categoryTree"
            :props="cascaderProps"
            placeholder="请选择题目类型（可任选一级）"
            clearable
            filterable
            style="width: 100%"
            @change="handleCategoryChange"
          />
        </el-form-item>

        <el-form-item label="考试类型" prop="examType">
          <div class="category-select-group">
            <el-select v-model="form.examType" placeholder="考试类型" clearable style="width: 160px"
              @change="handleExamTypeChange">
              <el-option v-for="item in examTypeL1Options" :key="item.dictValue" :label="item.dictLabel"
                :value="item.dictValue" />
            </el-select>

            <el-select v-if="examTypeL2Options.length" v-model="form.examSubType" placeholder="选择子类" clearable
              style="width: 120px">
              <el-option v-for="item in examTypeL2Options" :key="item.dictValue" :label="item.dictLabel"
                :value="item.dictValue" />
            </el-select>
          </div>
        </el-form-item>

        <el-form-item label="题目来源" prop="source">
          <el-select v-model="form.source" placeholder="请选择套卷" filterable clearable style="width: 100%">
            <el-option v-for="item in sourceDictOptions" :key="item.dictValue" :label="item.dictLabel"
              :value="item.dictValue" />
          </el-select>
        </el-form-item>

        <el-form-item label="难度">
          <el-rate v-model="form.difficulty" :max="5" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="题目详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="难度">{{ detail.difficulty }}</el-descriptions-item>
        <el-descriptions-item label="题目类型">{{ detail.category }}</el-descriptions-item>
       <el-descriptions-item label="考试类型">
          {{ examTypeLabel(detail.examType) }}
          <template v-if="detail.examSubType">-{{ detail.examSubType }}类</template>
        </el-descriptions-item>
        <el-descriptions-item label="来源" :span="2">{{ detail.source || '-' }}</el-descriptions-item>
        <el-descriptions-item label="题目内容" :span="2">
          <div style="white-space: pre-wrap">{{ detail.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="题目图片" :span="2">
          <img v-if="detail.imageUrl" :src="fullUrl(detail.imageUrl)" style="max-width: 240px; border-radius: 6px"
            alt="" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="默认解析" :span="2">
          <div style="white-space: pre-wrap">{{ detail.analysis || '-' }}</div>
        </el-descriptions-item>

        <!-- ★ 分平台解析（区分文字/图片） -->
        <el-descriptions-item v-if="detail.analyses && detail.analyses.length" label="平台解析" :span="2">
          <div v-for="(a, i) in detail.analyses" :key="i" class="detail-analysis-item">
            <el-tag size="small" effect="plain" type="warning" style="margin-bottom: 6px">
              {{ platformLabel(a.platform) }}
            </el-tag>

            <!-- 文字 -->
            <div v-if="a.type !== 'image'" class="detail-analysis-content">{{ a.content }}</div>

            <!-- 图片 -->
            <img v-else :src="fullUrl(a.content)" class="detail-analysis-img" alt="" />
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-options-title">选项</div>
      <div class="detail-options">
        <div v-for="(opt, idx) in detail.options" :key="idx" class="detail-option-item"
          :class="{ correct: opt.key === detail.correctOption }">
          <span class="detail-option-key">{{ opt.key }}.</span>
          <span v-if="opt.type === 'text'">{{ opt.value }}</span>
          <img v-else :src="fullUrl(opt.value)" style="max-width: 200px; border-radius: 6px" alt="" />
          <el-tag v-if="opt.key === detail.correctOption" type="success" size="small" style="margin-left: 8px">
            正确答案
          </el-tag>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Camera, Files, Search } from '@element-plus/icons-vue'
import {
  saveQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionDetail,
  listQuestionSources,
  listQuestionsBySource
} from '@/api/question'
import { uploadImage } from '@/api/upload'
import { treeDict, listDict } from '@/api/dict'

const BACKEND = 'http://localhost:8866'
const fullUrl = (u) => (u ? (u.startsWith('http') ? u : BACKEND + u) : '')

// ==================== 列表 ====================
const loading = ref(false)
const sourceList = ref([])
const sourceTableRef = ref()
const query = reactive({
  source: '',
  examType: '',
  examSubType: ''
})

const detailVisible = ref(false)
const detail = ref({
  id: null, content: '', options: [], correctOption: '',
  category: '', examType: '', source: '', difficulty: 1, imageUrl: '',
  analysis: '', analyses: []
})

// ==================== 字典 ====================
const categoryTree = ref([])
const categoryL1Options = ref([])
const categoryLoaded = ref(false)
const examTypeOptions = ref([])
const sourceDictOptions = ref([])
const platformOptions = ref([])
const examTypeL1Options = ref([])
const examTypeL2Options = ref([])
const examTypeTree = ref([])
const queryL2Options = ref([])

// ★ 级联选择器配置：允许选任意层级，返回完整路径数组
const cascaderProps = {
  value: 'dictValue',
  label: 'dictLabel',
  children: 'children',
  checkStrictly: true,
  emitPath: true
}

const loadPlatformOptions = async () => {
  platformOptions.value = await listDict('analysis_platform')
}

const loadExamTypeOptions = async () => {
  const tree = await treeDict('exam_type')
  examTypeTree.value = tree || []
  examTypeL1Options.value = tree || []

  const flat = []
  const walk = (arr) => {
    arr.forEach(item => {
      flat.push({ dictValue: item.dictValue, dictLabel: item.dictLabel })
      if (item.children) walk(item.children)
    })
  }
  walk(tree || [])
  examTypeOptions.value = flat
}

/** 考试类型一级变化 → 加载二级 */
const handleExamTypeChange = (val) => {
  form.examSubType = ''
  if (!val) {
    examTypeL2Options.value = []
    return
  }
  const node = examTypeTree.value.find(n => n.dictValue === val)
  examTypeL2Options.value = node?.children || []
}

const loadSourceDict = async () => {
  sourceDictOptions.value = await listDict('question_source')
}

const examTypeLabel = (val) => {
  const item = examTypeOptions.value.find(o => o.dictValue === val)
  return item ? item.dictLabel : (val || '-')
}

const loadCategoryOptions = async () => {
  if (categoryLoaded.value) return categoryTree.value
  const tree = await treeDict('question_category')
  categoryTree.value = tree
  categoryL1Options.value = tree
  categoryLoaded.value = true
  return tree
}

const handleQueryExamTypeChange = (val) => {
  query.examSubType = ''
  if (!val) {
    queryL2Options.value = []
    loadSources()
    return
  }
  const node = examTypeTree.value.find(n => n.dictValue === val)
  queryL2Options.value = node?.children || []
  loadSources()
}

const platformLabel = (val) => {
  const item = platformOptions.value.find(o => o.dictValue === val)
  return item ? item.dictLabel : (val || '-')
}

// ==================== 套卷列表加载 ====================
const loadSources = async () => {
  loading.value = true
  try {
    const stats = await listQuestionSources({
      examType: query.examType || undefined,
      examSubType: query.examSubType || undefined,
      keyword: query.source || undefined
    })

    const statMap = new Map((stats || []).map(s => [s.source, s]))

    const dictList = sourceDictOptions.value.length
      ? sourceDictOptions.value
      : await listDict('question_source')

    const merged = []
    const seen = new Set()

    dictList.forEach(d => {
      const stat = statMap.get(d.dictValue)
      if (!stat) return

      merged.push({
        rowKey: d.dictValue,
        source: d.dictValue,
        label: d.dictLabel,
        count: stat.count,
        examType: stat.examType,
        examSubType: stat.examSubType
      })
      seen.add(d.dictValue)
    })

    ;(stats || []).forEach(s => {
      if (!seen.has(s.source)) {
        const key = s.source || '__unclassified__'
        merged.push({
          rowKey: key,
          source: s.source || '',
          label: s.source || '未分类',
          count: s.count,
          examType: s.examType || '',
          examSubType: s.examSubType || ''
        })
        seen.add(s.source)
      }
    })

    const oldMap = new Map(sourceList.value.map(s => [s.rowKey, s]))
    sourceList.value = merged.map(s => {
      const old = oldMap.get(s.rowKey)
      if (old && old.expanded) {
        return { ...s, questions: old.questions, loading: false, expanded: true }
      }
      return { ...s, questions: null, loading: false, expanded: false }
    })
  } finally {
    loading.value = false
  }
}
const handleRowClick = (row) => {
  toggleExpand(row)
}

const toggleExpand = async (row) => {
  const table = sourceTableRef.value
  if (!table) return

  if (row.expanded) {
    table.toggleRowExpansion(row, false)
    return
  }

  if (!row.questions) {
    row.loading = true
    table.toggleRowExpansion(row, true)
    try {
      const data = await listQuestionsBySource(row.source || '')
      row.questions = data || []
    } catch (e) {
      ElMessage.error('加载题目失败')
      table.toggleRowExpansion(row, false)
    } finally {
      row.loading = false
    }
  } else {
    table.toggleRowExpansion(row, true)
  }
}

const handleExpandChange = (row, expandedRows) => {
  row.expanded = expandedRows.includes(row)
}

const refreshRowQuestions = async (row) => {
  if (!row) return
  if (!row.expanded) {
    row.questions = null
    return
  }
  row.loading = true
  try {
    row.questions = await listQuestionsBySource(row.source || '')
  } finally {
    row.loading = false
  }
}

const addQuestionToSource = async (source) => {
  await openEdit(null, source || '')
}

// ==================== 搜索栏 ====================
const resetQuery = () => {
  query.source = ''
  query.examType = ''
  query.examSubType = ''
  queryL2Options.value = []
  loadSources()
}

// ==================== 表单 ====================
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  content: '',
  options: [],
  correctOption: '',
  category: '',
  categoryPath: [],
  examType: '',
  examSubType: '',
  source: '',
  difficulty: 1,
  imageUrl: '',
  analysis: '',
  analyses: []
})

const rules = {
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  correctOption: [{ required: true, message: '请输入正确答案', trigger: 'blur' }],
  source: [{ required: true, message: '请选择套卷', trigger: 'change' }]
}

/** 级联选择变化 → 把路径 label 拼成 category 文本 */
const handleCategoryChange = (path) => {
  if (!path || !path.length) {
    form.category = ''
    return
  }
  const labels = []
  let nodes = categoryTree.value
  for (const val of path) {
    const node = nodes.find(n => n.dictValue === val)
    if (node) {
      labels.push(node.dictLabel)
      nodes = node.children || []
    }
  }
  form.category = labels.join('/')
}

/** 从 category 文本反查路径（编辑回显用） */
const buildCategoryPath = (categoryText) => {
  if (!categoryText) return []
  const labels = categoryText.split('/').filter(Boolean)
  const path = []
  let nodes = categoryTree.value
  for (const label of labels) {
    const node = nodes.find(n => n.dictLabel === label)
    if (node) {
      path.push(node.dictValue)
      nodes = node.children || []
    } else {
      break
    }
  }
  return path
}

const openEdit = async (row, defaultSource = '') => {
  await loadCategoryOptions()
  if (!examTypeOptions.value.length) await loadExamTypeOptions()
  if (!platformOptions.value.length) await loadPlatformOptions()

  if (row) {
    const data = await getQuestionDetail(row.id)
    Object.assign(form, {
      ...data,
      options: JSON.parse(JSON.stringify(data.options || [])).map(o => ({
        key: o.key,
        type: o.type || 'text',
        value: o.value
      })),
      categoryPath: buildCategoryPath(data.category),
      examType: data.examType || '',
      examSubType: data.examSubType || '',
      analyses: (data.analyses || []).map(a => ({
        platform: a.platform,
        type: a.type || 'text',
        content: a.content
      }))
    })
  } else {
    Object.assign(form, {
      id: null,
      content: '',
      options: [
        { key: 'A', type: 'text', value: '' },
        { key: 'B', type: 'text', value: '' },
        { key: 'C', type: 'text', value: '' },
        { key: 'D', type: 'text', value: '' }
      ],
      correctOption: '',
      category: '',
      categoryPath: [],
      examType: '',
      examSubType: '',
      source: defaultSource,
      difficulty: 1,
      imageUrl: '',
      analysis: '',
      analyses: []
    })
  }

  dialogVisible.value = true
}

const addOption = () => {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F']
  const nextKey = keys[form.options.length] || 'X'
  form.options.push({ key: nextKey, type: 'text', value: '' })
}

const addAnalysis = () => {
  form.analyses.push({
    platform: platformOptions.value[0]?.dictValue || '',
    type: 'text',
    content: ''
  })
}

// ==================== 图片上传 ====================
const uploadFile = async (file) => {
  const url = await uploadImage(file)
  form.imageUrl = url
  ElMessage.success('上传成功')
}

const beforeUpload = (file) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片不能超过 5MB')
    return false
  }
  return true
}

const handleUpload = async ({ file }) => {
  await uploadFile(file)
}

// ★ 截图上传：记录目标位置
const screenshotTarget = ref(null)

const handleScreenshot = (type, index = 0) => {
  screenshotTarget.value = { type, index }

  try {
    const a = document.createElement('a')
    a.href = 'ms-screenclip:'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (e) {
    console.warn('唤起截图工具失败，请手动按 Win+Shift+S', e)
  }
  ElMessage({
    message: '截图完成后按 Ctrl+V 粘贴，图片会自动上传',
    type: 'info',
    duration: 4000
  })
}

// ★ 粘贴事件：根据 target 分发
const handlePaste = async (e) => {
  if (!dialogVisible.value) return
  const items = e.clipboardData?.items
  if (!items || items.length === 0) return

  let imageItem = null
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      imageItem = item
      break
    }
  }
  if (!imageItem) return

  e.preventDefault()
  const blob = imageItem.getAsFile()
  if (!blob) return

  const file = new File([blob], `screenshot_${Date.now()}.png`,
    { type: blob.type || 'image/png' })
  if (!beforeUpload(file)) return

  const target = screenshotTarget.value
  if (!target) {
    ElMessage.warning('请先点击要上传到的"截图"按钮')
    return
  }

  try {
    const url = await uploadImage(file)

    if (target.type === 'question') {
      form.imageUrl = url
    } else if (target.type === 'option') {
      const opt = form.options[target.index]
      if (opt) {
        opt.type = 'image'
        opt.value = url
      }
    } else if (target.type === 'analysis') {
      const a = form.analyses[target.index]
      if (a) {
        a.type = 'image'
        a.content = url
      }
    }

    ElMessage.success('截图上传成功')
    screenshotTarget.value = null
  } catch (err) {
    ElMessage.error('截图上传失败')
  }
}

const handleOptionUpload = async (file, opt) => {
  const url = await uploadImage(file)
  opt.value = url
  opt.type = 'image'
  ElMessage.success('上传成功')
}

const handleAnalysisUpload = async (file, item) => {
  const url = await uploadImage(file)
  item.content = url
  item.type = 'image'
  ElMessage.success('上传成功')
}

// ==================== 提交 ====================
const handleSubmit = async () => {
  await formRef.value.validate()

  const currentSource = form.source

  if (form.id) {
    await updateQuestion(form)
    ElMessage.success('修改成功')
  } else {
    await saveQuestion(form)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false

  await loadSources()

  const row = sourceList.value.find(s => s.source === currentSource)
  if (row) await refreshRowQuestions(row)
}

const openDetail = async (row) => {
  const data = await getQuestionDetail(row.id)
  detail.value = {
    ...data,
    options: JSON.parse(JSON.stringify(data.options || [])).map(o => ({
      key: o.key,
      type: o.type || 'text',
      value: o.value
    })),
    analyses: (data.analyses || []).map(a => ({
      platform: a.platform,
      type: a.type || 'text',
      content: a.content
    }))
  }
  detailVisible.value = true
}

// ==================== 删除 ====================
const handleDelete = async (row) => {
  const text = (row.content || '').slice(0, 20)
  await ElMessageBox.confirm(`确定删除题目「${text}...」吗？`, '提示', { type: 'warning' })
  await deleteQuestion(row.id)
  ElMessage.success('删除成功')

  await loadSources()
  const sourceRow = sourceList.value.find(s => s.source === row.source)
  if (sourceRow) await refreshRowQuestions(sourceRow)
}

// ==================== 初始化 ====================
onMounted(async () => {
  document.addEventListener('paste', handlePaste)
  await loadCategoryOptions()
  await loadExamTypeOptions()
  await loadSourceDict()
  await loadPlatformOptions()
  await loadSources()
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.table-card { padding: 0; }

/* ==================== 表单块通用 ==================== */
.form-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-form-item__content) {
  border: none !important;
  background: transparent !important;
  align-items: flex-start;
  line-height: normal;
}

.image-upload,
.option-upload,
.analysis-upload {
  display: inline-block;
  line-height: 0;
  font-size: 0;
}

.image-upload :deep(.el-upload),
.option-upload :deep(.el-upload),
.analysis-upload :deep(.el-upload) {
  line-height: 0;
  font-size: 0;
  background: transparent;
  border: none;
  padding: 0;
}

/* ==================== 题干图片上传 ==================== */
.image-uploader {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.upload-img {
  display: block;
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  border: 1px dashed rgba(0, 240, 255, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #8892c4;
  cursor: pointer;
  gap: 6px;
  transition: all 0.2s;
}

.upload-placeholder:hover {
  border-color: #00f0ff;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.08);
}

.upload-tip {
  font-size: 12px;
  color: #8892c4;
  line-height: 1.6;
}

/* ==================== 选项 ==================== */
.option-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.option-image-upload {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-thumb {
  display: block;
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.option-upload-icon {
  width: 60px;
  height: 60px;
  border: 1px dashed rgba(0, 240, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #8892c4;
  cursor: pointer;
}

/* ==================== 分平台解析 ==================== */
.analysis-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  width: 100%;
}

.analysis-image-upload {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-thumb {
  display: block;
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(0, 240, 255, 0.2);
  cursor: pointer;
}

.analysis-upload-icon {
  width: 80px;
  height: 60px;
  border: 1px dashed rgba(0, 240, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8892c4;
  font-size: 20px;
  cursor: pointer;
}

/* ==================== 类型下拉组 ==================== */
.category-select-group {
  display: flex;
  gap: 12px;
  width: 100%;
}

/* ==================== 详情弹窗 ==================== */
.detail-options-title {
  margin: 16px 0 8px;
  font-weight: bold;
  font-size: 14px;
  color: #e0e6ff;
}

.detail-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(15, 22, 40, 0.6);
  color: #e0e6ff;
  border-radius: 6px;
  font-size: 14px;
}

.detail-option-item.correct {
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid rgba(0, 255, 157, 0.4);
}

.detail-option-key {
  font-weight: bold;
  margin-right: 8px;
  color: #00f0ff;
}

.detail-analysis-item {
  margin-bottom: 12px;
}

.detail-analysis-content {
  margin-top: 6px;
  font-size: 13px;
  color: #c4cce6;
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-analysis-img {
  display: block;
  margin-top: 6px;
  max-width: 320px;
  border-radius: 6px;
  cursor: pointer;
}

/* ==================== 套卷列表 ==================== */
.expand-wrap {
  padding: 12px 24px 12px 60px;
  background: transparent;
}

.source-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.source-name {
  font-weight: 600;
  color: #e0e6ff;
}
</style>