<template>
  <div>
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="分组">
          <el-select
            v-model="query.dictType"
            placeholder="全部分组"
            clearable
            filterable
            style="width: 220px"
            @change="renderTree"
          >
            <el-option
              v-for="t in typeList"
              :key="t.dictType"
              :label="typeLabel(t.dictType)"
              :value="t.dictType"
            >
              <span>{{ typeLabel(t.dictType) }}</span>
              <span style="float: right; color: #8892c4">{{ t.count }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="名称或存储值"
            clearable
            style="width: 200px"
            @keyup.enter="renderTree"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 100px" @change="renderTree">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="renderTree">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="primary" @click="openEdit()">新增字典</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分组树形列表 -->
    <el-card class="table-card">
      <el-table
        ref="tableRef"
        class="dict-table"
        :data="treeData"
        v-loading="loading"
        row-key="rowKey"
        :tree-props="{ children: 'children' }"
        :indent="12"
        @expand-change="handleExpandChange"
      >
        <el-table-column label="名称" min-width="260">
          <template #default="{ row }">
            <!-- 分组节点 -->
            <template v-if="row.isGroup">
              <div class="name-cell">
                <el-icon class="group-icon"><FolderOpened /></el-icon>
                <span class="group-name">{{ typeLabel(row.dictType) }}</span>
                <el-tag size="small" type="info" effect="plain">{{ row.dictType }}</el-tag>
                <el-tag size="small" type="success" effect="plain">{{ row.children.length }} 条</el-tag>
              </div>
            </template>
            <!-- 字典项 -->
            <template v-else>
              <div class="name-cell">
                <span class="dict-label">{{ row.dictLabel }}</span>
                <el-tag size="small" effect="plain" :class="'level-tag-l' + Math.min(row.level || 1, 4)">L{{ row.level
                  }}</el-tag>
                <el-tag v-if="row.status !== 1" size="small" type="danger" effect="plain">
                  已禁用
                </el-tag>
              </div>
            </template>
          </template>
        </el-table-column>

        <el-table-column label="存储值" min-width="180">
          <template #default="{ row }">
            <span v-if="!row.isGroup" class="dict-value">{{ row.dictValue }}</span>
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.isGroup">{{ row.remark }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.isGroup">
              <el-button link type="primary" size="small" @click.stop="toggleExpand(row)">
                {{ isExpanded(row) ? '收起' : '展开' }}
              </el-button>
              <el-divider direction="vertical" />
              <el-button link type="primary" size="small" @click.stop="openAddInGroup(row.dictType)">
                新增字典项
              </el-button>
            </template>
            <template v-else>
              <el-button
                v-if="row.children && row.children.length"
                link
                type="primary"
                size="small"
                @click.stop="toggleExpand(row)"
              >
                {{ isExpanded(row) ? '收起' : '展开' }}
              </el-button>
              <el-divider v-if="row.children && row.children.length" direction="vertical" />
              <el-button link type="primary" size="small" @click.stop="openEdit(row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-button link type="primary" size="small" @click.stop="openAddChild(row)">新增子项</el-button>
              <el-divider direction="vertical" />
              <el-button link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑字典' : '新增字典'"
      width="560px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="字典类型" prop="dictType">
          <el-select
            v-model="form.dictType"
            placeholder="选择或输入类型"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="t in typeList"
              :key="t.dictType"
              :label="t.dictType"
              :value="t.dictType"
            />
          </el-select>
          <div class="form-tip">例如：question_source、exam_type、question_category</div>
        </el-form-item>

        <el-form-item label="父节点" prop="parentId">
          <el-select
            v-model="form.parentId"
            placeholder="不选则为顶级"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option :value="0" label="【顶级】" />
            <el-option
              v-for="p in parentCandidates"
              :key="p.id"
              :label="`${'—'.repeat((p.level || 1) - 1)} ${p.dictLabel}`"
              :value="p.id"
            />
          </el-select>
          <div class="form-tip">选择父节点后，层级会自动计算</div>
        </el-form-item>

        <el-form-item label="显示名称" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="如 国考" />
        </el-form-item>

        <el-form-item label="存储值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="如 guokao" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span class="form-tip" style="margin-left: 12px">数字越小越靠前</span>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened } from '@element-plus/icons-vue'
import {
  adminListAllDict,
  adminListDictTypes,
  adminSaveDict,
  adminUpdateDict,
  adminDeleteDict
} from '@/api/dict'

// ==================== 分组显示名映射 ====================
const TYPE_LABELS = {
  question_category: '题目类型',
  exam_type: '考试类型',
  question_source: '套卷来源',
  analysis_platform: '解析平台'
}
const typeLabel = (t) => TYPE_LABELS[t] || t

// ==================== 状态 ====================
const loading = ref(false)
const allData = ref([])
const treeData = ref([])
const typeList = ref([])
const tableRef = ref()

// ★ 用独立 Set 记录展开状态，避免与 Element Plus 内部字段冲突
const expandedKeys = ref(new Set())

const query = reactive({
  dictType: '',
  keyword: '',
  status: null
})

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  dictType: '',
  dictLabel: '',
  dictValue: '',
  parentId: 0,
  level: 1,
  sort: 0,
  status: 1,
  remark: ''
})

