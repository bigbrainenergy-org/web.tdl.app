import { PageNameBuiltins, StronglyTypedRouteRecordRaw } from './REEEE'

// Add your page names here. Formatting:
// - Capitalize first letter
const PageNames = [
  ...PageNameBuiltins,
  'List',
  'Calendar',
  'Focus',
  'Tree',
  'Settings',
  'Graph',
  'Agenda',
  'Routines',
  'Login',
  'Empty',
  'Error 404'
] as const

export type RouteName = (typeof PageNames)[number] | '' | '/'
export type RoutePath = Lowercase<RouteName> | '' | '/'
export type RouteTo = `/${RoutePath}`

const routes: StronglyTypedRouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Empty', redirect: 'list' },
      {
        path: 'list',
        name: 'List',
        component: () => import('src/pages/List.vue')
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('src/pages/Calendar.vue')
      },
      {
        path: 'focus',
        name: 'Focus',
        component: () => import('src/pages/Focus.vue')
      },
      {
        path: 'tree',
        name: 'Tree',
        component: () => import('src/pages/Tree.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('src/pages/Settings.vue')
      },
      {
        path: 'graph',
        name: 'Graph',
        component: () => import('src/pages/Graph.vue')
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
        component: () => import('src/pages/Login.vue')
      }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'Error 404',
    component: () => import('src/pages/Error404.vue')
  }
]

export default routes
