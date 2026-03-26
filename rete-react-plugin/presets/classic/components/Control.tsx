import * as React from 'react'
import { ClassicPreset } from 'rete'

import { Drag } from '../../../shared'

type Props<N extends 'text' | 'number'> = {
  data: ClassicPreset.InputControl<N>
  styles?: (props: any) => any
}

export function Control<N extends 'text' | 'number'>(props: Props<N>) {
  const [value, setValue] = React.useState(props.data.value)
  const ref = React.useRef<HTMLInputElement>(null)

  Drag.useNoDrag(ref as React.MutableRefObject<HTMLElement | null>)

  React.useEffect(() => {
    setValue(props.data.value)
  }, [props.data.value])

  return (
    <input
      value={value}
      type={props.data.type}
      ref={ref}
      readOnly={props.data.readonly}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const val = (props.data.type === 'number'
          ? +e.target.value
          : e.target.value) as typeof props.data['value']

        setValue(val)
        props.data.setValue(val)
      }}
      className="w-full rounded-3xl bg-white p-0.5 px-1.5 border border-gray-400 text-base box-border"
    />
  )
}
