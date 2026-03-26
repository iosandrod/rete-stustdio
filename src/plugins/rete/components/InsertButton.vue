<template>
  <button 
    @click="$emit('click')"
    @pointerdown.stop
    class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    +
  </button>
</template>

<script setup lang="ts">
defineEmits(['click'])
</script>
