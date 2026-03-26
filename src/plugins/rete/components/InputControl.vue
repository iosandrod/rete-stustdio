<template>
  <input 
    :value="value"
    @input="onInput"
    @pointerdown.stop
    :type="inputType"
    :readonly="readonly"
    class="w-full rounded-[30px] bg-white px-[6px] border border-[#999] text-[110%] box-border"
    :style="inputStyles"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: {
    value: string | number
    type?: string
    readonly?: boolean
  }
  styles?: (props: typeof props) => string
}>()

const emit = defineEmits(['update'])

const value = computed(() => props.data?.value ?? '')
const inputType = computed(() => props.data?.type || 'text')
const readonly = computed(() => props.data?.readonly || false)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  const val = inputType.value === 'number' ? +target.value : target.value
  emit('update', val)
}
</script>
