import { GraphService } from '../services/GraphService'
import { GraphUseCases } from '../usecases/GraphUseCases'
import { NodeUseCases } from '../usecases/NodeUseCases'
import { ConnectionUseCases } from '../usecases/ConnectionUseCases'
import { DomainRepository } from '../repository/DomainRepository'
import { DomainStore } from './DomainStore'
import { DomainBridge } from './DomainBridge'

/**
 * Creates a DomainStore and DomainBridge sharing the same GraphUseCases instance.
 * This is the single entry point for the UI layer to interact with the domain.
 */
export function createDomainLayer(repository?: DomainRepository): {
  store: DomainStore
  bridge: DomainBridge
} {
  const graphService = new GraphService()
  const graphUseCases = new GraphUseCases(graphService, repository)
  const nodeUseCases = new NodeUseCases(graphService)
  const connectionUseCases = new ConnectionUseCases(graphService)

  const store = new DomainStore(graphUseCases)
  const bridge = new DomainBridge(graphUseCases, nodeUseCases, connectionUseCases)

  return { store, bridge }
}

export { DomainStore } from './DomainStore'
export { DomainBridge } from './DomainBridge'
