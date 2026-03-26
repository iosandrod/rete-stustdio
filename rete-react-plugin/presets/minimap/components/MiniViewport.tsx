import * as React from 'react'

import { useDrag } from '../../../shared/drag'
import { Rect, Transform, Translate } from '../types'
import { px } from '../utils'

export function MiniViewport(props: Rect & { containerWidth: number, start(): Transform, translate: Translate }) {
  const scale = (v: number) => v * props.containerWidth
  const invert = (v: number) => v / props.containerWidth
  const drag = useDrag((dx, dy) => {
    props.translate(invert(-dx), invert(-dy))
  }, e => ({ x: e.pageX, y: e.pageY }))

  return (
    <div
      className="absolute bg-[rgba(255,251,128,0.32)] border border-[#ffe52b]"
      onPointerDown={drag.start}
      style={{
        left: px(scale(props.left)),
        top: px(scale(props.top)),
        width: px(scale(props.width)),
        height: px(scale(props.height))
      }}
      data-testid="minimap-viewport"
    />
  )
}
