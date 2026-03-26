import { DomainEvent, DomainEventType } from '../DomainEvent'

type EventHandler<T = unknown> = (event: DomainEvent<T>) => void

export class DomainBus {
  private handlers = new Map<DomainEventType, Set<EventHandler>>()

  subscribe<T>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler as EventHandler)
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler)
    }
  }

  subscribeAll(handler: EventHandler): () => void {
    const unsubscribers: (() => void)[] = []
    const allTypes: DomainEventType[] = [
      'node:created', 'node:removed', 'node:updated', 'node:moved', 'node:resized',
      'connection:created', 'connection:removed',
      'graph:cleared', 'graph:loaded', 'graph:saved',
    ]
    for (const type of allTypes) {
      unsubscribers.push(this.subscribe(type, handler))
    }
    return () => unsubscribers.forEach(unsub => unsub())
  }

  publish<T>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (e) {
          console.error(`[DomainBus] Handler error for event ${event.type}:`, e)
        }
      })
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}

export const domainBus = new DomainBus()
