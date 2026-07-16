<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Close, Menu } from '@element-plus/icons-vue'
import BrandMark from './BrandMark.vue'

const route = useRoute()
const menuOpen = ref(false)

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="marketing-header">
    <div class="marketing-header-inner">
      <RouterLink to="/" class="brand-link" aria-label="AI Chat 首页" @click="closeMenu">
        <BrandMark />
      </RouterLink>

      <button class="mobile-menu" type="button" :aria-expanded="menuOpen" aria-label="切换导航" @click="menuOpen = !menuOpen">
        <ElIcon><Close v-if="menuOpen" /><Menu v-else /></ElIcon>
      </button>

      <nav class="marketing-nav" :class="{ open: menuOpen }" aria-label="官网导航">
        <RouterLink to="/" :class="{ active: route.path === '/' }" @click="closeMenu">首页</RouterLink>
        <RouterLink to="/#capabilities" @click="closeMenu">产品能力</RouterLink>
        <RouterLink to="/#local-first" @click="closeMenu">本地优先</RouterLink>
        <RouterLink to="/#voice" @click="closeMenu">语音能力</RouterLink>
        <RouterLink to="/guide" :class="{ active: route.path === '/guide' }" @click="closeMenu">使用教程</RouterLink>
      </nav>

      <RouterLink class="header-cta" to="/chat">进入 AI Chat</RouterLink>
    </div>
  </header>
</template>

<style scoped>
.marketing-header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 72px;
  border-bottom: 1px solid rgba(61, 78, 117, 0.56);
  background: rgba(7, 17, 36, 0.94);
  backdrop-filter: blur(18px);
}

.marketing-header-inner {
  width: min(1180px, calc(100% - 40px));
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 28px;
}

.brand-link {
  color: inherit;
}

.marketing-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 30px;
}

.marketing-nav a {
  position: relative;
  padding: 25px 0 23px;
  color: #9ca7c0;
  font-size: 14px;
  font-weight: 550;
}

.marketing-nav a:hover,
.marketing-nav a.active {
  color: #fff;
}

.marketing-nav a.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 17px;
  height: 2px;
  border-radius: 2px;
  background: var(--accent-light);
}

.header-cta {
  padding: 10px 16px;
  border: 1px solid rgba(139, 131, 255, 0.72);
  border-radius: 7px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 650;
  box-shadow: 0 10px 30px rgba(108, 99, 255, 0.24);
}

.header-cta:hover {
  background: var(--accent-light);
}

.mobile-menu {
  display: none;
  width: 40px;
  height: 40px;
  margin-left: auto;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: transparent;
  color: #fff;
  font-size: 22px;
}

@media (max-width: 820px) {
  .marketing-header-inner {
    width: min(100% - 28px, 1180px);
  }

  .mobile-menu {
    display: inline-flex;
  }

  .header-cta {
    display: none;
  }

  .marketing-nav {
    display: none;
    position: absolute;
    top: 71px;
    left: 0;
    right: 0;
    padding: 12px 18px 18px;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    border-bottom: 1px solid var(--border);
    background: #09152b;
  }

  .marketing-nav.open {
    display: flex;
  }

  .marketing-nav a {
    padding: 13px 10px;
    border-radius: 6px;
  }

  .marketing-nav a:hover,
  .marketing-nav a.active {
    background: var(--accent-bg);
  }

  .marketing-nav a.active::after {
    display: none;
  }
}
</style>
