<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-grid"></div>

    <div class="login-card">
      <div class="logo-area">
        <div class="logo-icon">图</div>
        <h1 class="logo-title">图推后台管理系统</h1>
        <p class="logo-subtitle">Graphic Reasoning Admin</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%; height: 44px; font-size: 15px"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0d1428 0%, #050810 100%);
  position: relative;
  overflow: hidden;
}

/* 背景光晕 */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  pointer-events: none;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: #00f0ff;
  top: -200px;
  left: -100px;
  animation: float 15s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #7c4dff;
  bottom: -150px;
  right: -100px;
  animation: float 20s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(50px, 30px); }
}

/* 网格背景 */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 2;
  width: 420px;
  padding: 48px 40px;
  background: linear-gradient(135deg, rgba(20, 28, 48, 0.9), rgba(15, 20, 38, 0.9));
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 20px 60px rgba(0, 240, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  border-radius: 16px;
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.5);
}

.logo-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-subtitle {
  font-size: 12px;
  color: #8892c4;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}
</style>