import { DomainConnection } from './Connection'
import { DomainNode } from './Node'

export interface DomainGraph {
  readonly id: string
  readonly nodes: Record<string, DomainNode>
  readonly connections: Record<string, DomainConnection>
  readonly metadata: GraphMetadata
}

export interface GraphMetadata {
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly version: string
}

export function createDomainGraph(): DomainGraph {
  return {
    id: crypto.randomUUID(),
    nodes: {},
    connections: {},
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
    },
  }
}

export function addNode(graph: DomainGraph, node: DomainNode): DomainGraph {
  return {
    ...graph,
    nodes: { ...graph.nodes, [node.id]: node },
    metadata: { ...graph.metadata, updatedAt: new Date() },
  }
}

export function removeNode(graph: DomainGraph, nodeId: string): DomainGraph {
  const { [nodeId]: _, ...remainingNodes } = graph.nodes
  const remainingConnections = Object.fromEntries(
    Object.entries(graph.connections).filter(
      ([_, conn]) => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    )
  )
  return {
    ...graph,
    nodes: remainingNodes,
    connections: remainingConnections,
    metadata: { ...graph.metadata, updatedAt: new Date() },
  }
}

export function updateNode(graph: DomainGraph, nodeId: string, updater: (node: DomainNode) => DomainNode): DomainGraph {
  const node = graph.nodes[nodeId]
  if (!node) return graph
  return {
    ...graph,
    nodes: { ...graph.nodes, [nodeId]: updater(node) },
    metadata: { ...graph.metadata, updatedAt: new Date() },
  }
}

export function addConnection(graph: DomainGraph, connection: DomainConnection): DomainGraph {
  if (!graph.nodes[connection.sourceNodeId] || !graph.nodes[connection.targetNodeId]) {
    return graph
  }
  return {
    ...graph,
    connections: { ...graph.connections, [connection.id]: connection },
    metadata: { ...graph.metadata, updatedAt: new Date() },
  }
}

export function removeConnection(graph: DomainGraph, connectionId: string): DomainGraph {
  const { [connectionId]: _, ...remaining } = graph.connections
  return {
    ...graph,
    connections: remaining,
    metadata: { ...graph.metadata, updatedAt: new Date() },
  }
}

export function getNode(graph: DomainGraph, nodeId: string): DomainNode | undefined {
  return graph.nodes[nodeId]
}

export function getConnection(graph: DomainGraph, connectionId: string): DomainConnection | undefined {
  return graph.connections[connectionId]
}

export function getConnectionsForNode(graph: DomainGraph, nodeId: string): DomainConnection[] {
  return Object.values(graph.connections).filter(
    conn => conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId
  )
}

export function getOutputConnections(graph: DomainGraph, nodeId: string): DomainConnection[] {
  return Object.values(graph.connections).filter(conn => conn.sourceNodeId === nodeId)
}

export function getInputConnections(graph: DomainGraph, nodeId: string): DomainConnection[] {
  return Object.values(graph.connections).filter(conn => conn.targetNodeId === nodeId)
}

export function getChildren(graph: DomainGraph, parentId: string): DomainNode[] {
  return Object.values(graph.nodes).filter(node => node.parentId === parentId)
}

export function cloneGraph(graph: DomainGraph): DomainGraph {
  return {
    ...graph,
    id: crypto.randomUUID(),
    nodes: { ...graph.nodes },
    connections: { ...graph.connections },
    metadata: { ...graph.metadata, createdAt: new Date(), updatedAt: new Date() },
  }
}
