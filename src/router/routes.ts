import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Empty', redirect: 'tasks' },
      {
        path: 'focus',
        name: 'Focus',
        component: () => import('src/pages/FocusPage.vue')
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('src/pages/TasksPage.vue')
      },
      {
        path: 'tasks-tree',
        name: 'Tree',
        component: () => import('src/pages/TaskTree.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('src/pages/Settings.vue')
      },
      {
        path: 'graph',
        name: 'Graph',
        component: () => import('src/pages/GraphAll.vue')
      },
      {
        path: 'agenda',
        name: 'Agenda',
        component: () => import('src/pages/Agenda.vue')
      }
    ]
  },
  {
    path: '/',
    component: () => import('src/layouts/GuestLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('src/pages/LoginPage.vue')
      }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'Error 404',
    component: () => import('src/pages/Error404Page.vue')
  }
]

export default routes
