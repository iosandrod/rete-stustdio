<template>
  <div class="playground">
    <!-- Toolbar -->
    <div class="toolbar">
      <button class="toolbar-btn" @click="handleGraphToCode" :disabled="graphToCodeLoading" title="To code">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
      </button>
      <button class="toolbar-btn" @click="handleLayout" title="Layout">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 5v14h18V5H3zm16 12H5V7h14v10z"/></svg>
      </button>
    </div>

    <!-- Main Grid Layout -->
    <div class="layout-grid">
      <!-- Source Code Editor -->
      <div class="source-panel">
        <div ref="sourceEditorRef" class="editor-container" />
        <LangSwitch class="lang-switch" />
        <div v-if="codeToGraphError" class="error-alert">
          {{ codeToGraphError }}
        </div>
      </div>

      <!-- Result Code Editor -->
      <div class="result-panel">
        <div ref="resultEditorRef" class="editor-container" />
        <div v-if="graphToCodeLoading" class="loading-spin">
          <div class="spinner"></div>
        </div>
        <button class="copy-button" @click="handleCopyCode" title="Copy executable code">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </button>
        <div v-if="graphToCodeError" class="error-alert">
          {{ graphToCodeError }}
        </div>
      </div>

      <!-- Canvas Editor -->
      <div class="canvas-panel">
        <div ref="canvasRef" class="canvas-container" />
        <div v-if="codeToGraphLoading" class="loading-spin">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { editor as MonacoEditor } from 'monaco-editor'
import { createEditor } from './editor'
import { tokens } from './theme'
import LangSwitch from './Lang.vue'
import type { LanguageAdapter, LanguageSnippet } from 'rete-studio-core'

// Import workers
import JSWorker from './workers/javascript?worker'
import TemplateWorker from './workers/template?worker'
import { requestable, OnlyMethods } from 'worker-bridge'

const languages: Record<string, OnlyMethods<LanguageAdapter>> = {
  javascript: requestable<LanguageAdapter>(new JSWorker()),
  template: requestable<LanguageAdapter>(new TemplateWorker())
}

type Props = {
  lang: LanguageAdapter
  example: string
  switchLang?: any
}

const props = defineProps<Props>()

// Refs
const sourceEditorRef = ref<HTMLElement | null>(null)
const resultEditorRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

// State
const codeToGraphLoading = ref(false)
const graphToCodeLoading = ref(false)
const codeToGraphError = ref<string | null>(null)
const graphToCodeError = ref<string | null>(null)
const currentCode = ref<string | undefined>()
const executableCode = ref<string | undefined>()

// Editor instances
let sourceEditor: MonacoEditor.IStandaloneCodeEditor | null = null
let resultEditor: MonacoEditor.IStandaloneCodeEditor | null = null
let editor: ReturnType<typeof createEditor> | null = null

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function handleGraphToCode() {
  if (!editor) return
  graphToCodeLoading.value = true
  graphToCodeError.value = null
  try {
    await delay(400)
    const [, code] = await Promise.all([
      delay(400),
      editor.graphToCode()
    ])
    currentCode.value = code
    resultEditor?.setValue(code)
  } catch (e) {
    graphToCodeError.value = (e as Error).message
  } finally {
    graphToCodeLoading.value = false
  }
}

async function handleLayout() {
  if (!editor) return
  await editor.layout()
}

async function handleCopyCode() {
  if (executableCode.value) {
    await navigator.clipboard.writeText(executableCode.value)
    // Show copied feedback via CSS
    const btn = document.querySelector('.copy-button') as HTMLButtonElement
    if (btn) {
      btn.classList.add('copied')
      setTimeout(() => btn.classList.remove('copied'), 1000)
    }
  }
}

onMounted(async () => {
  // Get initial example
  const example = await props.lang.getExample()
  sourceEditor?.setValue(example)

  // Create source editor
  if (sourceEditorRef.value) {
    const monaco = await import('monaco-editor')
    sourceEditor = monaco.editor.create(sourceEditorRef.value, {
      value: example,
      language: 'javascript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      padding: { top: 10 },
    })

    sourceEditor.onDidChangeModelContent(() => {
      const code = sourceEditor?.getValue()
      if (code && editor) {
        codeToGraphLoading.value = true
        codeToGraphError.value = null
        delay(500).then(async () => {
          try {
            await editor!.codeToGraph(code)
            executableCode.value = await editor!.codeToExecutable(code)
            await handleGraphToCode()
          } catch (e) {
            codeToGraphError.value = (e as Error).message
          } finally {
            codeToGraphLoading.value = false
          }
        })
      }
    })
  }

  // Create result editor
  if (resultEditorRef.value) {
    const monaco = await import('monaco-editor')
    resultEditor = monaco.editor.create(resultEditorRef.value, {
      value: '',
      language: 'javascript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      padding: { top: 10 },
      readOnly: true,
    })
  }

  // Create canvas editor
  if (canvasRef.value) {
    const snippets = await props.lang.getSnippets()
    editor = await createEditor(canvasRef.value, snippets, props.lang)
  }
})

onUnmounted(() => {
  editor?.destroy()
  sourceEditor?.dispose()
  resultEditor?.dispose()
})

watch(() => props.example, async (newExample) => {
  if (newExample && sourceEditor) {
    sourceEditor.setValue(newExample)
  }
})
</script>

<style scoped>
.playground {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgb(62, 62, 62);
}

.toolbar {
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 10;
  display: flex;
  gap: 0.5em;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 2fr 3fr;
  grid-template-areas:
    "source result"
    "canvas canvas";
  gap: 0.6em;
  padding: 0.6em;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
}

.source-panel,
.result-panel,
.canvas-panel {
  position: relative;
  border-radius: 1em;
  overflow: hidden;
  border: 2px solid #464646;
  background: #1e1e1e;
  color: white;
}

.source-panel {
  grid-area: source;
}

.result-panel {
  grid-area: result;
}

.canvas-panel {
  grid-area: canvas;
}

.editor-container {
  width: 100%;
  height: 100%;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.lang-switch {
  position: absolute;
  bottom: 1em;
  right: 1em;
  z-index: 10;
}

.copy-button {
  position: absolute;
  bottom: 1em;
  right: 1em;
  z-index: 10;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.copy-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.copy-button.copied {
  background: rgba(76, 175, 80, 0.3);
}

.loading-spin {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  background: rgba(0, 0, 0, 0.3);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-alert {
  position: absolute;
  bottom: 1em;
  left: 1em;
  right: 4em;
  z-index: 14;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.5);
  border-radius: 6px;
  padding: 0.5em 1em;
  color: #ff6b6b;
  font-size: 0.85em;
}

@media (max-height: 500px) {
  .layout-grid {
    grid-template-columns: minmax(300px, 1fr) 3fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      "source canvas"
      "result canvas";
  }
}

@media (max-width: 400px) {
  .layout-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr 1fr;
    grid-template-areas:
      "source"
      "canvas"
      "result";
  }
}
</style>
