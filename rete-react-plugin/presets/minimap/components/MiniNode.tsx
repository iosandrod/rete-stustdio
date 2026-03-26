import * as React from 'react'

import { px } from '../utils'

export function MiniNode(props: { left: number, top: number, width: number, height: number }) {
  return (
    <div
      className="absolute bg-[rgba(110,136,255,0.8)] border border-[rgba(192,206,212,0.6)]"
      style={{
        left: px(props.left),
        top: px(props.top),
        width: px(props.width),
        height: px(props.height)
      }}
      data-testid="minimap-node"
    />
  )
}
