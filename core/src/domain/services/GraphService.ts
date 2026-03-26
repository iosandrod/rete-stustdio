import { createConnection, DomainConnection } from '../Connection'
import { DomainControl } from '../Control'
import { connectionCreatedEvent, connectionRemovedEvent, graphClearedEvent, graphLoadedEvent, nodeCreatedEvent, nodeMovedEvent, nodeRemovedEvent } from '../DomainEvent'
import { DomainBus, domainBus } from '../events/DomainBus'
import { addConnection, addNode, createDomainGraph, DomainGraph, removeConnection, removeNode, updateNode } from '../Graph'
import { DomainNode, NodePosition } from '../Node'
import { createInputPort, createOutputPort } from '../Port'
import { createNormalSocket, DomainSocket } from '../Socket'

export interface GraphServiceOptions {
  eventBus?: DomainBus
}

export class GraphService {
  private graph: DomainGraph
  private eventBus: DomainBus

  constructor(options: GraphServiceOptions = {}) {
    this.graph = createDomainGraph()
    this.eventBus = options.eventBus ?? domainBus
  }

  // Graph state
  getGraph(): DomainGraph {
    return this.graph
  }

  loadGraph(graph: DomainGraph): void {
    this.graph = graph
    this.eventBus.publish(graphLoadedEvent(Object.keys(graph.nodes).length, Object.keys(graph.connections).length))
  }

  clearGraph(): void {
    this.graph = createDomainGraph()
    this.eventBus.publish(graphClearedEvent())
  }

  // Node operations
  createNode(label: string, position: NodePosition = { x: 0, y: 0 }, nodeType: DomainNode['nodeType'] = 'unknown'): DomainNode {
    const node: DomainNode = {
      id: crypto.randomUUID(),
      label,
      nodeType,
      data: {},
      parentId: null,
      inputs: { bind: createInputPort('bind', createNormalSocket('any'), '', true) },
      outputs: { bind: createOutputPort('bind', createNormalSocket('any'), '', true) },
      controls: {},
      width: 200,
      height: 40,
      position,
      frame: null,
    }
    this.graph = addNode(this.graph, node)
    this.eventBus.publish(nodeCreatedEvent(node.id, node.label))
    return node
  }

  removeNode(nodeId: string): void {
    this.graph = removeNode(this.graph, nodeId)
    this.eventBus.publish(nodeRemovedEvent(nodeId))
  }

  moveNode(nodeId: string, position: NodePosition): void {
    this.graph = updateNode(this.graph, nodeId, node => ({
      ...node,
      position,
    }))
    this.eventBus.publish(nodeMovedEvent(nodeId, position))
  }

  updateNodeData(nodeId: string, data: Record<string, string | number | undefined>): void {
    this.graph = updateNode(this.graph, nodeId, node => ({
      ...node,
      data: { ...node.data, ...data },
    }))
  }

  addInputPort(nodeId: string, key: string, socket: DomainSocket, label = ''): void {
    this.graph = updateNode(this.graph, nodeId, node => ({
      ...node,
      inputs: { ...node.inputs, [key]: createInputPort(key, socket, label) },
    }))
  }

  addOutputPort(nodeId: string, key: string, socket: DomainSocket, label = ''): void {
    this.graph = updateNode(this.graph, nodeId, node => ({
      ...node,
      outputs: { ...node.outputs, [key]: createOutputPort(key, socket, label) },
    }))
  }

  addControl(nodeId: string, key: string, control: DomainControl): void {
    this.graph = updateNode(this.graph, nodeId, node => ({
      ...node,
      controls: { ...node.controls, [key]: control },
    }))
  }

  // Connection operations
  connect(
    sourceNodeId: string,
    sourcePortKey: string,
    targetNodeId: string,
    targetPortKey: string,
    options?: { isLoop?: boolean; identifier?: string }
  ): DomainConnection | null {
    const sourceNode = this.graph.nodes[sourceNodeId]
    const targetNode = this.graph.nodes[targetNodeId]

    if (!sourceNode || !targetNode) return null

    // Validate ports exist
    if (!sourceNode.outputs[sourcePortKey] || !targetNode.inputs[targetPortKey]) {
      return null
    }

    const connection = createConnection(sourceNodeId, sourcePortKey, targetNodeId, targetPortKey, options)
    this.graph = addConnection(this.graph, connection)
    this.eventBus.publish(connectionCreatedEvent(connection.id, sourceNodeId, targetNodeId))
    return connection
  }

  disconnect(connectionId: string): void {
    this.graph = removeConnection(this.graph, connectionId)
    this.eventBus.publish(connectionRemovedEvent(connectionId))
  }

  // Layout
  autoLayout(): void {
    // Simple grid-based layout
    const nodes = Object.values(this.graph.nodes)
    const cols = Math.ceil(Math.sqrt(nodes.length))

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      this.moveNode(node.id, { x: col * 300, y: row * 200 })
    })
  }

  // Subscriptions
  subscribe(eventType: string, handler: (event: any) => void): () => void {
    return this.eventBus.subscribe(eventType as any, handler as any)
  }
}
