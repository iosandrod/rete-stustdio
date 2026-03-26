/* eslint-disable max-statements */
import { createRoot } from 'react-dom/client'
import { NodeEditor, NodeId, BaseSchemes } from 'rete'
import { AreaExtensions, AreaPlugin, Drag as AreaDrag } from 'rete-area-plugin'
import { ClassicFlow, ConnectionPlugin, getSourceTarget } from 'rete-connection-plugin'
import { ContextMenuExtra, ContextMenuPlugin } from 'rete-context-menu-plugin'
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from 'rete-history-plugin'
import { Presets as ReactPresets, ReactArea2D, ReactPlugin } from 'rete-react-plugin'
import { getDOMSocketPosition } from 'rete-render-utils'
import { Presets as ScopePresets, ScopesPlugin } from 'rete-scopes-plugin'
import { structures } from 'rete-structures'
import { ArrangeAppliers, AutoArrangePlugin, Presets as ArrangePresets } from 'rete-auto-arrange-plugin'
import { Item, Items } from 'rete-context-menu-plugin/_types/types'
import { BaseNode, Schemes, applyInteraction, Connection, ControlSocket, deserialize, InputControl, InsertControl, LanguageAdapter, LanguageSnippet, RefSocket, SelectControl, serialize } from 'rete-studio-core'
import { ElkNode } from 'elkjs'
import * as UI from './ui/ui'

export type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra

// ============== utils.ts ==============
function areConnected<S extends Schemes>(editor: NodeEditor<S>, source: string, target: string, cache = new Set<string>()) {
  const list = editor.getConnections().filter(c => c.source === source && !c.isLoop).map(c => editor.getNode(c.target)).filter((n): n is NonNullable<typeof n> => n !== undefined)
  const current = editor.getNode(source)
  if (!current) throw new Error(`Node ${source} not found`)
  const currentParent = current.parent

  if (source === target) return true
  if (cache.has(source)) return false
  cache.add(source)

  for (const node of list) {
    if (node.id === target) return true
    if (areConnected(editor, node.id, target, cache)) return true
  }
  if (currentParent && areConnected(editor, currentParent, target, cache)) return true
  return false
}

// ============== custom-background.ts ==============
function addCustomBackground<S extends BaseSchemes, K>(area: AreaPlugin<S, K>) {
  const background = document.createElement('div')
  background.classList.add('background')
  background.classList.add('fill-area')
  area.area.content.add(background)
}

// ============== inner-ports.ts ==============
type Padding = { top: number; left: number; right: number; bottom: number }
type InnerPortsOptions<S extends Schemes> = {
  hasLeftPort: (node: S['Node']) => boolean
  hasRightPort: (node: S['Node']) => boolean
  isLeftPort: (node: S['Node']) => boolean
  isRightPort: (node: S['Node']) => boolean
  padding: Padding
}

function useInnerPorts<S extends Schemes, A>(area: AreaPlugin<S, A>, options: InnerPortsOptions<S>) {
  const editor = area.parentScope<NodeEditor<S>>(NodeEditor)

  area.addPipe(async context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context
    if (context.type === 'nodetranslate') {
      const node = editor.getNode(context.data.id)
      if (!node) return context
      const { isLeftPort, isRightPort, padding } = options

      if (isLeftPort(node) || isRightPort(node)) {
        const parent = node.parent && editor.getNode(node.parent)
        if (!parent) return context
        const view = area.nodeViews.get(parent.id)
        if (!view) return context

        return {
          ...context,
          data: {
            ...context.data,
            position: {
              x: isLeftPort(node) ? view.position.x + padding.left : view.position.x + parent.width - node.width - padding.right,
              y: view.position.y + padding.top,
            }
          }
        }
      }
    }
    if (context.type === 'nodetranslated' || context.type === 'noderesized') {
      const node = editor.getNode(context.data.id)
      if (!node) return context
      const view = area.nodeViews.get(node.id)

      if (options.hasLeftPort(node)) {
        const entry = editor.getNodes().find(item => options.isLeftPort(item) && item.parent === node.id)
        const classBody = editor.getNodes().find(item => options.isRightPort(item) && item.parent === node.id)

        if (entry && view) {
          await area.translate(entry.id, { x: view.position.x + 20, y: view.position.y + 40 })
        }
        if (classBody && view) {
          await area.translate(classBody.id, { x: view.position.x + node.width - classBody.width - 20, y: view.position.y + 40 })
        }
      }
    }
    return context
  })

  return {
    isInnerPort: (node: S['Node']) => options.isLeftPort(node) || options.isRightPort(node),
    hasInnerPorts: (node: S['Node']) => options.hasLeftPort(node) || options.hasRightPort(node),
    hasLeftPort: options.hasLeftPort,
    hasRightPort: options.hasRightPort,
    isLeftPort: options.isLeftPort,
    isRightPort: options.isRightPort,
  }
}

