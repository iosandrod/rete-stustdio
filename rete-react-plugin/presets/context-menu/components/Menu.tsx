import * as React from 'react'

import { useDebounce } from '../hooks'
import { Customize, Item } from '../types'
import { $width } from '../vars'
import { ItemElement } from './Item'
import { Search } from './Search'

type Props = {
  items: Item[]
  delay: number
  searchBar?: boolean
  onHide(): void
  components?: Customize
}

export function Menu(props: Props) {
  const [hide, cancelHide] = useDebounce(props.onHide, props.delay)
  const [filter, setFilter] = React.useState('')
  const filterRegexp = new RegExp(filter, 'i')
  const filteredList = props.items.filter(item => item.label.match(filterRegexp))

  return (
    <div
      className="p-2.5 box-border"
      style={{ width: $width, marginTop: '-20px', marginLeft: -$width / 2 }}
      onMouseOver={() => {
        cancelHide()
      }}
      onMouseLeave={() => {
        hide?.()
      }}
      onWheel={(e: React.WheelEvent) => {
        e.stopPropagation()
      }}
      data-testid="context-menu"
    >
      {props.searchBar && (
        <div className="text-white p-1 border-b border-[#222] bg-[#333] cursor-pointer w-full relative first:rounded-tl-[8px] first:rounded-tr-[8px] last:rounded-bl-[8px] last:rounded-br-[8px] hover:bg-[#444]">
          <Search value={filter} onChange={setFilter} component={props.components?.search?.()} />
        </div>
      )}
      {filteredList.map(item => {
        return <ItemElement
          key={item.key}
          data={item}
          delay={props.delay}
          hide={props.onHide}
          components={props.components}
        >
          {item.label}
        </ItemElement>
      })}
    </div>
  )
}
