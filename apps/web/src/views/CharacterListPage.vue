<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <router-link to="/characters/new" class="btn btn-primary">+ 创建角色</router-link>
    </div>

    <div class="character-grid">
      <div class="character-card character-card-add" @click="router.push('/characters/new')">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import { useConversationStore } from '../stores/conversation'
import type { Character } from '@ai-chat/shared'

const router = useRouter()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()

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

async function handleDelete(char: Character) {
  if (confirm(`确定删除角色「${char.name}」吗？`)) {
    await characterStore.deleteCharacter(char.id)
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
</style>
