<template>
  <div class="character-panel">
    <div v-if="character" class="panel-header">
      <div class="character-avatar">{{ character.name.charAt(0) }}</div>
      <div class="panel-name">{{ character.name }}</div>
      <div class="panel-desc">{{ character.background }}</div>
    </div>
    <div v-else class="panel-header">
      <div class="character-avatar" style="opacity:0.3">?</div>
      <div class="panel-name" style="color:var(--text-muted)">未选择角色</div>
      <div class="panel-desc">请先创建一个角色</div>
    </div>

    <div class="panel-section">
      <div class="panel-label">切换角色</div>
      <div v-if="characters.length > 0">
        <div
          v-for="char in characters"
          :key="char.id"
          class="conv-item"
          :class="{ active: char.id === character?.id }"
          @click="handleSwitchCharacter(char.id)"
          style="padding:8px"
        >
          <div class="conv-item-title">{{ char.name }}</div>
          <div class="conv-item-meta">{{ char.personalityTags?.slice(0,3).join(' · ') }}</div>
        </div>
      </div>
      <div v-else style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px">
        暂无角色
      </div>
      <ElButton class="panel-action" @click="router.push('/characters')">
        管理角色
      </ElButton>
    </div>

    <div class="panel-section">
      <div class="panel-label">设置</div>
      <div class="toggle-row">
        <span>主动聊天</span>
        <ElSwitch :model-value="proactiveEnabled" @update:model-value="emit('updateProactive', $event)" />
      </div>
      <div class="toggle-row">
        <span>自动朗读</span>
        <ElSwitch :model-value="autoSpeakEnabled" @update:model-value="emit('updateAutoSpeak', $event)" />
      </div>

      <div v-if="character" style="margin-top:16px">
        <div class="panel-label">角色信息</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
          <span class="tag" v-for="t in character.personalityTags" :key="t">{{ t }}</span>
        </div>
        <div v-if="character.hobbies?.length" style="margin-top:8px">
          <div class="panel-label" style="font-size:10px">爱好</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            <span class="tag" v-for="h in character.hobbies.slice(0,5)" :key="h">{{ h }}</span>
          </div>
        </div>
        <ElButton class="panel-action panel-action-spaced" @click="emit('editCharacter')">
          编辑角色
        </ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import { useConversationStore } from '../stores/conversation'
import type { Character, Conversation } from '@ai-chat/shared'

const props = defineProps<{
  character: Character | null
  conversation: Conversation | null
  proactiveEnabled: boolean
  autoSpeakEnabled: boolean
}>()

const emit = defineEmits<{
  updateProactive: [enabled: boolean]
  updateAutoSpeak: [enabled: boolean]
  editCharacter: []
}>()

const router = useRouter()
const characterStore = useCharacterStore()
const conversationStore = useConversationStore()

const characters = computed(() => characterStore.characters)

async function handleSwitchCharacter(charId: string) {
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
}
</script>

<style scoped>
.panel-action {
  width: 100%;
  margin-top: 8px;
  --el-button-bg-color: #14213c;
  --el-button-border-color: #3a4e76;
  --el-button-text-color: #cbd3e2;
  --el-button-hover-bg-color: #1c2b4d;
  --el-button-hover-border-color: #716aff;
  --el-button-hover-text-color: #fff;
}

.panel-action-spaced {
  margin-top: 12px;
}
</style>
