import { DomainGraph } from '../Graph'

export interface DomainRepository {
  save(graph: DomainGraph): Promise<void>
  load(): Promise<DomainGraph | null>
  clear(): Promise<void>
}