const rules = {
  dictType: [{ required: true, message: '请选择或输入字典类型', trigger: 'change' }],
  dictLabel: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入存储值', trigger: 'blur' }]
}

const parentCandidates = computed(() => {
  if (!form.dictType) return []
  return allData.value.filter(d =>
    d.dictType === form.dictType && d.id !== form.id
  )
})

// ==================== 展开/收起 ====================
/** 判断某行是否展开 */
const isExpanded = (row) => expandedKeys.value.has(row.rowKey)

/** 展开/收起单行 */
const toggleExpand = (row) => {
  const table = tableRef.value
  if (!table) return
  const willExpand = !expandedKeys.value.has(row.rowKey)
  table.toggleRowExpansion(row, willExpand)
}

/** 同步展开状态（不写 row.expanded） */
const handleExpandChange = (row, expanded) => {
  const isExp = Array.isArray(expanded) ? expanded.includes(row) : !!expanded
  const newSet = new Set(expandedKeys.value)
  if (isExp) {
    newSet.add(row.rowKey)
  } else {
    newSet.delete(row.rowKey)
  }
  expandedKeys.value = newSet
}

/** 初始只展开分组 */
const expandAllGroups = () => {
  const table = tableRef.value
  if (!table) return
  const newSet = new Set()
  treeData.value.forEach(row => {
    if (row.isGroup) {
      table.toggleRowExpansion(row, true)
      newSet.add(row.rowKey)
    }
  })
  expandedKeys.value = newSet
}

// ==================== 加载 ====================
const loadTypes = async () => {
  typeList.value = await adminListDictTypes()
}

const loadAll = async () => {
  loading.value = true
  try {
    expandedKeys.value = new Set()
    const raw = await adminListAllDict()

    // ★ 清洗数据
    allData.value = (raw || []).map(d => {
      const item = {
        ...d,
        rowKey: `dict-${d.id}`          // 1. 加唯一 rowKey
      }
      // 2. 删掉空 children（避免 Element Plus 显示无用的箭头）
      if (Array.isArray(item.children) && item.children.length === 0) {
        delete item.children
      }
      return item
    })

    renderTree()
    await nextTick()
    expandAllGroups()
  } finally {
    loading.value = false
  }
}
// ==================== 构造分组树 ====================
const renderTree = () => {
  // 过滤
  let filtered = allData.value
  if (query.dictType) {
    filtered = filtered.filter(d => d.dictType === query.dictType)
  }
  if (query.status !== null && query.status !== '') {
    filtered = filtered.filter(d => d.status === query.status)
  }
  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    const hitIds = new Set()
    filtered.forEach(d => {
      if (
        (d.dictLabel || '').toLowerCase().includes(kw) ||
        (d.dictValue || '').toLowerCase().includes(kw)
      ) {
        hitIds.add(d.id)
      }
    })
    const idMap = new Map(filtered.map(d => [d.id, d]))
    const withAncestors = new Set(hitIds)
    hitIds.forEach(id => {
      let cur = idMap.get(id)
      while (cur && cur.parentId && cur.parentId > 0) {
        withAncestors.add(cur.parentId)
        cur = idMap.get(cur.parentId)
      }
    })
    filtered = filtered.filter(d => withAncestors.has(d.id))
  }

  // 按 dictType 分组
  const groups = new Map()
  filtered.forEach(d => {
    if (!groups.has(d.dictType)) groups.set(d.dictType, [])
    groups.get(d.dictType).push({ ...d })
  })

  const roots = []
  groups.forEach((items, dictType) => {
    const idMap = new Map(items.map(i => [i.id, i]))

    // ★ 只有真正有子项时才创建 children 数组
    items.forEach(i => {
      if (i.parentId && i.parentId > 0 && idMap.has(i.parentId)) {
        const parent = idMap.get(i.parentId)
        if (!parent.children) parent.children = []
        parent.children.push(i)
      }
    })

    const groupChildren = items.filter(
      i => !i.parentId || i.parentId === 0 || !idMap.has(i.parentId)
    )

    const sortRecursive = (arr) => {
      arr.sort((a, b) => (a.sort || 0) - (b.sort || 0))
      arr.forEach(x => x.children && sortRecursive(x.children))
    }
    sortRecursive(groupChildren)

    roots.push({
      rowKey: `group-${dictType}`,
      isGroup: true,
      dictType,
      children: groupChildren
    })
  })

  roots.sort((a, b) => a.dictType.localeCompare(b.dictType))
  treeData.value = roots
}

