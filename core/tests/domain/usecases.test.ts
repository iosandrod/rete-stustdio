globalThis.crypto = require('crypto')
import { describe, expect, it, beforeEach } from '@jest/globals'
import { GraphService } from '../../src/domain/services/GraphService'
import { NodeUseCases } from '../../src/domain/usecases/NodeUseCases'
import { ConnectionUseCases } from '../../src/domain/usecases/ConnectionUseCases'
import { GraphUseCases } from '../../src/domain/usecases/GraphUseCases'
import { createNormalSocket } from '../../src/domain/Socket'
import { createInputControl } from '../../src/domain/Control'
import { DomainEventType } from '../../src/domain/DomainEvent'

describe('NodeUseCases', () => {
  let graphService: GraphService
  let nodeUseCases: NodeUseCases

  beforeEach(() => {
    graphService = new GraphService()
    nodeUseCases = new NodeUseCases(graphService)
  })

  it('createNode returns a new domain node', () => {
    const node = nodeUseCases.createNode({ label: 'TestNode', position: { x: 10, y: 20 } })
    expect(node.label).toBe('TestNode')
    expect(node.position).toEqual({ x: 10, y: 20 })
    expect(graphService.getGraph().nodes[node.id]).toBeDefined()
  })

  it('removeNode removes node from graph', () => {
    const node = nodeUseCases.createNode({ label: 'ToRemove' })
    nodeUseCases.removeNode(node.id)
    expect(graphService.getGraph().nodes[node.id]).toBeUndefined()
  })

  it('moveNode updates position', () => {
    const node = nodeUseCases.createNode({ label: 'Test' })
    nodeUseCases.moveNode({ nodeId: node.id, position: { x: 50, y: 60 } })
    expect(graphService.getGraph().nodes[node.id].position).toEqual({ x: 50, y: 60 })
  })

  it('updateNodeData merges data', () => {
    const node = nodeUseCases.createNode({ label: 'Test' })
    nodeUseCases.updateNodeData({ nodeId: node.id, data: { key: 'value' } })
    expect(graphService.getGraph().nodes[node.id].data.key).toBe('value')
  })

  it('addInputPort adds port to node', () => {
    const node = nodeUseCases.createNode({ label: 'Test' })
    const socket = createNormalSocket('number')
    nodeUseCases.addInputPort({ nodeId: node.id, key: 'num', socket })
    expect(graphService.getGraph().nodes[node.id].inputs.num).toBeDefined()
  })

  it('addControl adds control to node', () => {
    const node = nodeUseCases.createNode({ label: 'Test' })
    const control = createInputControl('test')
    nodeUseCases.addControl({ nodeId: node.id, key: 'ctrl', control })
    expect(graphService.getGraph().nodes[node.id].controls.ctrl).toBeDefined()
  })

  it('getNode returns correct node', () => {
    const node = nodeUseCases.createNode({ label: 'Test' })
    const found = nodeUseCases.getNode(node.id)
    expect(found?.label).toBe('Test')
  })

  it('getAllNodes returns all nodes', () => {
    nodeUseCases.createNode({ label: 'A' })
    nodeUseCases.createNode({ label: 'B' })
    expect(nodeUseCases.getAllNodes()).toHaveLength(2)
  })
})

describe('ConnectionUseCases', () => {
  let graphService: GraphService
  let nodeUseCases: NodeUseCases
  let connectionUseCases: ConnectionUseCases

  beforeEach(() => {
    graphService = new GraphService()
    nodeUseCases = new NodeUseCases(graphService)
    connectionUseCases = new ConnectionUseCases(graphService)
  })

  it('connect creates connection between nodes', () => {
    const a = nodeUseCases.createNode({ label: 'A' })
    const b = nodeUseCases.createNode({ label: 'B' })
    const conn = connectionUseCases.connect({
      sourceNodeId: a.id,
      sourcePortKey: 'bind',
      targetNodeId: b.id,
      targetPortKey: 'bind',
    })
    expect(conn).not.toBeNull()
    expect(graphService.getGraph().connections[conn!.id]).toBeDefined()
  })

  it('connect returns null for missing nodes', () => {
    const a = nodeUseCases.createNode({ label: 'A' })
    const conn = connectionUseCases.connect({
      sourceNodeId: a.id,
      sourcePortKey: 'bind',
      targetNodeId: 'nonexistent',
      targetPortKey: 'bind',
    })
    expect(conn).toBeNull()
  })

  it('disconnect removes connection', () => {
    const a = nodeUseCases.createNode({ label: 'A' })
    const b = nodeUseCases.createNode({ label: 'B' })
    const conn = connectionUseCases.connect({
      sourceNodeId: a.id,
      sourcePortKey: 'bind',
      targetNodeId: b.id,
      targetPortKey: 'bind',
    })
    connectionUseCases.disconnect(conn!.id)
    expect(graphService.getGraph().connections[conn!.id]).toBeUndefined()
  })

  it('getNodeConnections returns connections for node', () => {
    const a = nodeUseCases.createNode({ label: 'A' })
    const b = nodeUseCases.createNode({ label: 'B' })
    connectionUseCases.connect({
      sourceNodeId: a.id,
      sourcePortKey: 'bind',
      targetNodeId: b.id,
      targetPortKey: 'bind',
    })
    const conns = connectionUseCases.getNodeConnections(a.id)
    expect(conns).toHaveLength(1)
  })
})

describe('GraphUseCases', () => {
  let graphService: GraphService
  let graphUseCases: GraphUseCases

  beforeEach(() => {
    graphService = new GraphService()
    graphUseCases = new GraphUseCases(graphService)
  })

  it('loadGraph replaces current graph', () => {
    const existing = graphUseCases.getGraph()
    const { createDomainGraph } = require('../../src/domain/Graph')
    const newGraph = createDomainGraph()
    graphUseCases.loadGraph(newGraph)
    expect(graphUseCases.getGraph().id).not.toBe(existing.id)
  })

  it('clearGraph resets graph', () => {
    const { createDomainNode } = require('../../src/domain/Node')
    const { NodeUseCases } = require('../../src/domain/usecases/NodeUseCases')
    const nu = new NodeUseCases(graphService)
    nu.createNode({ label: 'A' })
    graphUseCases.clearGraph()
    expect(Object.keys(graphUseCases.getGraph().nodes)).toHaveLength(0)
  })

  it('subscribe fires handler on domain event', () => {
    const events: DomainEventType[] = []
    graphUseCases.subscribe('node:created', () => {
      events.push('node:created')
    })
    const { NodeUseCases } = require('../../src/domain/usecases/NodeUseCases')
    const nu = new NodeUseCases(graphService)
    nu.createNode({ label: 'A' })
    nu.createNode({ label: 'B' })
    expect(events).toEqual(['node:created', 'node:created'])
  })
})
