import { GraphUseCases } from '../usecases/GraphUseCases'
import { NodeUseCases } from '../usecases/NodeUseCases'
import { ConnectionUseCases } from '../usecases/ConnectionUseCases'
import { DomainGraph } from '../Graph'
import { NodePosition, NodeType } from '../Node'
import { DomainSocket } from '../Socket'
import { DomainControl } from '../Control'

/**
 * DomainBridge maps UI actions to domain use cases.
 * UI layer calls bridge methods — bridge delegates to use cases.
 * This keeps all business logic in the domain layer.
 */
export class DomainBridge {
  constructor(
    private graphUseCases: GraphUseCases,
    private nodeUseCases: NodeUseCases,
    private connectionUseCases: ConnectionUseCases
  ) {}

  // Graph-level operations
  loadGraph(graph: DomainGraph): void {
    this.graphUseCases.loadGraph(graph)
  }

  clearGraph(): void {
    this.graphUseCases.clearGraph()
  }

  autoLayout(): void {
    this.graphUseCases.autoLayout()
  }

  async saveGraph(): Promise<void> {
    await this.graphUseCases.save()
  }

  async loadGraphFromRepository(): Promise<DomainGraph | null> {
    return await this.graphUseCases.load()
  }

  // Node operations
  createNode(label: string, position?: NodePosition, nodeType?: NodeType) {
    return this.nodeUseCases.createNode({ label, position, nodeType })
  }

  removeNode(nodeId: string): void {
    this.nodeUseCases.removeNode(nodeId)
  }

  moveNode(nodeId: string, position: NodePosition): void {
    this.nodeUseCases.moveNode({ nodeId, position })
  }

  updateNodeData(nodeId: string, data: Record<string, string | number | undefined>): void {
    this.nodeUseCases.updateNodeData({ nodeId, data })
  }

  addInputPort(nodeId: string, key: string, socket: DomainSocket, label?: string): void {
    this.nodeUseCases.addInputPort({ nodeId, key, socket, label })
  }

  addOutputPort(nodeId: string, key: string, socket: DomainSocket, label?: string): void {
    this.nodeUseCases.addOutputPort({ nodeId, key, socket, label })
  }

  addControl(nodeId: string, key: string, control: DomainControl): void {
    this.nodeUseCases.addControl({ nodeId, key, control })
  }

  // Connection operations
  connect(
    sourceNodeId: string,
    sourcePortKey: string,
    targetNodeId: string,
    targetPortKey: string,
    options?: { isLoop?: boolean; identifier?: string }
  ) {
    return this.connectionUseCases.connect({
      sourceNodeId,
      sourcePortKey,
      targetNodeId,
      targetPortKey,
      options,
    })
  }

  disconnect(connectionId: string): void {
    this.connectionUseCases.disconnect(connectionId)
  }
}
