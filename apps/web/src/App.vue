<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChatDotRound,
  CircleCheckFilled,
  Close,
  HomeFilled,
  InfoFilled,
  Menu,
  Setting,
  User,
  WarningFilled,
} from '@element-plus/icons-vue'
import BrandMark from './components/BrandMark.vue'
import { useApiKeyStore } from './stores/apiKey'
import { useCharacterStore } from './stores/character'
import { useConversationStore } from './stores/conversation'

const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()
const apiKeyStore = useApiKeyStore()

const sidebarOpen = ref(false)
const publicShellRef = ref<HTMLElement>()
const isPublicLayout = computed(() => route.meta.layout === 'public')

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function navigateTo(path: string) {
  router.push(path)
  sidebarOpen.value = false
}

function isActive(path: string): boolean {
  return route.path === path || (path !== '/chat' && route.path.startsWith(path))
}

onMounted(async () => {
  await characterStore.loadCharacters()
  await conversationStore.loadConversations()
})

watch(() => route.fullPath, async () => {
  await nextTick()
  if (!isPublicLayout.value) return

  if (route.hash) {
    document.querySelector(route.hash)?.scrollIntoView({ block: 'start' })
    return
  }

  publicShellRef.value?.scrollTo({ top: 0, left: 0 })
})
</script>

<template>
  <div v-if="isPublicLayout" ref="publicShellRef" class="public-shell">
    <router-view />
  </div>

  <div v-else class="app-layout product-shell">
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <RouterLink to="/" class="sidebar-brand" aria-label="返回官网">
          <BrandMark compact />
        </RouterLink>
        <ElButton class="sidebar-close" text circle aria-label="关闭导航" @click="sidebarOpen = false">
          <ElIcon><Close /></ElIcon>
        </ElButton>
      </div>

      <nav class="sidebar-nav" aria-label="应用导航">
        <ElButton class="nav-item" text :class="{ active: isActive('/chat') }" @click="navigateTo('/chat')">
          <ElIcon class="nav-icon"><ChatDotRound /></ElIcon>
          <span class="nav-label">聊天</span>
        </ElButton>
        <ElButton class="nav-item" text :class="{ active: isActive('/characters') }" @click="navigateTo('/characters')">
          <ElIcon class="nav-icon"><User /></ElIcon>
          <span class="nav-label">角色管理</span>
        </ElButton>
        <ElButton class="nav-item" text :class="{ active: isActive('/settings') }" @click="navigateTo('/settings')">
          <ElIcon class="nav-icon"><Setting /></ElIcon>
          <span class="nav-label">设置</span>
        </ElButton>
        <ElButton class="nav-item" text :class="{ active: isActive('/project') }" @click="navigateTo('/project')">
          <ElIcon class="nav-icon"><InfoFilled /></ElIcon>
          <span class="nav-label">项目说明</span>
        </ElButton>
      </nav>

      <div class="sidebar-footer">
        <RouterLink class="site-return" to="/">
          <ElIcon><HomeFilled /></ElIcon>
          <span>返回官网</span>
        </RouterLink>
        <div v-if="!apiKeyStore.hasKey" class="api-key-state warning">
          <ElIcon><WarningFilled /></ElIcon>
          <span>未设置 API Key</span>
        </div>
        <div v-else class="api-key-state ready">
          <ElIcon><CircleCheckFilled /></ElIcon>
          <span>本地配置已就绪</span>
        </div>
      </div>
    </aside>

    <div class="main-area">
      <header class="mobile-header">
        <ElButton class="hamburger" text circle aria-label="打开导航" @click="toggleSidebar">
          <ElIcon><Menu /></ElIcon>
        </ElButton>
        <BrandMark compact />
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.public-shell {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: #071124;
}

.product-shell {
  background: #0b1428;
}

.app-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sidebar-overlay {
  display: none;
}

.sidebar {
  width: 252px;
  min-width: 252px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #263757;
  background: #101d38;
}

.sidebar-header {
  min-height: 78px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #263757;
}

.sidebar-brand {
  color: inherit;
}

.sidebar-close {
  display: none;
  color: var(--text-secondary);
}

.sidebar-nav {
  flex: 1;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  width: 100%;
  min-height: 44px;
  padding: 0 13px;
  justify-content: flex-start;
  border-radius: 7px;
  color: #aeb8ce;
  font-size: 14px;
}

.nav-item :deep(> span) {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.nav-item:hover {
  background: #182746;
  color: #fff;
}

.nav-item.active {
  background: #253665;
  color: #9e97ff;
  font-weight: 650;
}

.nav-icon {
  width: 20px;
  flex: none;
  font-size: 18px;
}

.sidebar-footer {
  padding: 14px 14px 18px;
  display: grid;
  gap: 10px;
  border-top: 1px solid #263757;
}

.site-return,
.api-key-state {
  min-height: 42px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 6px;
  font-size: 13px;
}

.site-return {
  color: #aeb8ce;
}

.site-return:hover {
  background: #182746;
  color: #fff;
}

.api-key-state.warning {
  border: 1px solid rgba(255, 197, 61, 0.22);
  background: rgba(255, 197, 61, 0.08);
  color: #f3c75a;
}

.api-key-state.ready {
  border: 1px solid rgba(78, 205, 196, 0.2);
  background: rgba(78, 205, 196, 0.08);
  color: var(--success);
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.mobile-header {
  display: none;
  min-height: 62px;
  padding: 0 14px;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #263757;
  background: #101d38;
}

.hamburger {
  color: #fff;
  font-size: 21px;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 100;
    width: min(82vw, 286px);
    min-width: 0;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: inline-flex;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 99;
    background: rgba(2, 8, 20, 0.72);
  }

  .mobile-header {
    display: flex;
  }
}
</style>
