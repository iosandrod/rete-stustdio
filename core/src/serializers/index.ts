import { NodeEditor } from 'rete'

import { Connection, JSONConnection } from '../models/Connection'
import { JSONBaseNode } from '../models/Node'
import { Schemes } from '../types'

import { NodeSerializer } from './NodeSerializer'

export type JSONEditorData = {
  nodes: JSONBaseNode[],
  connections: JSONConnection[]
}

export function serialize(editor: NodeEditor<Schemes>): JSONEditorData {
  return {
    nodes: editor.getNodes().map(n => n.serialize()),
    connections: editor.getConnections().map(c => c.serialize()),
  }
}

async function importForParent(editor: NodeEditor<Schemes>, nodes: JSONBaseNode[], parent?: string) {
  const children = nodes.filter(node => node.parent === parent)
  for (const node of children) {
    await editor.addNode(NodeSerializer(node))
    await importForParent(editor, nodes, node.id)
  }
}

export async function deserialize(editor: NodeEditor<Schemes>, data: JSONEditorData) {
  await importForParent(editor, data.nodes)

  for (const c of data.connections) {
    await editor.addConnection(
      Connection.deserialize(c, editor.getNode(c.source), editor.getNode(c.target))
    )
  }
}
