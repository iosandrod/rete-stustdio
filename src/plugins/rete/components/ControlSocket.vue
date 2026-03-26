<template>
  <div class="inline-block cursor-pointer">
    <div 
      class="w-3 h-3 rounded-full bg-blue-400 border border-white"
      title="Control"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  payload?: unknown
  side: 'input' | 'output'
}>()
</script>
