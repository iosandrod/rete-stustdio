import { GraphService } from '../services/GraphService'
import { DomainGraph } from '../Graph'
import { DomainRepository } from '../repository/DomainRepository'

export interface SaveGraphInput {
  repository: DomainRepository
}

export class GraphUseCases {
  constructor(
    private graphService: GraphService,
    private repository?: DomainRepository
  ) {}

  loadGraph(graph: DomainGraph): void {
    this.graphService.loadGraph(graph)
  }

  clearGraph(): void {
    this.graphService.clearGraph()
  }

  autoLayout(): void {
    this.graphService.autoLayout()
  }

  getGraph(): DomainGraph {
    return this.graphService.getGraph()
  }

  async save(): Promise<void> {
    if (!this.repository) {
      throw new Error('Repository not configured')
    }
    await this.repository.save(this.graphService.getGraph())
  }

  async load(): Promise<DomainGraph | null> {
    if (!this.repository) {
      throw new Error('Repository not configured')
    }
    const graph = await this.repository.load()
    if (graph) {
      this.graphService.loadGraph(graph)
    }
    return graph
  }

  subscribe(eventType: string, handler: (event: any) => void): () => void {
    return this.graphService.subscribe(eventType, handler)
  }
}
