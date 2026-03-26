<template>
  <div class="h-screen grid grid-cols-2 gap-2 p-2 box-border overflow-hidden bg-gray-800">
    <!-- Source Code Panel -->
    <Area class-name="relative">
      <CodeEditor 
        v-model="sourceCode" 
        :language="'javascript'"
      />
      <Alert v-model="codeToGraphError" />
    </Area>

    <!-- Result Code Panel -->
    <Area class-name="relative">
      <Spin :spinning="graphToCodeLoading" />
      <CodeEditor 
        :model-value="resultCode" 
        :readonly="true"
        :language="'javascript'"
      />
      <CopyCode :value="executableCode || ''" />
      <Alert v-model="graphToCodeError" />
    </Area>

    <!-- Graph Canvas Panel -->
    <Area class-name="col-span-2 relative">
      <Spin :spinning="codeToGraphLoading" />
      <GraphCanvas ref="graphRef" :lang="lang" />
    </Area>
  </div>
  </template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { LanguageAdapter } from 'rete-studio-core'
import Area from './shared/Area.vue'
import Spin from './shared/Spin.vue'
import Alert from './shared/Alert.vue'
import CopyCode from './shared/CopyCode.vue'
import CodeEditor from './CodeEditor.vue'
import GraphCanvas from './GraphCanvas.vue'

const props = defineProps<{
  lang: LanguageAdapter
  example: string
}>()

const sourceCode = ref(props.example)
const resultCode = ref('')
const executableCode = ref('')
const graphRef = ref<InstanceType<typeof GraphCanvas> | null>(null)

// Error states
const codeToGraphError = ref('')
const graphToCodeError = ref('')
const codeToGraphLoading = ref(false)
const graphToCodeLoading = ref(false)

onMounted(async () => {
  // Load example code
  sourceCode.value = props.example
  resultCode.value = props.example
  
  // Try to get example from language adapter
  if (props.lang) {
    try {
      const example = await props.lang.getExample()
      if (example) {
        sourceCode.value = example
        resultCode.value = example
      }
    } catch (e) {
      console.error('Failed to get example:', e)
    }
  }
})

watch(() => props.example, (val) => {
  sourceCode.value = val
  resultCode.value = val
})

// Watch source code changes and trigger code to graph
watch(sourceCode, async (newCode) => {
  if (!newCode || !props.lang) return
  
  codeToGraphLoading.value = true
  codeToGraphError.value = ''
  
  try {
    // Use the graph ref to convert code to graph
    if (graphRef.value) {
      await graphRef.value.codeToGraph(newCode)
    }
    
    // Then convert graph back to code
    graphToCodeLoading.value = true
    if (graphRef.value) {
      resultCode.value = await graphRef.value.graphToCode()
    }
    
    // Get executable code
    executableCode.value = await props.lang.codeToExecutable(resultCode.value)
  } catch (e) {
    codeToGraphError.value = (e as Error).message
  } finally {
    codeToGraphLoading.value = false
    graphToCodeLoading.value = false
  }
}, { debounce: 500 } as any)
</script>
