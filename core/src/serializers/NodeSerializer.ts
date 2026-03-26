import { BaseNode, JSONBaseNode } from '../models/Node'
import { InputSerializer, OutputSerializer } from './PortSerializer'
import { ControlSerializer } from './ControlSerializer'

export function NodeSerializer(data: JSONBaseNode): BaseNode {
  return BaseNode.deserialize(
    data,
    inputData => InputSerializer(inputData),
    outputData => OutputSerializer(outputData),
    controlData => ControlSerializer(controlData)
  )
}
