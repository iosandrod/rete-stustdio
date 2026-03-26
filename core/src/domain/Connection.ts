export type ConnectionRole = 'dataflow' | 'controlflow' | 'reference'

export interface DomainConnection {
  readonly id: string
  readonly sourceNodeId: string
  readonly sourcePortKey: string
  readonly targetNodeId: string
  readonly targetPortKey: string
  readonly isLoop: boolean
  readonly identifier?: string
  readonly secondary: boolean
}

export function createConnection(
  sourceNodeId: string,
  sourcePortKey: string,
  targetNodeId: string,
  targetPortKey: string,
  options?: {
    isLoop?: boolean
    identifier?: string
    secondary?: boolean
  }
): DomainConnection {
  return {
    id: crypto.randomUUID(),
    sourceNodeId,
    sourcePortKey,
    targetNodeId,
    targetPortKey,
    isLoop: options?.isLoop ?? false,
    identifier: options?.identifier,
    secondary: options?.secondary ?? false,
  }
}

export function createLoopConnection(
  sourceNodeId: string,
  sourcePortKey: string,
  targetNodeId: string,
  targetPortKey: string
): DomainConnection {
  return createConnection(sourceNodeId, sourcePortKey, targetNodeId, targetPortKey, { isLoop: true })
}

export function createReferenceConnection(
  sourceNodeId: string,
  sourcePortKey: string,
  targetNodeId: string,
  targetPortKey: string,
  identifier: string
): DomainConnection {
  return createConnection(sourceNodeId, sourcePortKey, targetNodeId, targetPortKey, { identifier })
}
