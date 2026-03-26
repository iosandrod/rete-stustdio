export type DomainEventType =
  | 'node:created'
  | 'node:removed'
  | 'node:updated'
  | 'node:moved'
  | 'node:resized'
  | 'connection:created'
  | 'connection:removed'
  | 'graph:cleared'
  | 'graph:loaded'
  | 'graph:saved'

export interface DomainEvent<T = unknown> {
  readonly id: string
  readonly type: DomainEventType
  readonly timestamp: Date
  readonly payload: T
}

export function createDomainEvent<T>(type: DomainEventType, payload: T): DomainEvent<T> {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date(),
    payload,
  }
}

// Event factory functions for common events
export function nodeCreatedEvent(nodeId: string, label: string): DomainEvent<{ nodeId: string; label: string }> {
  return createDomainEvent('node:created', { nodeId, label })
}

export function nodeRemovedEvent(nodeId: string): DomainEvent<{ nodeId: string }> {
  return createDomainEvent('node:removed', { nodeId })
}

export function nodeMovedEvent(nodeId: string, position: { x: number; y: number }): DomainEvent<{ nodeId: string; position: { x: number; y: number } }> {
  return createDomainEvent('node:moved', { nodeId, position })
}

export function connectionCreatedEvent(connectionId: string, sourceId: string, targetId: string): DomainEvent<{ connectionId: string; sourceId: string; targetId: string }> {
  return createDomainEvent('connection:created', { connectionId, sourceId, targetId })
}

export function connectionRemovedEvent(connectionId: string): DomainEvent<{ connectionId: string }> {
  return createDomainEvent('connection:removed', { connectionId })
}

export function graphClearedEvent(): DomainEvent<null> {
  return createDomainEvent('graph:cleared', null)
}

export function graphLoadedEvent(nodeCount: number, connectionCount: number): DomainEvent<{ nodeCount: number; connectionCount: number }> {
  return createDomainEvent('graph:loaded', { nodeCount, connectionCount })
}
