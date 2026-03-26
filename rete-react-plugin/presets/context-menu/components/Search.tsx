import * as React from 'react'

import { ComponentType } from '../types'

type Props = {
  value: string
  onChange(value: string): void
  component?: ComponentType
}

export function Search(props: Props) {
  const Component = props.component || 'input'

  return (
    <Component
      value={props.value}
      onInput={(e: React.FormEvent<HTMLInputElement>) => {
        props.onChange((e.target as HTMLInputElement).value)
      }}
      onPointerDown={(e: React.PointerEvent) => {
        e.stopPropagation()
      }}
      data-testid="context-menu-search-input"
      className="text-white p-0.5 px-2 border border-white rounded-[10px] text-base font-serif w-full box-border bg-transparent"
    />
  )
}
