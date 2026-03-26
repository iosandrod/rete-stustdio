import * as React from 'react'
import { ClassicPreset } from 'rete'

const SOCKETSIZE = 24
const SOCKETMARGIN = 6

export function Socket<T extends ClassicPreset.Socket>(props: { data: T }) {
  return (
    <div className="inline-block p-1.5 rounded-[18px] hover:border-4 hover:border-white">
      <div
        title={props.data.name}
        className="inline-block cursor-pointer border border-white rounded-full bg-[#96b38a] w-6 h-6 box-border z-10 relative hover:border-[4px]"
      />
    </div>
  )
}
