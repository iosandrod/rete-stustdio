import { GraphService } from '../services/GraphService'
import { DomainNode, NodePosition, NodeType } from '../Node'
import { DomainSocket } from '../Socket'
import { DomainControl } from '../Control'

export interface CreateNodeInput {
  label: string
  position?: NodePosition
  nodeType?: NodeType
}

export interface AddPortInput {
  nodeId: string
  key: string
  socket: DomainSocket
  label?: string
}

export interface AddControlInput {
  nodeId: string
  key: string
  control: DomainControl
}

export interface UpdateNodeDataInput {
  nodeId: string
  data: Record<string, string | number | undefined>
}

export interface MoveNodeInput {
  nodeId: string
  position: NodePosition
}

export class NodeUseCases {
  constructor(private graphService: GraphService) {}

  createNode(input: CreateNodeInput): DomainNode {
    const { label, position = { x: 0, y: 0 }, nodeType = 'unknown' } = input
    return this.graphService.createNode(label, position, nodeType)
  }

  removeNode(nodeId: string): void {
    this.graphService.removeNode(nodeId)
  }

  moveNode(input: MoveNodeInput): void {
    const { nodeId, position } = input
    this.graphService.moveNode(nodeId, position)
  }

  updateNodeData(input: UpdateNodeDataInput): void {
    const { nodeId, data } = input
    this.graphService.updateNodeData(nodeId, data)
  }

  addInputPort(input: AddPortInput): void {
    const { nodeId, key, socket, label = '' } = input
    this.graphService.addInputPort(nodeId, key, socket, label)
  }

  addOutputPort(input: AddPortInput): void {
    const { nodeId, key, socket, label = '' } = input
    this.graphService.addOutputPort(nodeId, key, socket, label)
  }

  addControl(input: AddControlInput): void {
    const { nodeId, key, control } = input
    this.graphService.addControl(nodeId, key, control)
  }

  getNode(nodeId: string): DomainNode | undefined {
    return this.graphService.getGraph().nodes[nodeId]
  }

  getAllNodes(): DomainNode[] {
    return Object.values(this.graphService.getGraph().nodes)
  }
}
