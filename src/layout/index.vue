<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span class="logo-icon">图</span>
        <span class="logo-text">图推后台</span>
      </div>
      <el-menu :default-active="$route.path" router class="menu">
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/question">
          <el-icon><Document /></el-icon>
          <span>题库管理</span>
        </el-menu-item>
        <el-menu-item index="/dict">
          <el-icon><Collection /></el-icon>
          <span>字典管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header" height="64px">
        <div class="title">
          <span class="title-bar"></span>
          <span>{{ $route.meta.title }}</span>
        </div>
       <el-dropdown @command="handleCommand">
          <span class="user-info">
            <!-- 优先显示头像图片，没有则显示昵称首字 -->
            <img v-if="userStore.userInfo.avatar" :src="userStore.userInfo.avatar" class="avatar-img" alt="用户头像" />
            <div v-else class="avatar">
              {{ (userStore.userInfo.nickname || '管')[0] }}
            </div>
            <span>{{ userStore.userInfo.nickname || '管理员' }}</span>
            <el-icon>
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <!-- 下拉菜单内容保持不变 -->
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Odometer, User, Document, Collection, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  try {
    await userStore.fetchUserInfo()
  } catch (e) {}
})

const handleCommand = async (cmd) => {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'logout') {
    await ElMessageBox.confirm('确定退出登录吗？', '提示')
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout {
  height: 100vh;
  background: radial-gradient(ellipse at top, #0d1428 0%, #050810 80%);
}

/* ============ 侧边栏 ============ */
.sidebar {
  background: linear-gradient(180deg, #0a0f1e 0%, #050810 100%);
  border-right: 1px solid rgba(0, 240, 255, 0.15);
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  border-radius: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
}

.logo-text {
  color: #e0e6ff;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.menu {
  border-right: none;
  background: transparent;
  padding: 12px 8px;
}

.menu :deep(.el-menu-item) {
  color: #8892c4;
  border-radius: 10px;
  margin-bottom: 6px;
  height: 48px;
  line-height: 48px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(0, 240, 255, 0.08) !important;
  color: #00f0ff;
}

.menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(124, 77, 255, 0.2)) !important;
  color: #00f0ff !important;
  box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.15);
}

.menu :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: linear-gradient(180deg, #00f0ff, #7c4dff);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 10px #00f0ff;
}

/* ============ 顶栏 ============ */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 22, 40, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 240, 255, 0.15);
  padding: 0 24px;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #e0e6ff;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #00f0ff, #7c4dff);
  border-radius: 2px;
  box-shadow: 0 0 10px #00f0ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 24px;
  transition: all 0.3s;
  color: #e0e6ff;
  border: 1px solid transparent;
}

.user-info:hover {
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.3);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
}

/* ============ 主内容区 ============ */
.main {
  background: transparent;
  padding: 20px;
  overflow-y: auto;
}

/* 新增的图片头像样式 */
.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(0, 240, 255, 0.5); 
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
  display: block;
}

/* 保留原来的文字头像样式作为备用 */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f0ff, #7c4dff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
}
</style>