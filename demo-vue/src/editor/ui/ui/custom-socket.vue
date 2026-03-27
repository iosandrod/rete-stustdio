<template>
  <div class="socket-wrapper">
    <div
      class="socket"
      :class="{ multiple: data.multiple }"
      :title="data.name"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: {
    name: string
    multiple?: boolean
  }
}

defineProps<Props>()
</script>

<style scoped>
.socket-wrapper {
  display: inline-block;
  cursor: pointer;
  border-radius: 12px;
  padding: 6px;
}

.socket-wrapper:hover .socket {
  border-width: 4px;
}

.socket {
  border: 1px solid white;
  border-radius: 12px;
  width: 24px;
  height: 24px;
  vertical-align: middle;
  background: #96b38a;
  z-index: 2;
  box-sizing: border-box;
}

.socket.multiple {
  border-color: yellow;
}
</style>
