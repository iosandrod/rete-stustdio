// Domain value object for socket (connection point)
export type SocketKind = 'normal' | 'ref' | 'control'

export interface DomainSocket {
  readonly id: string
  readonly name: string
  readonly kind: SocketKind
  readonly identifier?: string // only for ref sockets
}

export function createSocket(name: string, kind: SocketKind = 'normal', identifier?: string): DomainSocket {
  return {
    id: crypto.randomUUID(),
    name,
    kind,
    identifier,
  }
}

export function createNormalSocket(name = 'any'): DomainSocket {
  return createSocket(name, 'normal')
}

export function createRefSocket(name: string, identifier?: string): DomainSocket {
  return createSocket(name, 'ref', identifier)
}

export function createControlSocket(name: string): DomainSocket {
  return createSocket(name, 'control')
}