// ============== layout.ts ==============
const padding = { top: 40, left: 50, right: 50, bottom: 20 }
const innerPortWidth = 200

function expressions(nodes: Schemes['Node'][], clones: Schemes['Node'][], connections: Schemes['Connection'][], id: NodeId, dir: 'incomers' | 'outgoers') {
  const node = nodes.find(n => n.id === id)
  if (!node) return []
  return structures({ nodes: clones, connections })[dir](id).nodes().filter(n => n.type === 'expression' && n.parent === node.parent)
}

function applyGroupToExpressions(group: BaseNode, nodes: Schemes['Node'][], clones: Schemes['Node'][], connections: Schemes['Connection'][], id: NodeId, dir: 'incomers' | 'outgoers') {
  const incomers = expressions(nodes, clones, connections, id, dir)
  incomers.forEach(inc => {
    applyGroupToExpressions(group, nodes, clones, connections, inc.id, dir)
    inc.parent = group.id
  })
}

function groupStatements(nodes: Schemes['Node'][], connections: Schemes['Connection'][]) {
  const list: Schemes['Node'][] = []
  const clones = nodes.map(n => n.clone(true))
  for (const node of clones) {
    if (node.type === 'statement') {
      const group = new BaseNode('Group')
      group.removeOutput('output')
      group.parent = node.parent
      node.parent = group.id
      list.push(group)
      applyGroupToExpressions(group, nodes, clones, connections, node.id, 'incomers')
      applyGroupToExpressions(group, nodes, clones, connections, node.id, 'outgoers')
    }
    list.push(node)
  }
  return list
}

class ScopeArrange extends ArrangeAppliers.StandardApplier<Schemes, AreaExtra> {
  public async apply(nodes: ElkNode[], offset = { x: 0, y: 0 }) {
    const correctNodes = this.getValidShapes(nodes)
    await Promise.all(correctNodes.map(async ({ id, x, y, width, height, children }) => {
      await Promise.all([
        this.resizeNode(id, width, height),
        this.translateNode(id, offset.x + x, offset.y + y)
      ])
      if (children) await this.apply(children, { x: offset.x + x, y: offset.y + y })
    }))
  }
}

function ignoreLoopConnections(connection: Schemes['Connection']) {
  return !connection.isLoop
}

function createArrangePlugin(editor: NodeEditor<Schemes>, innerPorts: ReturnType<typeof useInnerPorts>) {
  const arrange = new AutoArrangePlugin<Schemes, AreaExtra>()
  const arrangePreset = ArrangePresets.classic.setup()
  arrange.addPreset(args => {
    const data = arrangePreset(args)
    return data && {
      ...data,
      options(id) {
        const node = editor.getNode(id)
        if (!node) return { 'elk.padding': '' }
        const hasLeftInnerPorts = innerPorts.hasLeftPort(node)
        const hasRightInnerPorts = innerPorts.hasRightPort(node)
        return {
          'elk.padding': `[left=${(hasLeftInnerPorts ? innerPortWidth : 0) + padding.left}, top=${padding.top}, right=${(hasRightInnerPorts ? innerPortWidth : 0) + padding.right}, bottom=${padding.bottom}]`
        }
      }
    }
  })
  return arrange
}

async function layout(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>, arrange: AutoArrangePlugin<Schemes, AreaExtra>, innerPorts: ReturnType<typeof useInnerPorts>, zoomAt?: boolean) {
  const graph = structures(editor).filter(node => !innerPorts.isInnerPort(node), ignoreLoopConnections)
  graph.nodes().forEach(node => {
    if (innerPorts.hasInnerPorts(node)) {
      node.width = Math.max(node.width, 400)
      node.height = Math.max(node.height, 200)
    }
  })
  const result = await arrange.layout({
    nodes: groupStatements(graph.nodes(), graph.connections()),
    connections: graph.connections(),
    applier: new ScopeArrange()
  })
  if (zoomAt) await AreaExtensions.zoomAt(area, editor.getNodes())
  return result
}

