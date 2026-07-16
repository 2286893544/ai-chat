<script setup lang="ts">
import { ChatLineRound } from '@element-plus/icons-vue'

withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})
</script>

<template>
  <span class="brand" :class="{ compact }">
    <span class="brand-icon" aria-hidden="true">
      <ElIcon><ChatLineRound /></ElIcon>
    </span>
    <span class="brand-name">AI Chat</span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--text-primary);
  white-space: nowrap;
}

.brand-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 8px 22px rgba(108, 99, 255, 0.28);
  font-size: 19px;
}

.brand-name {
  font-size: 20px;
  font-weight: 750;
}

.compact .brand-icon {
  width: 30px;
  height: 30px;
  font-size: 17px;
}

.compact .brand-name {
  font-size: 17px;
}
</style>
