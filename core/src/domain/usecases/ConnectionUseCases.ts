import { GraphService } from '../services/GraphService'
import { DomainConnection } from '../Connection'

export interface ConnectInput {
  sourceNodeId: string
  sourcePortKey: string
  targetNodeId: string
  targetPortKey: string
  options?: {
    isLoop?: boolean
    identifier?: string
  }
}

export class ConnectionUseCases {
  constructor(private graphService: GraphService) {}

  connect(input: ConnectInput): DomainConnection | null {
    const { sourceNodeId, sourcePortKey, targetNodeId, targetPortKey, options } = input
    return this.graphService.connect(sourceNodeId, sourcePortKey, targetNodeId, targetPortKey, options)
  }

  disconnect(connectionId: string): void {
    this.graphService.disconnect(connectionId)
  }

  getConnection(connectionId: string): DomainConnection | undefined {
    return this.graphService.getGraph().connections[connectionId]
  }

  getAllConnections(): DomainConnection[] {
    return Object.values(this.graphService.getGraph().connections)
  }

  getNodeConnections(nodeId: string): DomainConnection[] {
    return Object.values(this.graphService.getGraph().connections).filter(
      conn => conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId
    )
  }
}
