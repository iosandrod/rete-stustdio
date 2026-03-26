/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Socket } from 'rete-studio-core'

const $socketmargin = 8
const $socketsize = 20

export function CustomSocket<T extends Socket>(props: { data: T }) {
  return (
    <div
      className="inline-flex p-2 rounded-[18px] hover:border-4 hover:border-white"
      style={{ display: 'inline-flex', padding: $socketmargin }}
    >
      <div
        title={props.data.name}
        className="inline-block cursor-pointer border border-white rounded-full bg-white/[0.28] w-5 h-5 align-middle box-border z-20 hover:border-[4px]"
      />
    </div>
  )
}

export function ControlSocketComponent<T extends Socket>(_props: { data: T }) {
  return (
    <div
      className="inline-flex p-2 rounded-[18px]"
      style={{ display: 'inline-flex', padding: $socketmargin }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-2 -2 25 24"
        className="fill-white/[0.28] stroke-white stroke-1 hover:stroke-[5px]"
        style={{ width: $socketsize, height: $socketsize, strokeLinejoin: 'round' }}
      >
        <path d="M0,0 L10,0 L20,10 L10,20 L0,20 Z" />
      </svg>
    </div>
  )
}
