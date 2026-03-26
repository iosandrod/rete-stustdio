import { JSONEditorData } from '../../serializers'
import { DomainConnection } from '../Connection'
import { DomainControl, InputControl, SelectControl } from '../Control'
import { DomainGraph } from '../Graph'
import { DomainNode } from '../Node'
import { DomainPort } from '../Port'
import { DomainSocket } from '../Socket'

// Domain → Runtime (for UI rendering via existing Rete renderer)
export function domainNodeToRuntime(node: DomainNode): RuntimeJSONBaseNode {
  return {
    id: node.id,
    label: node.label,
    width: node.width,
    height: node.height,
    parent: node.parentId ?? undefined,
    data: node.data,
    frame: node.frame ?? undefined,
    type: node.nodeType,
    inputs: Object.fromEntries(
      Object.entries(node.inputs).map(([k, v]) => [k, domainPortToRuntime(v)])
    ),
    outputs: Object.fromEntries(
      Object.entries(node.outputs).map(([k, v]) => [k, domainPortToRuntime(v)])
    ),
    controls: Object.fromEntries(
      Object.entries(node.controls).map(([k, v]) => [k, domainControlToRuntime(v)])
    ),
  }
}

export function domainPortToRuntime(port: DomainPort): RuntimeJSONInput | RuntimeJSONOutput {
  return {
    id: port.id,
    label: port.label,
    index: port.index,
    multipleConnections: port.multipleConnections,
    socket: domainSocketToRuntime(port.socket),
  }
}

export function domainSocketToRuntime(socket: DomainSocket): RuntimeJSONSocket {
  if (socket.kind === 'ref') {
    return { name: socket.name, isRef: true, identifier: socket.identifier }
  }
  if (socket.kind === 'control') {
    return { name: socket.name, isControl: true }
  }
  return { name: socket.name }
}

export function domainControlToRuntime(control: DomainControl): RuntimeJSONControl {
  if (control.kind === 'input') {
    const c = control as InputControl
    return {
      id: control.id,
      isInputControl: true,
      action: control.action,
      type: c.inputType,
      value: c.value,
      readonly: c.readonly,
      allowedTypes: c.allowedTypes,
    }
  }
  if (control.kind === 'select') {
    const c = control as SelectControl
    return {
      id: control.id,
      isSelectControl: true,
      action: control.action,
      value: c.value,
      options: c.options,
    }
  }
  // insert
  return {
    id: control.id,
    isInsertControl: true,
    action: control.action,
  }
}

export function domainConnectionToRuntime(conn: DomainConnection): RuntimeJSONConnection {
  return {
    id: conn.id,
    source: conn.sourceNodeId,
    target: conn.targetNodeId,
    sourceOutput: conn.sourcePortKey,
    targetInput: conn.targetPortKey,
    isLoop: conn.isLoop,
    identifier: conn.identifier,
    secondary: conn.secondary,
  }
}

export function domainGraphToRuntime(graph: DomainGraph): JSONEditorData {
  const nodes = Object.values(graph.nodes) as DomainNode[]
  const connections = Object.values(graph.connections) as DomainConnection[]
  return {
    nodes: nodes.map(domainNodeToRuntime),
    connections: connections.map(domainConnectionToRuntime),
  } as unknown as JSONEditorData
}

// Inline runtime JSON types (matching existing models)
interface RuntimeJSONBaseNode {
  id: string
  label: string
  width: number
  height: number
  parent?: string
  data: Record<string, string | number | undefined>
  frame?: { left?: boolean; right?: boolean }
  type: 'statement' | 'expression' | 'unknown'
  inputs: Record<string, RuntimeJSONInput>
  outputs: Record<string, RuntimeJSONOutput>
  controls: Record<string, RuntimeJSONControl>
}

interface RuntimeJSONInput {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  socket: RuntimeJSONSocket
  control?: RuntimeJSONControl
}

interface RuntimeJSONOutput {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  socket: RuntimeJSONSocket
  control?: RuntimeJSONControl
}

interface RuntimeJSONSocket {
  name: string
  isRef?: true
  isControl?: true
  identifier?: string
}

interface RuntimeJSONControl {
  id: string
  isInputControl?: true
  isSelectControl?: true
  isInsertControl?: true
  action: string | [string, object]
  type?: string
  value?: string | number | boolean | null
  readonly?: boolean
  allowedTypes?: string[]
  options?: { value: string; label: string }[]
}

interface RuntimeJSONConnection {
  id: string
  source: string
  target: string
  sourceOutput: string | number | symbol
  targetInput: string | number | symbol
  isLoop?: boolean
  identifier?: string
  secondary?: boolean
}
