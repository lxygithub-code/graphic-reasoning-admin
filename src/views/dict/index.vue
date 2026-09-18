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
              <span style="float: right; color: #999">{{ t.count }}</span>
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
        :data="treeData"
        v-loading="loading"
        row-key="rowKey"
        :tree-props="{ children: 'children' }"
        default-expand-all
        :indent="20"
      >
        <el-table-column label="名称" min-width="260">
          <template #default="{ row }">
            <!-- 分组节点 -->
            <template v-if="row.isGroup">
              <div class="group-cell">
                <el-icon class="group-icon"><FolderOpened /></el-icon>
                <span class="group-name">{{ typeLabel(row.dictType) }}</span>
                <el-tag size="small" type="info" effect="plain">{{ row.dictType }}</el-tag>
                <el-tag size="small" type="success" effect="plain">{{ row.children.length }} 条</el-tag>
              </div>
            </template>
            <!-- 字典项 -->
            <template v-else>
              <span class="dict-label">{{ row.dictLabel }}</span>
              <el-tag
                size="small"
                :type="row.level === 1 ? 'primary' : 'info'"
                effect="plain"
                style="margin-left: 8px"
              >L{{ row.level }}</el-tag>
              <el-tag v-if="row.status !== 1" size="small" type="danger" effect="plain" style="margin-left: 6px">
                已禁用
              </el-tag>
            </template>
          </template>
        </el-table-column>

        <el-table-column label="存储值" min-width="180">
          <template #default="{ row }">
            <span v-if="!row.isGroup" class="dict-value">{{ row.dictValue }}</span>
          </template>
        </el-table-column>

        <el-table-column label="父ID" width="80" align="center">
          <template #default="{ row }">
            <span v-if="!row.isGroup">{{ row.parentId || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="排序" width="80" align="center">
          <template #default="{ row }">
            <span v-if="!row.isGroup">{{ row.sort }}</span>
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.isGroup">{{ row.remark }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <!-- 分组节点：只提供"在此分组下新增" -->
            <template v-if="row.isGroup">
              <el-button link type="primary" size="small" @click="openAddInGroup(row.dictType)">
                新增字典项
              </el-button>
            </template>
            <!-- 字典项 -->
            <template v-else>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-button link type="primary" size="small" @click="openAddChild(row)">新增子项</el-button>
              <el-divider direction="vertical" />
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗（和之前一样） -->
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
import { ref, reactive, computed, onMounted } from 'vue'
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
  question_source: '套卷来源'
}
const typeLabel = (t) => TYPE_LABELS[t] || t

// ==================== 状态 ====================
const loading = ref(false)
const allData = ref([])     // 全量字典
const treeData = ref([])    // 按 dictType 分组后的树形
const typeList = ref([])

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

// 可选父节点：当前表单 dictType 下的条目
const parentCandidates = computed(() => {
  if (!form.dictType) return []
  return allData.value.filter(d =>
    d.dictType === form.dictType && d.id !== form.id
  )
})

// ==================== 加载 ====================
const loadTypes = async () => {
  typeList.value = await adminListDictTypes()
}

const loadAll = async () => {
  loading.value = true
  try {
    allData.value = await adminListAllDict()
    renderTree()
  } finally {
    loading.value = false
  }
}

// ==================== 构造分组树 ====================
const renderTree = () => {
  // 1. 过滤
  let filtered = allData.value
  if (query.dictType) {
    filtered = filtered.filter(d => d.dictType === query.dictType)
  }
  if (query.status !== null && query.status !== '') {
    filtered = filtered.filter(d => d.status === query.status)
  }
  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    // 关键词过滤时，如果父节点命中，子节点也保留
    const hitIds = new Set()
    filtered.forEach(d => {
      if (
        (d.dictLabel || '').toLowerCase().includes(kw) ||
        (d.dictValue || '').toLowerCase().includes(kw)
      ) {
        hitIds.add(d.id)
      }
    })
    // 收集命中节点的所有祖先
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

  // 2. 按 dictType 分组
  const groups = new Map()
  filtered.forEach(d => {
    if (!groups.has(d.dictType)) groups.set(d.dictType, [])
    groups.get(d.dictType).push({ ...d, children: [] })
  })

  // 3. 每组内部按 parentId 组装树
  const roots = []
  groups.forEach((items, dictType) => {
    const idMap = new Map(items.map(i => [i.id, i]))
    const groupChildren = []
    items.forEach(i => {
      if (i.parentId && i.parentId > 0 && idMap.has(i.parentId)) {
        idMap.get(i.parentId).children.push(i)
      } else {
        groupChildren.push(i)
      }
    })

    // 排序：sort 升序
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

  // 4. 分组按字典类型名排序
  roots.sort((a, b) => a.dictType.localeCompare(b.dictType))

  treeData.value = roots
}

// ==================== 搜索 ====================
const resetQuery = () => {
  query.dictType = ''
  query.keyword = ''
  query.status = null
  renderTree()
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

// 从分组节点点"新增字典项"
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

// 从字典项点"新增子项"
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
  color: #999;
  line-height: 1.5;
  margin-top: 4px;
}

/* 分组行 */
.group-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.group-icon {
  color: #e6a23c;
  font-size: 18px;
}
.group-name {
  color: #303133;
  font-size: 14px;
}

/* 字典项 */
.dict-label {
  font-weight: 500;
  color: #303133;
}
.dict-value {
  color: #606266;
  font-family: Consolas, Monaco, monospace;
}
</style>