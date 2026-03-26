import { DomainControl } from './Control'
import { createInputPort, createOutputPort, DomainPort } from './Port'
import { createNormalSocket } from './Socket'

export type NodeType = 'statement' | 'expression' | 'unknown'

export interface DomainNode {
  readonly id: string
  readonly label: string
  readonly nodeType: NodeType
  readonly data: Record<string, string | number | undefined>
  readonly parentId: string | null
  readonly inputs: Record<string, DomainPort>
  readonly outputs: Record<string, DomainPort>
  readonly controls: Record<string, DomainControl>
  readonly width: number
  readonly height: number
  readonly position: { x: number; y: number }
  readonly frame: { left: boolean; right: boolean } | null
}

export interface NodePosition {
  x: number
  y: number
}

function calculateNodeSize(label: string, inputCount: number, outputCount: number, controlCount: number): { width: number; height: number } {
  const labelWidth = label.length * 12
  const portAreaWidth = Math.max(inputCount, outputCount) * 36
  const controlHeight = controlCount * 36
  const height = 40 + portAreaWidth + controlHeight + 5
  const width = Math.max(labelWidth, 100) + 50
  return { width, height }
}

export function createDomainNode(
  label: string,
  options?: {
    nodeType?: NodeType
    data?: Record<string, string | number | undefined>
    parentId?: string | null
    position?: NodePosition
    frame?: { left: boolean; right: boolean } | null
  }
): DomainNode {
  const nodeType = options?.nodeType ?? 'unknown'
  const data = options?.data ?? {}
  const parentId = options?.parentId ?? null
  const position = options?.position ?? { x: 0, y: 0 }
  const frame = options?.frame ?? null

  // Initialize with default bind port
  const bindSocket = createNormalSocket('any')
  const inputs: Record<string, DomainPort> = {
    bind: createInputPort('bind', bindSocket, '', true),
  }
  const outputs: Record<string, DomainPort> = {
    bind: createOutputPort('bind', bindSocket, '', true),
  }

  const { width, height } = calculateNodeSize(label, 1, 1, 0)

  return {
    id: crypto.randomUUID(),
    label,
    nodeType,
    data,
    parentId,
    inputs,
    outputs,
    controls: {},
    width,
    height,
    position,
    frame,
  }
}

export function addInputPort(node: DomainNode, port: DomainPort): DomainNode {
  const inputs = { ...node.inputs, [port.key]: port }
  const { width, height } = calculateNodeSize(node.label, Object.keys(inputs).length, Object.keys(node.outputs).length, Object.keys(node.controls).length)
  return { ...node, inputs, width, height }
}

export function addOutputPort(node: DomainNode, port: DomainPort): DomainNode {
  const outputs = { ...node.outputs, [port.key]: port }
  const { width, height } = calculateNodeSize(node.label, Object.keys(node.inputs).length, Object.keys(outputs).length, Object.keys(node.controls).length)
  return { ...node, outputs, width, height }
}

export function addControl(node: DomainNode, key: string, control: DomainControl): DomainNode {
  const controls = { ...node.controls, [key]: control }
  const { width, height } = calculateNodeSize(node.label, Object.keys(node.inputs).length, Object.keys(node.outputs).length, Object.keys(controls).length)
  return { ...node, controls, width, height }
}

export function updateNodeData(node: DomainNode, data: Record<string, string | number | undefined>): DomainNode {
  return { ...node, data: { ...node.data, ...data } }
}

export function moveNode(node: DomainNode, position: NodePosition): DomainNode {
  return { ...node, position }
}

export function updateNodeSize(node: DomainNode): DomainNode {
  const { width, height } = calculateNodeSize(node.label, Object.keys(node.inputs).length, Object.keys(node.outputs).length, Object.keys(node.controls).length)
  return { ...node, width, height }
}
