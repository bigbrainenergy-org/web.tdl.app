import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Empty', redirect: 'list' },
      {
        path: 'list',
        name: 'List',
        component: () => import('src/pages/ListPage.vue')
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('src/pages/CalendarPage.vue')
      },
      {
        path: 'focus',
        name: 'Focus',
        component: () => import('src/pages/FocusPage.vue')
      },
      {
        path: 'tree',
        name: 'Tree',
        component: () => import('src/pages/TreePage.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('src/pages/SettingsPage.vue')
      },
      {
        path: 'graph',
        name: 'Graph',
        component: () => import('src/pages/GraphPage.vue')
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
