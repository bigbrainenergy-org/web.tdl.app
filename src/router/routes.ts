import { RouteRecordRaw } from 'vue-router'

const PageNames = [
  'List',
  'Calendar',
  'Focus',
  'Tree',
  'Settings',
  'Graph',
  'Agenda',
  'Routines',
  'Login',
  '',
  '/',
  'Empty',
  'Error 404'
] as const

export type RouteName = (typeof PageNames)[number]
export type RoutePath = Lowercase<RouteName> | '' | '/'
export type RouteTo = `/${RoutePath}`

export interface StronglyTypedRouteRecordRaw
  extends Omit<RouteRecordRaw, 'path' | 'name' | 'children'> {
  path: RoutePath | '/:catchAll(.*)*'
  name?: RouteName
  children?: StronglyTypedRouteRecordRaw[]
}

const routes: StronglyTypedRouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Empty', redirect: 'List' },
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
      },
      {
        path: 'routines',
        name: 'Routines',
        component: () => import('src/pages/Routines.vue')
      }
    ] as StronglyTypedRouteRecordRaw[]
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
