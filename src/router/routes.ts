import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Empty', redirect: 'tasks' },
      { path: 'tasks', name: 'Tasks', component: () => import('src/pages/Tasks.vue') },
      { path: 'tasks-tree', name: 'Tree', component: () => import('src/pages/TaskTree.vue') },
      { path: 'lists', name: 'Lists', component: () => import('src/pages/Lists.vue') },
      { path: 'settings', name: 'Settings', component: () => import('src/pages/Settings.vue') },
      { path: 'graph', name: 'Graph', component: () => import('src/pages/GraphAll.vue') }
    ]
  },
  {
    path: '/', 
    component: () => import('src/layouts/GuestLayout.vue'),
    children: [
      { path: 'login', name: 'Login', component: () => import('src/pages/PageLogin.vue') },
      { path: 'request-access', name: 'Request Access', component: () => import('src/pages/RequestAccess.vue') }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'Error 404',
    component: () => import('src/pages/ErrorNotFound.vue'),
  },
];

export default routes;