// ==================== 搜索 ====================
const resetQuery = () => {
  query.dictType = ''
  query.keyword = ''
  query.status = null
  renderTree()
  nextTick(() => expandAllGroups())
}

// ==================== 表单 ====================
const openEdit = (row) => {
  if (row) {
    Object.assign(form, {
      id: row.id,
      dictType: row.dictType,
      dictLabel: row.dictLabel,
      dictValue: row.dictValue,
      parentId: row.parentId || 0,
      level: row.level || 1,
      sort: row.sort || 0,
      status: row.status ?? 1,
      remark: row.remark || ''
    })
  } else {
    Object.assign(form, {
      id: null,
      dictType: query.dictType || '',
      dictLabel: '',
      dictValue: '',
      parentId: 0,
      level: 1,
      sort: 0,
      status: 1,
      remark: ''
    })
  }
  dialogVisible.value = true
}

const openAddInGroup = (dictType) => {
  Object.assign(form, {
    id: null,
    dictType,
    dictLabel: '',
    dictValue: '',
    parentId: 0,
    level: 1,
    sort: 0,
    status: 1,
    remark: ''
  })
  dialogVisible.value = true
}

const openAddChild = (row) => {
  Object.assign(form, {
    id: null,
    dictType: row.dictType,
    dictLabel: '',
    dictValue: '',
    parentId: row.id,
    level: (row.level || 1) + 1,
    sort: 0,
    status: 1,
    remark: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (form.id) {
    await adminUpdateDict(form)
    ElMessage.success('修改成功')
  } else {
    await adminSaveDict(form)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  await loadTypes()
  await loadAll()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(
    `确定删除字典「${row.dictLabel}」吗？其所有子节点也会被删除。`,
    '提示',
    { type: 'warning' }
  )
  await adminDeleteDict(row.id)
  ElMessage.success('删除成功')
  await loadTypes()
  await loadAll()
}

onMounted(async () => {
  await loadTypes()
  await loadAll()
})
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.table-card { padding: 0; }

.form-tip {
  font-size: 12px;
  color: #8892c4;
  line-height: 1.5;
  margin-top: 4px;
}

/* ============ 名称单元格 ============ */
.name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
  white-space: nowrap;
}

.group-icon {
  color: #ffaa33;
  font-size: 16px;
  flex-shrink: 0;
}

.group-name {
  color: #e0e6ff;
  font-size: 14px;
  font-weight: 600;
}

.dict-label {
  font-weight: 500;
  color: #e0e6ff;
}

.dict-value {
  color: #c4cce6;
  font-family: Consolas, Monaco, monospace;
}

/* ============ 标签颜色 ============ */
/* L1：青色发光 */
:deep(.level-tag-l1) {
  background: rgba(0, 240, 255, 0.15) !important;
  border-color: rgba(0, 240, 255, 0.5) !important;
  color: #00f0ff !important;
  font-weight: 600;
}

/* L2：紫色发光 */
:deep(.level-tag-l2) {
  background: rgba(124, 77, 255, 0.15) !important;
  border-color: rgba(124, 77, 255, 0.5) !important;
  color: #a78bfa !important;
  font-weight: 600;
}

/* ★ L3：橙色发光 */
:deep(.level-tag-l3) {
  background: rgba(255, 170, 51, 0.15) !important;
  border-color: rgba(255, 170, 51, 0.5) !important;
  color: #ffaa33 !important;
  font-weight: 600;
}

/* ★ L4：绿色发光 */
:deep(.level-tag-l4) {
  background: rgba(0, 255, 157, 0.15) !important;
  border-color: rgba(0, 255, 157, 0.5) !important;
  color: #00ff9d !important;
  font-weight: 600;
}

/* ============ ★ 箭头 + 名称 水平对齐 ============ */
:deep(.dict-table .el-table__body .el-table__cell:first-child .cell),
:deep(.dict-table .el-table__header .el-table__cell:first-child .cell) {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

/* ★ 加大层级缩进 */
:deep(.dict-table .el-table__indent) {
  padding-left: 32px !important;
  flex-shrink: 0 !important;
  box-sizing: content-box;
}

:deep(.dict-table .el-table__expand-icon) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  color: #5a6288 !important;
  flex-shrink: 0 !important;
  transition: transform 0.2s, color 0.2s;
}

:deep(.dict-table .el-table__expand-icon:hover) {
  color: #00f0ff !important;
}

:deep(.dict-table .el-table__expand-icon svg) {
  width: 10px !important;
  height: 10px !important;
}

:deep(.dict-table .el-table__expand-icon--expanded) {
  transform: rotate(90deg);
}

/* ============ 深色主题 ============ */
:deep(.el-table) {
  background: transparent !important;
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: rgba(15, 22, 40, 0.95) !important;
  --el-table-header-text-color: #e0e6ff !important;
  --el-table-text-color: #e0e6ff !important;
  --el-table-border-color: rgba(0, 240, 255, 0.12) !important;
  --el-table-row-hover-bg-color: rgba(0, 240, 255, 0.1) !important;
  --el-table-current-row-bg-color: rgba(0, 240, 255, 0.12) !important;
}

:deep(.el-table tr) {
  background: transparent !important;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(15, 22, 40, 0.95) !important;
  border-bottom: 1px solid rgba(0, 240, 255, 0.15) !important;
}

:deep(.el-table th.el-table__cell),
:deep(.el-table th.el-table__cell .cell),
:deep(.el-table th.el-table__cell *) {
  color: #c4cce6 !important;
}

:deep(.el-table td.el-table__cell) {
  background: rgba(20, 28, 48, 0.5) !important;
  border-bottom: 1px solid rgba(0, 240, 255, 0.08) !important;
}

:deep(.el-table td.el-table__cell),
:deep(.el-table td.el-table__cell .cell),
:deep(.el-table td.el-table__cell .cell *),
:deep(.el-table td.el-table__cell span) {
  color: #e0e6ff !important;
}

:deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(0, 240, 255, 0.1) !important;
}

:deep(.el-table::before),
:deep(.el-table::after) {
  display: none !important;
}

:deep(.el-table__expanded-cell) {
  background: rgba(10, 15, 30, 0.7) !important;
  border-bottom: 1px solid rgba(0, 240, 255, 0.15) !important;
}

/* ============ ★ 层级视觉增强 ============ */
/* 每一级左侧加竖线，明确层级归属 */

/* L2：一条竖线 */
:deep(.dict-table .el-table__body .el-table__row--level-2 td:first-child .cell) {
  position: relative;
}
:deep(.dict-table .el-table__body .el-table__row--level-2 td:first-child .cell)::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(124, 77, 255, 0.35);    /* 紫色 */
  border-radius: 1px;
}

