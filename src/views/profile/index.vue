<template>
  <div class="profile-page">
    <!-- 基本信息 -->
    <el-card class="setting-card">
      <template #header>
        <span class="card-title">基本信息</span>
      </template>

      <el-form :model="baseForm" :rules="baseRules" ref="baseFormRef" label-width="100px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="baseForm.username" placeholder="请输入账号" style="max-width: 320px" />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="baseForm.nickname" placeholder="请输入昵称" style="max-width: 320px" />
        </el-form-item>

        <el-form-item label="头像">
          <el-upload
            :http-request="handleAvatarUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <img v-if="baseForm.avatar" :src="fullUrl(baseForm.avatar)" class="avatar-preview" />
            <div v-else class="avatar-placeholder">
              <el-icon :size="24"><Plus /></el-icon>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="baseLoading" @click="handleSaveBase">
            保存修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码 -->
    <el-card class="setting-card" style="margin-top: 20px">
      <template #header>
        <span class="card-title">修改密码</span>
      </template>

      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password
            placeholder="请输入旧密码" style="max-width: 320px" />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password
            placeholder="6-32 位" style="max-width: 320px" />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password
            placeholder="再次输入新密码" style="max-width: 320px" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="pwdLoading" @click="handleChangePwd">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { uploadImage } from '@/api/upload'

const router = useRouter()
const userStore = useUserStore()

const BACKEND = 'http://localhost:8866'
const fullUrl = (u) => (u ? (u.startsWith('http') ? u : BACKEND + u) : '')

// ============ 基本信息 ============
const baseFormRef = ref()
const baseLoading = ref(false)
const baseForm = reactive({
  username: '',
  nickname: '',
  avatar: ''
})

const baseRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 32, message: '账号长度 3-32 位', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ]
}

// ============ 密码 ============
const pwdFormRef = ref()
const pwdLoading = ref(false)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

// ============ 初始化 ============
onMounted(async () => {
  try {
    await userStore.fetchUserInfo()
    baseForm.username = userStore.userInfo.username || ''
    baseForm.nickname = userStore.userInfo.nickname || ''
    baseForm.avatar = userStore.userInfo.avatar || ''
  } catch (e) {}
})

// ============ 头像上传 ============
const handleAvatarUpload = async ({ file }) => {
  try {
    const url = await uploadImage(file)
    baseForm.avatar = url
    ElMessage.success('头像上传成功')
  } catch (e) {
    ElMessage.error('上传失败')
  }
}

// ============ 保存基本信息 ============
const handleSaveBase = async () => {
  await baseFormRef.value.validate()
  baseLoading.value = true
  try {
    await userStore.updateProfile({
      username: baseForm.username,
      nickname: baseForm.nickname,
      avatar: baseForm.avatar
    })
    ElMessage.success('保存成功')
  } catch (e) {
    // request 里已 toast
  } finally {
    baseLoading.value = false
  }
}

// ============ 修改密码 ============
const handleChangePwd = async () => {
  await pwdFormRef.value.validate()
  pwdLoading.value = true
  try {
    await userStore.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    // 清空表单
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''

    // 强制退出
    setTimeout(async () => {
      await userStore.logout()
      router.push('/login')
    }, 1200)
  } catch (e) {
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.setting-card {
  background: rgba(20, 28, 48, 0.9) !important;
  border: 1px solid rgba(0, 240, 255, 0.15) !important;
}

.card-title {
  font-weight: 600;
  color: #e0e6ff;
  letter-spacing: 2px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid rgba(0, 240, 255, 0.3);
  cursor: pointer;
  display: block;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px dashed rgba(0, 240, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8892c4;
  cursor: pointer;
}

.avatar-placeholder:hover {
  border-color: #00f0ff;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.08);
}
</style>