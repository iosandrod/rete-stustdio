import { Input, Output } from '../models/Port'
import { JSONInput, JSONOutput } from '../models/Port'
import { Socket } from '../models/Socket'
import { ControlSerializer } from './ControlSerializer'
import { SocketSerializer } from './SocketSerializer'

export function InputSerializer(data: JSONInput): Input<Socket> {
  const socket = SocketSerializer(data.socket)
  const control = data.control ? ControlSerializer(data.control) : undefined
  return Input.deserialize(data, socket, control)
}

export function OutputSerializer(data: JSONOutput): Output<Socket> {
  const socket = SocketSerializer(data.socket)
  const control = data.control ? ControlSerializer(data.control) : undefined
  return Output.deserialize(data, socket, control)
}
