globalThis.crypto = require('crypto')
import { describe, expect, it, beforeEach } from '@jest/globals'
import { createDomainNode, addInputPort, addOutputPort, addControl, moveNode, updateNodeData, DomainNode } from '../../src/domain/Node'
import { createNormalSocket, createRefSocket, createControlSocket } from '../../src/domain/Socket'
import { createInputPort, createOutputPort } from '../../src/domain/Port'
import { createInputControl, createSelectControl, createInsertControl } from '../../src/domain/Control'
import { createConnection, createLoopConnection, createReferenceConnection } from '../../src/domain/Connection'
import {
  createDomainGraph,
  addNode,
  removeNode,
  addConnection,
  removeConnection,
  getNode,
  getConnectionsForNode,
  updateNode,
  DomainGraph
} from '../../src/domain/Graph'

// --- Node tests ---
describe('DomainNode', () => {
  it('creates a node with default bind port', () => {
    const node = createDomainNode('TestNode', { position: { x: 10, y: 20 } })
    expect(node.label).toBe('TestNode')
    expect(node.position).toEqual({ x: 10, y: 20 })
    expect(node.nodeType).toBe('unknown')
    expect(node.inputs.bind).toBeDefined()
    expect(node.outputs.bind).toBeDefined()
    expect(node.id).toBeDefined()
  })

  it('addInputPort returns new node instance (immutable)', () => {
    const node = createDomainNode('Test')
    const socket = createNormalSocket('number')
    const port = createInputPort('num', socket, 'Number')
    const updated = addInputPort(node, port)
    expect(updated).not.toBe(node)
    expect(node.inputs.num).toBeUndefined()
    expect(updated.inputs.num).toBeDefined()
  })

  it('moveNode updates position immutably', () => {
    const node = createDomainNode('Test')
    const moved = moveNode(node, { x: 100, y: 200 })
    expect(moved.position).toEqual({ x: 100, y: 200 })
    expect(node.position).toEqual({ x: 0, y: 0 })
  })

  it('updateNodeData merges data immutably', () => {
    const node = createDomainNode('Test', { data: { foo: 'bar' } })
    const updated = updateNodeData(node, { baz: 123 })
    expect(updated.data).toEqual({ foo: 'bar', baz: 123 })
    expect(node.data).toEqual({ foo: 'bar' })
  })
})

// --- Connection tests ---
describe('DomainConnection', () => {
  it('createConnection generates unique id', () => {
    const c1 = createConnection('a', 'out', 'b', 'in')
    const c2 = createConnection('a', 'out', 'b', 'in')
    expect(c1.id).not.toBe(c2.id)
    expect(c1.isLoop).toBe(false)
    expect(c1.secondary).toBe(false)
  })

  it('createLoopConnection sets isLoop flag', () => {
    const conn = createLoopConnection('a', 'out', 'b', 'in')
    expect(conn.isLoop).toBe(true)
  })

  it('createReferenceConnection sets identifier', () => {
    const conn = createReferenceConnection('a', 'out', 'b', 'in', 'myRef')
    expect(conn.identifier).toBe('myRef')
  })
})

// --- Graph tests ---
describe('DomainGraph', () => {
  let graph: DomainGraph

  beforeEach(() => {
    graph = createDomainGraph()
  })

  it('starts empty', () => {
    expect(Object.keys(graph.nodes)).toHaveLength(0)
    expect(Object.keys(graph.connections)).toHaveLength(0)
  })

  it('addNode inserts node and updates metadata', () => {
    const node = createDomainNode('A')
    const next = addNode(graph, node)
    expect(next.nodes[node.id]).toBe(node)
    expect(next.metadata.updatedAt).not.toEqual(graph.metadata.updatedAt)
  })

  it('removeNode removes node and orphan connections', () => {
    const a = createDomainNode('A')
    const b = createDomainNode('B')
    const conn = createConnection(a.id, 'bind', b.id, 'bind')
    let g = addNode(graph, a)
    g = addNode(g, b)
    g = addConnection(g, conn)
    g = removeNode(g, a.id)
    expect(g.nodes[a.id]).toBeUndefined()
    expect(Object.keys(g.connections)).toHaveLength(0)
  })

  it('removeNode keeps unrelated connections', () => {
    const a = createDomainNode('A')
    const b = createDomainNode('B')
    const c = createDomainNode('C')
    const conn1 = createConnection(a.id, 'bind', b.id, 'bind')
    const conn2 = createConnection(b.id, 'bind', c.id, 'bind')
    let g = addNode(graph, a)
    g = addNode(g, b)
    g = addNode(g, c)
    g = addConnection(g, conn1)
    g = addConnection(g, conn2)
    g = removeNode(g, b.id)
    expect(g.nodes[b.id]).toBeUndefined()
    expect(Object.keys(g.connections)).toHaveLength(0)
  })

  it('addConnection ignores if node missing', () => {
    const a = createDomainNode('A')
    const conn = createConnection('nonexistent', 'bind', a.id, 'bind')
    const g = addConnection(addNode(graph, a), conn)
    expect(Object.keys(g.connections)).toHaveLength(0)
  })

  it('removeConnection removes connection only', () => {
    const a = createDomainNode('A')
    const b = createDomainNode('B')
    const conn = createConnection(a.id, 'bind', b.id, 'bind')
    let g = addNode(graph, a)
    g = addNode(g, b)
    g = addConnection(g, conn)
    g = removeConnection(g, conn.id)
    expect(Object.keys(g.connections)).toHaveLength(0)
    expect(g.nodes[a.id]).toBeDefined()
  })

  it('getNode returns correct node', () => {
    const node = createDomainNode('Test')
    const g = addNode(graph, node)
    expect(getNode(g, node.id)).toBe(node)
    expect(getNode(g, 'missing')).toBeUndefined()
  })

  it('getConnectionsForNode returns input and output connections', () => {
    const a = createDomainNode('A')
    const b = createDomainNode('B')
    const c = createDomainNode('C')
    const conn1 = createConnection(a.id, 'bind', b.id, 'bind')
    const conn2 = createConnection(b.id, 'bind', c.id, 'bind')
    let g = addNode(graph, a)
    g = addNode(g, b)
    g = addNode(g, c)
    g = addConnection(g, conn1)
    g = addConnection(g, conn2)
    const bConns = getConnectionsForNode(g, b.id)
    expect(bConns).toHaveLength(2)
  })

  it('updateNode applies updater function', () => {
    const node = createDomainNode('Test')
    const g = addNode(graph, node)
    const updated = updateNode(g, node.id, n => ({ ...n, label: 'Updated' }))
    expect(updated.nodes[node.id].label).toBe('Updated')
  })
})
