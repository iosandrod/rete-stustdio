import * as React from 'react'

import { ClassicScheme } from '../types'
import { useConnection } from './ConnectionWrapper'

type Props = {
  data: ClassicScheme['Connection'] & { isLoop?: boolean }
  styles?: (props: any) => any
}

export function Connection(props: Props) {
  const { path } = useConnection()

  if (!path) return null

  return (
    <svg
      data-testid="connection"
      className="!overflow-visible absolute pointer-events-none"
      style={{ width: '9999px', height: '9999px' }}
    >
      <path
        d={path}
        fill="none"
        strokeWidth={5}
        stroke="steelblue"
        pointerEvents="auto"
      />
    </svg>
  )
}
