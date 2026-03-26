import { DomainGraph } from '../Graph'

/**
 * Returns true if target is reachable from source via non-loop connections.
 * Pure domain function — no side effects.
 */
export function areConnected(
  graph: DomainGraph,
  source: string,
  target: string,
  cache: Set<string> = new Set()
): boolean {
  // If same node
  if (source === target) return true

  // Detect cycles
  if (cache.has(source)) return false
  cache.add(source)

  // Collect outgoing non-loop connections from source
  const outgoing = Object.values(graph.connections).filter(
    c => c.sourceNodeId === source && !c.isLoop
  )
  const targets = outgoing.map(c => graph.nodes[c.targetNodeId]).filter((n): n is any => n !== undefined)

  for (const node of targets) {
    if (node.id === target) return true
    if (areConnected(graph, node.id, target, cache)) return true
  }

  // Recurse through parent chain
  const currentParent = graph.nodes[source]?.parentId ?? null
  if (currentParent) {
    if (areConnected(graph, currentParent, target, cache)) return true
  }

  return false
}
