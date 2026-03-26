<template>
  <select 
    :value="value"
    @change="onChange"
    @pointerdown.stop
    class="w-full rounded-[30px] bg-white px-[6px] border border-[#999] text-[110%] box-border"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  data: {
    value: string
    options?: SelectOption[]
  }
}>()

const emit = defineEmits(['change'])

const value = computed(() => props.data?.value || '')
const options = computed(() => props.data?.options || [])

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('change', target.value)
}
</script>
