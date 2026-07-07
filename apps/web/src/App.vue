<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from './stores/character'
import { useConversationStore } from './stores/conversation'
import { useApiKeyStore } from './stores/apiKey'

const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()
const apiKeyStore = useApiKeyStore()

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function navigateTo(path: string) {
  router.push(path)
  sidebarOpen.value = false
}

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

onMounted(async () => {
  await characterStore.loadCharacters()
  await conversationStore.loadConversations()
})
</script>

<template>
  <div class="app-layout">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="app-logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text">AI 聊天</span>
        </div>
        <button class="sidebar-close" @click="sidebarOpen = false">
          ✕
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: isActive('/') }"
          @click="navigateTo('/')"
        >
          <span class="nav-icon">💬</span>
          <span class="nav-label">聊天</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: isActive('/characters') }"
          @click="navigateTo('/characters')"
        >
          <span class="nav-icon">👤</span>
          <span class="nav-label">角色管理</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: isActive('/settings') }"
          @click="navigateTo('/settings')"
        >
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">设置</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div v-if="!apiKeyStore.hasKey" class="api-key-warning">
          <span class="warning-dot">⚠️</span>
          <span>未设置 API Key</span>
        </div>
        <div v-else class="api-key-status">
          <span class="status-dot"></span>
          <span>API Key 已设置</span>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="main-area">
      <!-- Mobile header -->
      <header class="mobile-header">
        <button class="hamburger" @click="toggleSidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span class="mobile-title">AI 智能聊天</span>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar-overlay {
  display: none;
}

.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
  color: var(--accent);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.sidebar-close {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-bg);
  color: var(--accent);
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.api-key-warning,
.api-key-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 6px;
}

.api-key-warning {
  background: rgba(255, 193, 7, 0.1);
  color: #f0ad4e;
}

.api-key-status {
  background: rgba(76, 175, 80, 0.1);
  color: #66bb6a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #66bb6a;
  display: inline-block;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.mobile-header {
  display: none;
  padding: 12px 16px;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  gap: 12px;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
}

.mobile-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: block;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }

  .mobile-header {
    display: flex;
  }
}
</style>
