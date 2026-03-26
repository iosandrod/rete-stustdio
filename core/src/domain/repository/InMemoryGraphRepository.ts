import { DomainGraph } from '../Graph'
import { DomainRepository } from './DomainRepository'

export class InMemoryGraphRepository implements DomainRepository {
  private graph: DomainGraph | null = null

  async save(graph: DomainGraph): Promise<void> {
    this.graph = { ...graph }
  }

  async load(): Promise<DomainGraph | null> {
    return this.graph ? { ...this.graph } : null
  }

  async clear(): Promise<void> {
    this.graph = null
  }
}
