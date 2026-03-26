import * as React from 'react'

import { ClassicScheme, RenderEmit } from '../types'
import { RefControl } from './refs/RefControl'
import { RefSocket } from './refs/RefSocket'

type NodeExtraData = { width?: number, height?: number }

function sortByIndex<T extends [string, undefined | { index?: number }][]>(entries: T) {
  entries.sort((a, b) => {
    const ai = a[1]?.index || 0
    const bi = b[1]?.index || 0

    return ai - bi
  })
}

type Props<S extends ClassicScheme> = {
  data: S['Node'] & NodeExtraData
  styles?: () => any
  emit: RenderEmit<S>
}
export type NodeComponent<Scheme extends ClassicScheme> = (props: Props<Scheme>) => JSX.Element

export function Node<Scheme extends ClassicScheme>(props: Props<Scheme>) {
  const inputs = Object.entries(props.data.inputs)
  const outputs = Object.entries(props.data.outputs)
  const controls = Object.entries(props.data.controls)
  const selected = props.data.selected || false
  const { id, label, width, height } = props.data

  sortByIndex(inputs)
  sortByIndex(outputs)
  sortByIndex(controls)

  const nodeClasses = [
    'relative',
    'cursor-pointer',
    'select-none',
    'font-arial',
    'leading-normal',
    'pb-1.5',
    'box-border',
    selected
      ? 'bg-[#ffd92c] border-[#e3c000]'
      : 'bg-[rgba(110,136,255,0.8)] border-[#4e58bf]',
    'rounded-[10px]',
    'border-2',
    'user-select-none',
  ].join(' ')

  return (
    <div
      className={nodeClasses}
      style={{ width: width || 180, height: height || 'auto' }}
      data-testid="node"
    >
      <div className="text-white font-sans text-lg p-2" data-testid="title">{label}</div>
      {/* Outputs */}
      {outputs.map(([key, output]) => output && <div className="text-right" key={key} data-testid={`output-${key}`}>
        <div className="text-white font-sans text-sm m-2 inline-block align-middle leading-3">{output.label}</div>
        <div className="text-right -mr-3 inline-block">
          <RefSocket
            name="output-socket"
            side="output"
            socketKey={key}
            nodeId={id}
            emit={props.emit}
            payload={output.socket}
            data-testid="output-socket"
          />
        </div>
      </div>)}
      {/* Controls */}
      {controls.map(([key, control]) => {
        return control
          ? <RefControl
            key={key}
            name="control"
            emit={props.emit}
            payload={control}
            data-testid={`control-${key}`}
          />
          : null
      })}
      {/* Inputs */}
      {inputs.map(([key, input]) => input && <div className="text-left" key={key} data-testid={`input-${key}`}>
        <div className="-ml-3 inline-block">
          <RefSocket
            name="input-socket"
            side="input"
            socketKey={key}
            nodeId={id}
            emit={props.emit}
            payload={input.socket}
            data-testid="input-socket"
          />
        </div>
        {input && (!input.control || !input.showControl)
        && <div className="text-white font-sans text-sm m-2 inline-block align-middle leading-3" data-testid="input-title">{input.label}</div>
        }
        {input.control && input.showControl && (
          <RefControl
            key={key}
            name="input-control"
            emit={props.emit}
            payload={input.control}
            data-testid="input-control"
          />
        )
        }
      </div>)}
    </div>
  )
}
