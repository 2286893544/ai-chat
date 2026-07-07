import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: () => import('../views/ChatPage.vue'),
    },
    {
      path: '/characters',
      name: 'characters',
      component: () => import('../views/CharacterListPage.vue'),
    },
    {
      path: '/characters/new',
      name: 'character-new',
      component: () => import('../views/CharacterEditPage.vue'),
    },
    {
      path: '/characters/:id/edit',
      name: 'character-edit',
      component: () => import('../views/CharacterEditPage.vue'),
    },
    {
      path: '/characters/create',
      name: 'character-create',
      component: () => import('../views/CharacterEditPage.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsPage.vue'),
    },
    {
      path: '/project',
      name: 'project',
      component: () => import('../views/ProjectInfoPage.vue'),
    },
  ],
})

export default router
