import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: 'inbox' },
      { path: 'inbox', component: () => import('pages/Inbox.vue') },
      { path: 'next-actions', component: () => import('pages/NextActions.vue') },
      { path: 'waiting-for', component: () => import('pages/WaitingFor.vue') },
      { path: 'projects', component: () => import('pages/Projects.vue') },
      { path: 'settings', component: () => import('pages/Settings.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/GuestLayout.vue'),
    children: [
      { path: 'login', component: () => import('pages/Login.vue') },
      { path: 'request-access', component: () => import('pages/RequestAccess.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
