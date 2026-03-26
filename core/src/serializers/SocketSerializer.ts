import type { JSONControlSocket, JSONRefSocket, JSONSocket } from '../models/Socket'
import { ControlSocket, RefSocket, Socket } from '../models/Socket'

export function SocketSerializer(data: JSONRefSocket | JSONControlSocket | JSONSocket): Socket {
  if ('isRef' in data) {
    return RefSocket.deserialize(data)
  }
  if ('isControl' in data) {
    return ControlSocket.deserialize(data)
  }
  return Socket.deserialize(data)
}
