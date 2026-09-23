import { defineStore } from 'pinia'
import { login, getCurrentUser, updateProfile, changePassword, logout } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: {}
  }),
  actions: {
    async login(form) {
      const data = await login(form)
      this.token = data.token
      setToken(data.token)
      return data
    },
    async fetchUserInfo() {
      const info = await getCurrentUser()
      this.userInfo = info
      return info
    },
    async updateProfile(form) {
      await updateProfile(form)
      await this.fetchUserInfo()
    },
    async changePassword(form) {
      await changePassword(form)
    },
    async logout() {
      try {
        await logout()
      } catch (e) {
        // 即使接口失败也继续本地清理
      }
      this.token = ''
      this.userInfo = {}
      removeToken()
    }
  }
})