<template>
  <select
    v-model="currentLang"
    class="lang-select"
    @change="handleChange"
  >
    <option v-for="lang in languages" :key="lang.key" :value="lang.key">
      {{ lang.name }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const languages = [
  { name: 'JavaScript', key: 'javascript' },
  { name: '(template)', key: 'template' },
]

const defaultLang = 'javascript'

const currentLang = ref(defaultLang)

const emit = defineEmits<{
  (e: 'change', lang: string): void
}>()

function handleChange() {
  emit('change', currentLang.value)
}

// Expose for parent components
defineExpose({
  currentLang,
})
</script>

<style scoped>
.lang-select {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  outline: none;
}

.lang-select:hover {
  background: rgba(255, 255, 255, 0.15);
}

.lang-select option {
  background: #1e1e1e;
  color: white;
}
</style>
