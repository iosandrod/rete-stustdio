import { JSONEditorData } from '../../serializers'
import { createConnection, DomainConnection } from '../Connection'
import { createInputControl, createInsertControl, createSelectControl, DomainControl } from '../Control'
import { addConnection, addNode, createDomainGraph, DomainGraph } from '../Graph'
import { createDomainNode, DomainNode } from '../Node'
import { createInputPort, createOutputPort } from '../Port'
import { createControlSocket, createNormalSocket, createRefSocket } from '../Socket'

// Runtime → Domain (for loading existing data into domain model)
export function runtimeSocketToDomain(socket: RuntimeJSONSocket): RuntimeDomainSocket {
  if ('isRef' in socket && socket.isRef) {
    return createRefSocket(socket.name, socket.identifier)
  }
  if ('isControl' in socket && socket.isControl) {
    return createControlSocket(socket.name)
  }
  return createNormalSocket(socket.name)
}

export function runtimePortToDomain(port: RuntimeJSONInput | RuntimeJSONOutput, side: 'input' | 'output'): RuntimeDomainPort {
  const socket = runtimeSocketToDomain(port.socket)
  return side === 'input'
    ? createInputPort('input', socket, port.label ?? '', port.multipleConnections ?? false)
    : createOutputPort('output', socket, port.label ?? '', port.multipleConnections ?? false)
}

export function runtimeControlToDomain(control: RuntimeJSONControl): DomainControl {
  if ('isInputControl' in control) {
    return createInputControl(control.action, ((control as any).type ?? 'text') as any, control.value as any, control.readonly, (control as any).allowedTypes)
  }
  if ('isSelectControl' in control) {
    return createSelectControl(control.action, String(control.value ?? ''), control.options ?? [])
  }
  // insert
  return createInsertControl(control.action)
}

export function runtimeNodeToDomain(node: RuntimeJSONBaseNode): DomainNode {
  const fixedFrame = node.frame ? { left: node.frame.left ?? false, right: node.frame.right ?? false } : null
  const domainNode = createDomainNode(node.label, {
    nodeType: node.type,
    data: node.data,
    parentId: node.parent ?? null,
    frame: fixedFrame,
  })

  const inputEntries = Object.entries(node.inputs) as [string, RuntimeJSONInput][]
  const outputEntries = Object.entries(node.outputs) as [string, RuntimeJSONOutput][]
  const controlEntries = Object.entries(node.controls) as [string, RuntimeJSONControl][]

  return {
    ...domainNode,
    id: node.id,
    width: node.width,
    height: node.height,
    inputs: Object.fromEntries(inputEntries.map(([k, v]) => [k, runtimePortToDomain(v, 'input')])),
    outputs: Object.fromEntries(outputEntries.map(([k, v]) => [k, runtimePortToDomain(v, 'output')])),
    controls: Object.fromEntries(controlEntries.map(([k, v]) => [k, runtimeControlToDomain(v)])),
  }
}

export function runtimeConnectionToDomain(conn: RuntimeJSONConnection): DomainConnection {
  return createConnection(
    conn.source,
    String(conn.sourceOutput),
    conn.target,
    String(conn.targetInput),
    { isLoop: conn.isLoop, identifier: conn.identifier, secondary: conn.secondary }
  )
}

export function runtimeGraphToDomain(data: JSONEditorData): DomainGraph {
  let graph = createDomainGraph()

  for (const node of data.nodes as any[]) {
    graph = addNode(graph, runtimeNodeToDomain(node as RuntimeJSONBaseNode))
  }

  for (const conn of data.connections as any[]) {
    graph = addConnection(graph, runtimeConnectionToDomain(conn as RuntimeJSONConnection))
  }

  return graph
}

// Local type aliases to avoid import issues
type RuntimeDomainSocket = ReturnType<typeof createNormalSocket>
type RuntimeDomainPort = ReturnType<typeof createInputPort>

// Inline runtime JSON types
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
