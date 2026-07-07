<template>
  <div class="tags-input" @click="focusInput">
    <div class="tag-item" v-for="(tag, i) in modelValue" :key="i">
      {{ tag }}
      <span class="tag-remove" @click.stop="removeTag(i)">×</span>
    </div>
    <div style="position:relative;flex:1;min-width:80px">
      <input
        ref="inputRef"
        class="tag-input-field"
        v-model="currentInput"
        @keydown.enter.prevent="addTag"
        @keydown.tab.prevent="addTag"
        @input="showSuggestions = true"
        @focus="showSuggestions = true"
        @blur="delayHideSuggestions"
        placeholder="输入后回车添加"
      />
      <!-- Suggestions dropdown -->
      <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
        <div
          v-for="sug in filteredSuggestions"
          :key="sug"
          class="suggestion-item"
          @mousedown.prevent="addSuggestion(sug)"
        >
          {{ sug }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string[]
  suggestions?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const currentInput = ref('')
const inputRef = ref<HTMLInputElement>()
const showSuggestions = ref(false)

const filteredSuggestions = computed(() => {
  if (!props.suggestions) return []
  return props.suggestions.filter(
    s => !props.modelValue.includes(s) &&
    s.toLowerCase().includes(currentInput.value.toLowerCase())
  )
})

function addTag() {
  const val = currentInput.value.trim()
  if (val && !props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
  }
  currentInput.value = ''
}

function addSuggestion(sug: string) {
  if (!props.modelValue.includes(sug)) {
    emit('update:modelValue', [...props.modelValue, sug])
  }
  showSuggestions.value = false
  currentInput.value = ''
}

function removeTag(i: number) {
  const newTags = [...props.modelValue]
  newTags.splice(i, 1)
  emit('update:modelValue', newTags)
}

function focusInput() {
  inputRef.value?.focus()
}

function delayHideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}
</script>

<style scoped>
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  max-height: 160px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
}

.suggestion-item {
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.suggestion-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
