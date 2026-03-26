import { DomainGraph } from '../Graph'
import { DomainEvent, DomainEventType } from '../DomainEvent'
import { GraphUseCases } from '../usecases/GraphUseCases'

type SnapshotListener = (graph: DomainGraph) => void
type EventListener = (event: DomainEvent) => void

/**
 * DomainStore is a read-only reactive snapshot of the domain graph.
 * UI layer reads from this store — it never mutates domain state directly.
 * All mutations go through DomainBridge → Use Cases → Domain.
 */
export class DomainStore {
  private graph: DomainGraph
  private graphUseCases: GraphUseCases
  private snapshotListeners: Set<SnapshotListener> = new Set()
  private eventListeners: Set<EventListener> = new Set()
  private unsubscribe: (() => void) | null = null

  constructor(graphUseCases: GraphUseCases) {
    this.graphUseCases = graphUseCases
    this.graph = graphUseCases.getGraph()
    this.subscribeToDomainEvents()
  }

  private subscribeToDomainEvents() {
    this.unsubscribe = this.graphUseCases.subscribe('*', (event: DomainEvent) => {
      this.graph = this.graphUseCases.getGraph()
      this.notifySnapshot()
      this.notifyEventListeners(event)
    })
  }

  private notifySnapshot() {
    this.snapshotListeners.forEach(listener => listener(this.graph))
  }

  private notifyEventListeners(event: DomainEvent) {
    this.eventListeners.forEach(listener => listener(event))
  }

  /** Get current graph snapshot */
  getGraph(): DomainGraph {
    return this.graph
  }

  /** Get node by ID */
  getNode(nodeId: string) {
    return this.graph.nodes[nodeId]
  }

  /** Get connection by ID */
  getConnection(connectionId: string) {
    return this.graph.connections[connectionId]
  }

  /** Get all nodes */
  getNodes() {
    return Object.values(this.graph.nodes)
  }

  /** Get all connections */
  getConnections() {
    return Object.values(this.graph.connections)
  }

  /** Subscribe to graph snapshots (fires on any domain change) */
  onUpdate(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener)
    return () => this.snapshotListeners.delete(listener)
  }

  /** Subscribe to specific domain events */
  onEvent(eventType: DomainEventType, listener: EventListener): () => void {
    const wrappedListener = (event: DomainEvent) => {
      if (event.type === eventType) listener(event)
    }
    this.eventListeners.add(wrappedListener)
    return () => this.eventListeners.delete(wrappedListener)
  }

  /** Subscribe to all domain events */
  onAnyEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  /** Get underlying use cases (for bridge use only) */
  getUseCases(): GraphUseCases {
    return this.graphUseCases
  }

  destroy() {
    this.unsubscribe?.()
    this.snapshotListeners.clear()
    this.eventListeners.clear()
  }
}
