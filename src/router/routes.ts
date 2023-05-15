import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Empty', redirect: 'inbox' },
      { path: 'inbox', name: 'Inbox', component: () => import('pages/Inbox.vue') },
      { path: 'next-actions', name: 'Next Actions', component: () => import('pages/NextActions.vue') },
      { path: 'waiting-for', name: 'Waiting For', component: () => import('pages/WaitingFor.vue') },
      { path: 'projects', name: 'Projects', component: () => import('pages/Projects.vue') },
      { path: 'settings', name: 'Settings', component: () => import('pages/Settings.vue') },
    ],
  },
  {
    path: '/', 
    component: () => import('layouts/GuestLayout.vue'),
    children: [
      { path: 'login', name: 'Login', component: () => import('pages/Login.vue') },
      { path: 'request-access', name: 'Request Access', component: () => import('pages/RequestAccess.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'Error 404',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
