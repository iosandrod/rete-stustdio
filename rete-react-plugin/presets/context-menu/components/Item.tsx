import * as React from 'react'

import { useDebounce } from '../hooks'
import { Customize, Item } from '../types'
import { $width } from '../vars'

type Props = {
  data: Item
  delay: number
  hide(): void
  children: React.ReactNode
  components?: Pick<Customize, 'item' | 'subitems'>
}

export function ItemElement(props: Props) {
  const [visibleSubitems, setVisibleSubitems] = React.useState(false)
  const setInvisibile = React.useCallback(() => {
    setVisibleSubitems(false)
  }, [setVisibleSubitems])
  const [hide, cancelHide] = useDebounce(setInvisibile, props.delay)

  return (
    <div
      className="text-white p-1 border-b border-[#222] bg-[#333] cursor-pointer w-full relative first:rounded-tl-[8px] first:rounded-tr-[8px] last:rounded-bl-[8px] last:rounded-br-[8px] hover:bg-[#444]"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        props.data.handler()
        props.hide()
      }}
      onPointerDown={(e: React.PointerEvent) => {
        e.stopPropagation()
      }}
      onPointerOver={() => {
        cancelHide()
        setVisibleSubitems(true)
      }}
      onPointerLeave={() => {
        if (hide) hide()
      }}
      data-testid="context-menu-item"
    >
      {props.children}
      {props.data.subitems && visibleSubitems && (
        <div
          className="absolute top-0 left-full w-[${$width}px]"
          style={{ width: $width }}
        >
          {props.data.subitems.map(item => (
            <ItemElement
              key={item.key}
              data={item}
              delay={props.delay}
              hide={props.hide}
              components={props.components}
            >{item.label}</ItemElement>
          ))}
        </div>
      )}
    </div>
  )
}
