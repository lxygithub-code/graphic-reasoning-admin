import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: () => import("@/layout/index.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: { title: "仪表盘" },
      },
      {
        path: "user",
        component: () => import("@/views/user/index.vue"),
        meta: { title: "用户管理" },
      },
      {
        path: "dict",
        component: () => import("@/views/dict/index.vue"),
        meta: { title: "字典管理" },
      },
      {
        path: "question",
        component: () => import("@/views/question/index.vue"),
        meta: { title: "题库管理" },
      },
      {
        path: "profile",
        component: () => import("@/views/profile/index.vue"),
        meta: { title: "个人设置" },
      },

      // ★ 新增：评论管理（平铺，不嵌套）
      {
        path: "comment/list",
        name: "CommentList",
        component: () => import("@/views/comment/list.vue"),
        meta: { title: "题目评论" },
      },
      {
        path: "comment/message",
        name: "AdminMessage",
        component: () => import("@/views/comment/message.vue"),
        meta: { title: "消息中心" },
      },
      {
        path: "comment/detail/:questionId",
        name: "CommentDetail",
        component: () => import("@/views/comment/detail.vue"),
        meta: { title: "评论详情" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = getToken()
  if (to.path === '/login') {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router;