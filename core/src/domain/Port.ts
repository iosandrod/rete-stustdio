import { DomainSocket } from './Socket'

export type PortSide = 'input' | 'output'

export interface DomainPort {
  readonly id: string
  readonly side: PortSide
  readonly key: string
  readonly label: string
  readonly socket: DomainSocket
  readonly index: number
  readonly multipleConnections: boolean
}

export function createPort(
  side: PortSide,
  key: string,
  socket: DomainSocket,
  label = '',
  index = 0,
  multipleConnections = false
): DomainPort {
  return {
    id: crypto.randomUUID(),
    side,
    key,
    label,
    socket,
    index,
    multipleConnections,
  }
}

export function createInputPort(key: string, socket: DomainSocket, label = '', multipleConnections = false): DomainPort {
  return createPort('input', key, socket, label, 0, multipleConnections)
}

export function createOutputPort(key: string, socket: DomainSocket, label = '', multipleConnections = false): DomainPort {
  return createPort('output', key, socket, label, 0, multipleConnections)
}
