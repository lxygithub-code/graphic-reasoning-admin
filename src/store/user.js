import { defineStore } from 'pinia'
import { login, getCurrentUser, logout } from '@/api/auth'
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
      this.userInfo = await getCurrentUser()
      return this.userInfo
    },
    async logout() {
      try { await logout() } catch (e) {}
      this.token = ''
      this.userInfo = {}
      removeToken()
    }
  }
})