// ============== context-menu.ts ==============
function snippetToItem(snippet: LanguageSnippet, add: (code: string) => unknown | Promise<unknown>): Item {
  if ('subitems' in snippet) {
    return {
      label: snippet.label,
      key: snippet.label,
      handler: (): void => undefined,
      subitems: snippet.subitems.map(subitem => snippetToItem(subitem, add))
    }
  }
  return {
    label: snippet.label,
    key: snippet.label,
    handler: async () => {
      const code = typeof snippet.code === 'function' ? snippet.code() : snippet.code
      await add(code)
    }
  }
}

function items(snippets: LanguageSnippet[], add: (code: string) => unknown | Promise<unknown>) {
  return <Items<Schemes>>(function (context, plugin) {
    const area = plugin.parentScope<AreaPlugin<Schemes, any>>(AreaPlugin)
    const editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor)

    if (context === 'root') {
      return { searchBar: true, list: snippets.map(snippet => snippetToItem(snippet, add)) }
    }

    const deleteItem: Item = {
      label: 'Delete',
      key: 'delete',
      async handler() {
        const nodeId = context.id
        const connections = editor.getConnections().filter(c => c.source === nodeId || c.target === nodeId)
        for (const connection of connections) {
          await editor.removeConnection(connection.id)
        }
        await editor.removeNode(nodeId)
      }
    }

    const clone = context.clone
    const cloneItem: undefined | Item = clone && {
      label: 'Clone',
      key: 'clone',
      async handler() {
        const node = clone()
        await editor.addNode(node)
        applyInteraction(editor, id => area.update('node', id))
        area.translate(node.id, area.area.pointer)
      }
    }

    return { searchBar: false, list: [deleteItem, ...(cloneItem ? [cloneItem] : [])] }
  })
}

// ============== main createEditor ==============
async function graphFromCode(code: string, language: LanguageAdapter, editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>) {
  const data = await language.codeToGraph(code)
  if (!data) throw new Error('Failed to parse code')
  await editor.clear()
  await deserialize(editor, data)
  applyInteraction(editor, id => area.update('node', id))
}

