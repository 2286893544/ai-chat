<template>
  <ElSelect
    :model-value="modelValue"
    multiple
    filterable
    allow-create
    default-first-option
    :reserve-keyword="false"
    placeholder="选择或输入后回车添加"
    class="tags-input"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="suggestion in suggestions || []"
      :key="suggestion"
      :label="suggestion"
      :value="suggestion"
    />
  </ElSelect>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string[]
  suggestions?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()
</script>

<style scoped>
.tags-input {
  width: 100%;
}
</style>
