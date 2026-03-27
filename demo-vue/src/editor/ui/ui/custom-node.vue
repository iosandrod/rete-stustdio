<template>
  <div
    class="node"
    :class="{ selected: data.selected }"
    :style="nodeStyles"
    :data-testid="'node'"
  >
    <div class="title" :data-testid="'title'">{{ data.label }}</div>

    <!-- Outputs -->
    <div
      v-for="[key, output] in outputs"
      :key="'output' + key"
      class="output"
      :data-testid="'output-' + key"
    >
      <div class="output-title" :data-testid="'output-title'">{{ output.label }}</div>
      <Ref
        class="output-socket"
        :data="{ type: 'socket', side: 'output', key: key, nodeId: data.id, payload: output.socket }"
        :emit="emit"
        :data-testid="'output-socket'"
      />
    </div>

    <!-- Controls -->
    <Ref
      v-for="[key, control] in controls"
      :key="'control' + key"
      class="control"
      :emit="emit"
      :data="{ type: 'control', payload: control }"
      :data-testid="'control-' + key"
    />

    <!-- Inputs -->
    <div
      v-for="[key, input] in inputs"
      :key="'input' + key"
      class="input"
      :data-testid="'input-' + key"
    >
      <Ref
        class="input-socket"
        :data="{ type: 'socket', side: 'input', key: key, nodeId: data.id, payload: input.socket }"
        :emit="emit"
        :data-testid="'input-socket'"
      />
      <div
        v-if="!input.control || !input.showControl"
        class="input-title"
        :data-testid="'input-title'"
      >
        {{ input.label }}
      </div>
      <Ref
        v-if="input.control && input.showControl"
        class="input-control"
        :emit="emit"
        :data="{ type: 'control', payload: input.control }"
        :data-testid="'input-control'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Ref } from 'rete-vue-plugin'
type NodeExtraData = { width?: number; height?: number; selected?: boolean; label?: string }

interface Props {
  data: NodeExtraData & {
    id: string
    inputs: Record<string, any>
    outputs: Record<string, any>
    controls: Record<string, any>
  }
  emit: (data: any) => void
  seed?: number
}

const props = defineProps<Props>()

function sortByIndex(entries: [string, any][]) {
  return [...entries].sort((a, b) => {
    const ai = a[1]?.index || 0
    const bi = b[1]?.index || 0
    return ai - bi
  })
}

const inputs = computed(() => sortByIndex(Object.entries(props.data.inputs || {})))
const outputs = computed(() => sortByIndex(Object.entries(props.data.outputs || {})))
const controls = computed(() => sortByIndex(Object.entries(props.data.controls || {})))

const nodeStyles = computed(() => ({
  width: Number.isFinite(props.data.width) ? `${props.data.width}px` : '180px',
  height: Number.isFinite(props.data.height) ? `${props.data.height}px` : 'auto',
}))
</script>

<style scoped>
.node {
  background: rgba(110, 136, 255, 0.8);
  border: 2px solid #4e58bf;
  border-radius: 10px;
  cursor: pointer;
  box-sizing: border-box;
  width: 180px;
  height: auto;
  padding-bottom: 6px;
  position: relative;
  user-select: none;
  line-height: initial;
  font-family: Arial;
}

.node:hover {
  background: rgba(110, 136, 255, 0.9);
}

.node.selected {
  background: #ffd92c;
  border-color: #e3c000;
}

.title {
  color: white;
  font-family: sans-serif;
  font-size: 18px;
  padding: 8px;
}

.output {
  text-align: right;
}

.input {
  text-align: left;
}

.output-socket {
  text-align: right;
  margin-right: -15px;
  display: inline-block;
}

.input-socket {
  text-align: left;
  margin-left: -15px;
  display: inline-block;
}

.input-title,
.output-title {
  vertical-align: middle;
  color: white;
  display: inline-block;
  font-family: sans-serif;
  font-size: 14px;
  margin: 8px;
  line-height: 12px;
}

.input-control {
  z-index: 1;
  width: calc(100% - 28px);
  vertical-align: middle;
  display: inline-block;
}

.control {
  padding: 8px 14px;
}
</style>