export async function createEditor(
  container: HTMLElement,
  snippets: LanguageSnippet[],
  language: LanguageAdapter,
) {
  const editor = new NodeEditor<Schemes>()
  const area = new AreaPlugin<Schemes, AreaExtra>(container)
  const connection = new ConnectionPlugin<Schemes, AreaExtra>()
  const reactPlugin = new ReactPlugin<Schemes, AreaExtra>({ createRoot })
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: items(snippets, async code => {
      const tempEditor = new NodeEditor<Schemes>()
      const tempArea = new AreaPlugin<Schemes, AreaExtra>(document.createElement('div'))
      const arrange = createArrangePlugin(tempEditor, innerPortsInstance)

      tempEditor.use(tempArea)
      tempArea.use(arrange)

      await graphFromCode(code, language, tempEditor, tempArea)
      await layout(tempEditor, area, arrange, innerPortsInstance)

      const graph = structures(tempEditor)

      for (const node of graph.nodes()) {
        await editor.addNode(node.clone(true))
        const view = tempArea.nodeViews.get(node.id)
        if (view) {
          area.translate(node.id, { x: area.area.pointer.x + view.position.x, y: area.area.pointer.y + view.position.y })
        }
      }
      for (const connection of graph.connections()) {
        await editor.addConnection(connection)
      }
      applyInteraction(editor, id => area.update('node', id))
    })
  })
  const history = new HistoryPlugin()

  HistoryExtensions.keyboard(history)
  history.addPreset(HistoryPresets.classic.setup())

  connection.addPreset(() => new ClassicFlow({
    makeConnection(from, to, context) {
      const [source, target] = getSourceTarget(from, to) || [null, null]
      const { editor } = context
      if (source && target) {
        const sourceNode = editor.getNode(source.nodeId)
        const targetNode = editor.getNode(target.nodeId)
        if (!sourceNode || !targetNode) return false
        editor.addConnection(new Connection(sourceNode, source.key, targetNode, target.key))
        return true
      }
    }
  }))

  area.area.setDragHandler(new AreaDrag({
    down: e => { e.preventDefault(); return true },
    move: () => true
  }))

  editor.use(area)

  const innerPortsInstance = useInnerPorts(area, {
    hasLeftPort(node) { return Boolean(node.frame?.left) },
    hasRightPort(node) { return Boolean(node.frame?.right) },
    isLeftPort(node) { return ['Entry'].includes(node.label) },
    isRightPort(node) { return ['ClassBody'].includes(node.label) },
    padding
  })

  const arrange = createArrangePlugin(editor, innerPortsInstance)

  addCustomBackground(area)

  reactPlugin.addPreset(ReactPresets.classic.setup({
    socketPositionWatcher: getDOMSocketPosition({
      offset({ x, y }, _nodeId, side) {
        return { x: x + 10 * (side === 'input' ? -1 : 1), y }
      },
    }),
    customize: {
      control(data) {
        if (data.payload instanceof InsertControl) return UI.InsertButton
        if (data.payload instanceof SelectControl) return UI.SelectComponent
        if (data.payload instanceof InputControl) return UI.InputControlComponent
        return UI.CustomInput
      },
      node(data) {
        if (innerPortsInstance.isInnerPort(data.payload)) return UI.InnerPortNode
        if (data.payload.type === 'statement') return UI.StatementNode
        if (data.payload.type === 'expression') return UI.Node
        if (data.payload.frame) return UI.FrameNode
        return UI.UnknownNode as any
      },
      socket(data) {
        if (data.payload instanceof ControlSocket) return UI.ControlSocketComponent
        return UI.CustomSocket
      },
      connection(data) {
        const { source, sourceOutput, target, targetInput } = data.payload
        const sourceNode = editor.getNode(source)
        const targetNode = editor.getNode(target)
        const outputSocket = sourceNode?.outputs[sourceOutput]?.socket
        const inputSocket = targetNode?.inputs[targetInput]?.socket
        if (outputSocket instanceof RefSocket) return UI.ReferenceConnection
        if (outputSocket instanceof ControlSocket || inputSocket instanceof ControlSocket) return UI.StatementConnection
        return UI.ExpressionConnection
      }
    }
  }))
  reactPlugin.addPreset(ReactPresets.contextMenu.setup({
    delay: 200,
    customize: {
      main: () => UI.ContextMenu.Menu as any,
      item: () => UI.ContextMenu.Item as any,
      common: () => UI.ContextMenu.Common as any,
      search: () => UI.ContextMenu.Search as any,
      subitems: () => UI.ContextMenu.Subitems as any
    }
  }))

  AreaExtensions.simpleNodesOrder(area)
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), { accumulating: AreaExtensions.accumulateOnCtrl() })
  AreaExtensions.showInputControl<Schemes>(area, ({ hasAnyConnection, input }) => {
    return input.alwaysVisibleControl ? true : !hasAnyConnection
  })

  area.use(contextMenu)
  area.use(reactPlugin)
  area.use(connection)
  area.use(arrange)
  area.use(history)

  const scopes = new ScopesPlugin<Schemes>({
    exclude: (id) => {
      const node = editor.getNode(id)
      if (!node) return false
      return innerPortsInstance.isInnerPort(node)
    },
    size(id, size) {
      const node = editor.getNode(id)
      if (!node) return size
      if (innerPortsInstance.hasLeftPort(node)) return { width: Math.max(size.width, 400), height: Math.max(size.height, 200) }
      return size
    },
    padding(id) {
      const node = editor.getNode(id)
      if (!node) return padding
      return {
        top: padding.top,
        left: (innerPortsInstance.hasLeftPort(node) ? innerPortWidth : 0) + padding.left,
        right: (innerPortsInstance.hasRightPort(node) ? innerPortWidth : 0) + padding.right,
        bottom: padding.bottom
      }
    }
  })
  scopes.addPreset(ScopePresets.classic.setup())
  area.use(scopes)

  editor.addPipe(c => {
    if (c.type === 'connectioncreate') {
      if (areConnected(editor, c.data.target, c.data.source)) c.data.isLoop = true
    }
    return c
  })

  return {
    async codeToGraph(code: string) {
      await graphFromCode(code, language, editor, area)
      await layout(editor, area, arrange, innerPortsInstance, true)
    },
    async graphToCode() {
      const data = serialize(editor)
      const code = await language.graphToCode(data)
      return code
    },
    async codeToExecutable(code: string) {
      return language.codeToExecutable(code)
    },
    layout: () => layout(editor, area, arrange, innerPortsInstance, true),
    clear: () => editor.clear(),
    destroy: () => area.destroy()
  }
}
