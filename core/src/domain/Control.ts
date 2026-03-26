export type InputType = 'text' | 'number' | 'boolean' | 'identifier' | 'null' | 'bigint'

export interface DomainControl {
  readonly id: string
  readonly kind: 'input' | 'select' | 'insert'
  readonly action: string | [string, object]
}

export interface InputControl extends DomainControl {
  readonly kind: 'input'
  readonly inputType: InputType
  readonly value: string | number | boolean | null
  readonly readonly: boolean
  readonly allowedTypes?: InputType[]
}

export interface SelectControl extends DomainControl {
  readonly kind: 'select'
  readonly value: string
  readonly options: { value: string; label: string }[]
}

export interface InsertControl extends DomainControl {
  readonly kind: 'insert'
  readonly onClick?: () => void
}

export function createInputControl(
  action: string | [string, object],
  inputType: InputType = 'text',
  value: string | number = '',
  readonly = false,
  allowedTypes?: InputType[]
): InputControl {
  return {
    id: crypto.randomUUID(),
    kind: 'input',
    action,
    inputType,
    value,
    readonly,
    allowedTypes,
  }
}

export function createSelectControl(
  action: string | [string, object],
  value: string,
  options: { value: string; label: string }[]
): SelectControl {
  return {
    id: crypto.randomUUID(),
    kind: 'select',
    action,
    value,
    options,
  }
}

export function createInsertControl(action: string | [string, object]): InsertControl {
  return {
    id: crypto.randomUUID(),
    kind: 'insert',
    action,
  }
}
