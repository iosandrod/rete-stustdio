export interface JSONBaseNode {
  id: string
  label: string
  width: number
  height: number
  parent?: string
  data: Record<string, string | number | undefined>
  frame?: { left?: boolean; right?: boolean }
  type: 'statement' | 'expression' | 'unknown'
  inputs: Record<string, JSONInput>
  outputs: Record<string, JSONOutput>
  controls: Record<string, JSONControl>
}

export interface JSONInput {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  socket: JSONSocket
  control?: JSONControl
}

export interface JSONOutput {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  socket: JSONSocket
  control?: JSONControl
}

export interface JSONSocket {
  name: string
  isRef?: true
  isControl?: true
  identifier?: string
}

export interface JSONControl {
  id: string
  isInputControl?: true
  isSelectControl?: true
  isInsertControl?: true
  action: string | [string, object]
  type?: string
  value?: string | number | boolean | null
  readonly?: boolean
  allowedTypes?: string[]
  options?: { value: string; label: string }[]
}

export interface JSONConnection {
  id: string
  source: string
  target: string
  sourceOutput: string | number | symbol
  targetInput: string | number | symbol
  isLoop?: boolean
  identifier?: string
  secondary?: boolean
}
