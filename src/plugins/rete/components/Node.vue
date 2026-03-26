<template>
  <div 
    :class="[
      'relative flex flex-col rounded-[10px] min-w-[120px]',
      'bg-[rgba(110,136,255,0.8)] border-2 border-[#4e58bf]',
      selected ? 'bg-[#ffd92c] border-[#e3c000]' : ''
    ]"
    :style="{ 
      width: (data.width || NODE_WIDTH) + 'px', 
      height: data.height ? data.height + 'px' : 'auto' 
    }"
    data-testid="node"
  >
    <div class="title text-white text-[18px] p-2 font-sans">
      {{ data.label }}
    </div>
    
    <!-- Outputs -->
    <div v-for="(output, key) in outputs" :key="key" class="output text-right">
      <span v-if="output" class="text-white text-[14px] align-middle mx-[6px]">{{ output.label }}</span>
      <span class="inline-block w-[12px] h-[12px] rounded-full bg-[#96b38a] border border-white align-middle" />
    </div>
    
    <!-- Controls -->
    <div v-for="(control, key) in controls" :key="key">
      <template v-if="control">
        <!-- Control rendering handled by separate component -->
      </template>
    </div>
    
    <!-- Inputs -->
    <div v-for="(input, key) in inputs" :key="key" class="input text-left">
      <span class="inline-block w-[12px] h-[12px] rounded-full bg-[#96b38a] border border-white align-middle" />
      <span v-if="input && (!input.control || !input.showControl)" class="text-white text-[14px] align-middle mx-[6px]">{{ input.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SOCKET_SIZE, SOCKET_MARGIN, NODE_WIDTH } from '../presets/classic'

interface NodeData {
  id: string
  label: string
  width?: number
  height?: number
  selected?: boolean
  inputs?: Record<string, { label?: string; control?: unknown; showControl?: boolean; socket?: unknown }>
  outputs?: Record<string, { label?: string; control?: unknown; showControl?: boolean; socket?: unknown }>
  controls?: Record<string, unknown>
}

const props = defineProps<{
  data: NodeData
}>()

const inputs = computed(() => props.data.inputs || {})
const outputs = computed(() => props.data.outputs || {})
const controls = computed(() => props.data.controls || {})
const selected = computed(() => props.data.selected || false)
</script>