/* L3：两条竖线 */
:deep(.dict-table .el-table__body .el-table__row--level-3 td:first-child .cell) {
  position: relative;
}
:deep(.dict-table .el-table__body .el-table__row--level-3 td:first-child .cell)::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(124, 77, 255, 0.2);
  border-radius: 1px;
}
:deep(.dict-table .el-table__body .el-table__row--level-3 td:first-child .cell)::after {
  content: '';
  position: absolute;
  left: 52px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 170, 51, 0.35);    /* 橙色 */
  border-radius: 1px;
}

/* L4：三条竖线 */
:deep(.dict-table .el-table__body .el-table__row--level-4 td:first-child .cell) {
  position: relative;
}
:deep(.dict-table .el-table__body .el-table__row--level-4 td:first-child .cell)::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(124, 77, 255, 0.15);
  border-radius: 1px;
}
:deep(.dict-table .el-table__body .el-table__row--level-4 td:first-child .cell)::after {
  content: '';
  position: absolute;
  left: 52px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 170, 51, 0.2);
  border-radius: 1px;
}

/* L4 第三条竖线：用 background 渐变，避免 box-shadow 覆盖整行 */
:deep(.dict-table .el-table__body .el-table__row--level-4 td:first-child .cell) {
  background-image: linear-gradient(
    to right,
    transparent 83px,
    rgba(0, 255, 157, 0.35) 83px,
    rgba(0, 255, 157, 0.35) 85px,
    transparent 85px
  );
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: 0 0;
}
</style>