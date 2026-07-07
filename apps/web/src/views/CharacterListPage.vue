<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <button class="btn btn-primary" @click="openCreateDialog">+ 创建角色</button>
    </div>

    <div class="character-grid">
      <div class="character-card character-card-add" @click="openCreateDialog">
        <span style="font-size: 36px">+</span>
        <span>创建新角色</span>
      </div>

      <div
        v-for="char in characterStore.characters"
        :key="char.id"
        class="character-card"
        @click="selectCharacter(char.id)"
      >
        <div class="card-avatar">{{ char.name.charAt(0) }}</div>
        <div class="card-name">{{ char.name }}</div>
        <div class="card-desc">{{ char.background || '暂无设定' }}</div>
        <div class="card-tags" v-if="char.personalityTags?.length">
          <span class="tag" v-for="tag in char.personalityTags.slice(0, 3)" :key="tag">{{ tag }}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" @click.stop="router.push(`/characters/${char.id}/edit`)">编辑</button>
          <button class="btn btn-danger btn-sm" @click.stop="handleDelete(char)">删除</button>
        </div>
      </div>
    </div>

    <ElDialog
      v-model="createDialogVisible"
      title="创建聊天角色"
      width="min(960px, calc(100vw - 48px))"
      class="create-character-dialog"
      align-center
    >
      <div class="create-options">
        <button class="template-card custom-card" @click="createCustom">
          <span class="template-icon">+</span>
          <span class="template-name">自定义角色</span>
          <span class="template-desc">从空白表单开始，自己填写人设、语气和聊天边界。</span>
        </button>
        <button
          v-for="preset in rolePresets"
          :key="preset.id"
          class="template-card"
          @click="usePreset(preset)"
        >
          <span class="template-name">{{ preset.name }}</span>
          <span class="template-desc">{{ preset.description }}</span>
          <span class="template-tags">{{ preset.personalityTags.slice(0, 3).join(' · ') }}</span>
        </button>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElDialog, ElMessage } from 'element-plus'
import { useCharacterStore } from '../stores/character'
import { useConversationStore } from '../stores/conversation'
import type { Character } from '@ai-chat/shared'
import { rolePresets, type RolePreset } from '../local-data/rolePresets'

const router = useRouter()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()
const createDialogVisible = ref(false)

onMounted(async () => {
  await characterStore.loadCharacters()
})

async function selectCharacter(charId: string) {
  characterStore.selectCharacter(charId)
  const conv = conversationStore.conversations.find(c => c.characterId === charId)
  if (conv) {
    conversationStore.selectConversation(conv.id)
  } else {
    const char = characterStore.characters.find(c => c.id === charId)
    if (char) {
      await conversationStore.addConversation({
        characterId: char.id,
        title: `和 ${char.name} 的对话`
      })
    }
  }
  router.push('/')
}

function openCreateDialog() {
  createDialogVisible.value = true
}

function createCustom() {
  createDialogVisible.value = false
  router.push('/characters/new')
}

function usePreset(preset: RolePreset) {
  createDialogVisible.value = false
  ElMessage.success(`已套用「${preset.name}」模板，可继续调整后保存`)
  router.push({
    path: '/characters/new',
    query: { preset: preset.id },
  })
}

async function handleDelete(char: Character) {
  if (confirm(`确定删除角色「${char.name}」吗？`)) {
    await characterStore.deleteCharacter(char.id)
    ElMessage.success(`已删除「${char.name}」`)
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.card-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.create-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.template-card {
  min-height: 144px;
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-card:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.custom-card {
  border-style: dashed;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.template-icon {
  color: var(--accent);
  font-size: 28px;
  line-height: 1;
}

.template-name,
.template-desc,
.template-tags {
  display: block;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
}

.template-desc {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.template-tags {
  margin-top: auto;
  color: var(--text-muted);
  font-size: 11px;
}

:deep(.create-character-dialog) {
  --el-bg-color: var(--bg-secondary);
  --el-text-color-primary: var(--text-primary);
  --el-text-color-regular: var(--text-secondary);
  --el-border-color: var(--border);
  border: 1px solid var(--border);
}

:deep(.create-character-dialog .el-dialog__header) {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

:deep(.create-character-dialog .el-dialog__title) {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
}

:deep(.create-character-dialog .el-dialog__body) {
  padding: 18px 20px 22px;
}

@media (max-width: 720px) {
  .create-options {
    grid-template-columns: 1fr;
  }
}
</style>
