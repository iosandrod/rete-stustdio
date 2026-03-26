import { Control, InputControl, InsertControl, SelectControl } from '../models/Control'
import { JSONControl, JSONInputControl, JSONInsertControl, JSONSelectControl } from '../models/Control'

export function ControlSerializer(control: JSONControl | JSONInsertControl | JSONInputControl | JSONSelectControl): Control {
  if ('isSelectControl' in control) {
    return SelectControl.deserialize(control)
  }
  if ('isInputControl' in control) {
    return InputControl.deserialize(control)
  }
  if ('isInsertControl' in control) {
    return InsertControl.deserialize(control)
  }
  throw new Error('cannot find control class')
}
