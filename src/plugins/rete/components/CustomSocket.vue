<template>
  <div 
    class="inline-block cursor-pointer"
    :style="{ 
      width: SOCKET_SIZE + 'px', 
      height: SOCKET_SIZE + 'px' 
    }"
    @pointerdown.stop="$emit('startConnection', $event)"
  >
    <div 
      class="w-full h-full rounded-full border-2 border-white"
      :class="{ 'border-yellow-400': multiple }"
      :style="{ backgroundColor: SOCKET_COLOR }"
      :title="name"
    />
  </div>
</template>

<script setup lang="ts">
import { SOCKET_SIZE, SOCKET_COLOR } from '../presets/classic'

defineProps<{
  payload?: unknown
  side: 'input' | 'output'
  socketKey: string
  nodeId: string
  name?: string
  multiple?: boolean
}>()

defineEmits(['startConnection'])
</script>
