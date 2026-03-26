import { ClassicPreset } from 'rete'

import { Control } from './Control'
import { Socket } from './Socket'

export class Input<S extends Socket> extends ClassicPreset.Input<S> {
  control!: Control | null
  alwaysVisibleControl?: boolean

  serialize(): JSONInput {
    return {
      id: this.id,
      label: this.label,
      index: this.index,
      multipleConnections: this.multipleConnections,
      alwaysVisibleControl: this.alwaysVisibleControl,
      socket: this.socket.serialize(),
      control: this.control?.serialize()
    }
  }

  static deserialize(data: JSONInput, socket: Socket, control?: Control) {
    const input = new Input(socket, data.label, data.multipleConnections)

    input.id = data.id
    input.index = data.index
    input.alwaysVisibleControl = data.alwaysVisibleControl
    if (control) input.addControl(control)

    return input
  }
}

export type JSONInput = {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  alwaysVisibleControl?: boolean
  socket: JSONSocket
  control?: JSONControl
}

import { JSONControl } from './Control'
import { JSONSocket } from './Socket'

export class Output<S extends Socket> extends ClassicPreset.Output<S> {
  control?: Control

  addControl(control: Control) {
    this.control = control
  }

  removeControl() {
    this.control = undefined
  }

  serialize(): JSONOutput {
    return {
      id: this.id,
      label: this.label,
      index: this.index,
      multipleConnections: this.multipleConnections,
      socket: this.socket.serialize(),
      control: this.control?.serialize()
    }
  }

  static deserialize(data: JSONOutput, socket: Socket, control?: Control) {
    const output = new Output(socket, data.label, data.multipleConnections)

    output.id = data.id
    output.index = data.index
    if (control) output.addControl(control)

    return output
  }
}

export type JSONOutput = {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  socket: JSONSocket
  control?: JSONControl
}
