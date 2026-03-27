<template>
  <div id="app">
    <Playground
      v-if="lang"
      :lang="lang"
      :example="playgroundExample"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Playground from './Playground.vue'
import type { LanguageAdapter } from 'rete-studio-core'

// Import workers
import JSWorker from './workers/javascript?worker'
import TemplateWorker from './workers/template?worker'
import { requestable, OnlyMethods } from 'worker-bridge'

const languages: Record<string, OnlyMethods<LanguageAdapter>> = {
  javascript: requestable<LanguageAdapter>(new JSWorker()),
  template: requestable<LanguageAdapter>(new TemplateWorker())
}

const currentLangKey = ref('javascript')
const lang = computed(() => languages[currentLangKey.value])
const playgroundExample = ref('')

onMounted(async () => {
  const example = await lang.value.getExample()
  playgroundExample.value = example
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Montserrat', sans-serif;
  background: rgb(62, 62, 62);
}
</style>
