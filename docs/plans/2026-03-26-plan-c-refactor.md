# Plan C: models/ + serializers/ 目录重构

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers/executing-plans` to implement this plan task-by-task.

**Goal:** 将 `core/src/` 下的运行时类按 `models/` 和 `serializers/` 分层重组织，消除单文件过大的问题，保持 API 完全兼容。

**Architecture:** 保持所有现有类定义不变（继承关系、API 签名），仅将代码从旧文件移动到新目录。`index.ts` 统一重新导出保证外部 API 不变。

**Tech Stack:** TypeScript, Rete.js, 纯重构（无行为改变）

---

## 目标目录结构

```
core/src/
├── index.ts                   ← 重新导出（更新）
├── types.ts                   ← 仅 Schemes/Cloneable（更新：移除 runtime 代码）
│
├── models/                    ← 新建：运行时类
│   ├── index.ts               ← 统一导出
│   ├── Socket.ts              ← Socket + RefSocket + ControlSocket + socket const + JSON types
│   ├── Control.ts             ← InputControl + SelectControl + InsertControl + JSON types
│   ├── Port.ts                ← Input + Output + JSON types
│   ├── Node.ts                ← BaseNode + JSONBaseNode + BaseNodeData + InputType + inputTypes + Sockets
│   └── Connection.ts           ← Connection + JSONConnection
│
├── serializers/               ← 新建：序列化工厂函数
│   ├── index.ts               ← 导出所有 + JSONEditorData + serialize/deserialize
│   ├── SocketSerializer.ts    ← Socket.fromJSON() 工厂
│   ├── ControlSerializer.ts   ← Control.fromJSON() 工厂
│   ├── PortSerializer.ts      ← Input/Output.fromJSON() 工厂
│   ├── NodeSerializer.ts      ← BaseNode.deserialize() 工厂
│   └── EditorSerializer.ts   ← 编辑器级 serialize/deserialize（从原 serialization.ts 移入）
│
├── interaction.ts              ← 不变
├── utils.ts                   ← 不变
│
└── core/                      ← 不变
    ├── index.ts
    ├── types.ts
    ├── transformer.ts
    ├── methods.ts
    ├── elaborate.ts
    └── tree-flow/
│
└── languages/                 ← 不变
    └── index.ts
```

---

## 导出清单（当前 API → 新位置）

所有从 `rete-studio-core` 导出的内容必须保持不变。

| 当前导出 | 现状位置 | 目标位置 |
|---|---|---|
| `Socket`, `RefSocket`, `ControlSocket`, `socket` | `sockets.ts` | `models/Socket.ts` |
| `JSONSocket`, `JSONRefSocket`, `JSONControlSocket` | `sockets.ts` | `models/Socket.ts` |
| `Control`, `InputControl`, `SelectControl`, `InsertControl` | `controls.ts` | `models/Control.ts` |
| `JSONControl`, `JSONInputControl`, `JSONSelectControl`, `JSONInsertControl` | `controls.ts` | `models/Control.ts` |
| `Input`, `Output` | `nodes.ts` | `models/Port.ts` |
| `JSONInput`, `JSONOutput` | `nodes.ts` | `models/Port.ts` |
| `BaseNode`, `InputType`, `inputTypes`, `Sockets` | `nodes.ts` | `models/Node.ts` |
| `JSONBaseNode` | `nodes.ts` | `models/Node.ts` |
| `Connection`, `JSONConnection` | `connections.ts` | `models/Connection.ts` |
| `serialize`, `deserialize`, `JSONEditorData` | `serialization.ts` | `serializers/` |
| `Schemes`, `ClassicSchemes`, `NodeProps`, `ConnProps`, `Size` | `types.ts` | `types.ts`（仅保留类型） |
| `Cloneable` | `types.ts` | `types.ts`（移入） |
| `applyInteraction` | `interaction.ts` | `interaction.ts` |
| `Utils` | `utils.ts` | `utils.ts` |
| `CodePlugin`, `Transformer`, etc. | `core/` | `core/`（不变） |

---

## 外部消费者（导入 `rete-studio-core` 的文件）

| 文件 | 导入内容 |
|---|---|
| `ui/src/editor/index.tsx` | `applyInteraction`, `Connection`, `ControlSocket`, `deserialize`, `InputControl`, `InsertControl`, `LanguageAdapter`, `LanguageSnippet`, `RefSocket`, `Schemes`, `SelectControl`, `serialize` |
| `ui/src/editor/ui/index.tsx` | `InputControl`, `InputType`, `InsertControl`, `SelectControl`, `inputTypes` |
| `ui/src/editor/ui/custom-socket.tsx` | `Socket` |
| `ui/src/editor/ui/custom-node.tsx` | `Schemes` |
| `ui/src/shared/Editor.tsx` | `LanguageAdapter`, `LanguageSnippet` |
| `ui/src/Playground.tsx` | `LanguageAdapter` |
| `demo/src/App.tsx` | `LanguageAdapter` |
| `languages/javascript/src/index.ts` | `LanguageSnippet` |
| `languages/javascript/src/code-plugin.ts` | `BaseNode`, `BaseOptions`, `CodePlugin`, `Connection`, `Output`, `Schemes`, `socket` |
| `languages/javascript/src/transformers/*.ts` | 各种 core 导出 |

> **注意**: 外部消费者使用 `rete-studio-core` 入口，`index.ts` 重新导出即可，无需修改消费者代码。

---

## Task 1: 创建 models/Socket.ts

**文件：** Create: `core/src/models/Socket.ts`

将 `sockets.ts` 全部内容移入。
- `Socket` 类 + `clone()` + `serialize()` + `static deserialize()`
- `RefSocket` 类 + `clone()` + `serialize()` + `static deserialize()`
- `ControlSocket` 类 + `clone()` + `serialize()` + `static deserialize()`
- `JSONSocket`, `JSONRefSocket`, `JSONControlSocket` 类型
- `socket` 常量

**Step 1: 创建文件**

从 `sockets.ts` 复制全部内容（83行）。

---

## Task 2: 创建 models/Control.ts

**文件：** Create: `core/src/models/Control.ts`

将 `controls.ts` 全部内容移入。
- 移除顶部 `import { Socket, socket } from './sockets'` 和 `export { Socket, socket }`（Socket 已独立）
- 顶部改为 `import { InputType } from './Node'`（循环依赖需通过 forward reference 或延迟）
- 实际：`InputType` 定义在 `Node.ts`，`Control` 不需要 `InputType` 在定义时可用，只需确保 `Node.ts` 在 `Control.ts` 之前加载（TypeScript 编译顺序）

**解决循环依赖：** `InputType` 只被 `InputControl.options.type` 使用，不参与 Control 类定义本身。可将 `InputType` 移至 `models/Control.ts` 作为独立类型，或在 `models/Node.ts` 中从 `Control.ts` import。

**方案：保持 `InputType` 在 `models/Node.ts`，在 `models/Control.ts` 顶部加 `import type { InputType } from './Node'`。**

**Step 1: 创建文件**

从 `controls.ts` 复制全部内容，删除 `export { Socket, socket }` 和 `import { Socket, socket }`。

---

## Task 3: 创建 models/Port.ts

**文件：** Create: `core/src/models/Port.ts`

将 `nodes.ts` 中的 `Input`, `Output`, `JSONInput`, `JSONOutput` 部分移入。

**内容：**
- `Input<S extends Socket>` 类 + `serialize()` + `static deserialize()`
- `Output<S extends Socket>` 类 + `addControl()` + `removeControl()` + `serialize()` + `static deserialize()`
- `JSONInput` 类型
- `JSONOutput` 类型

**import 依赖：** 需从 `./Socket` import `Socket`，从 `./Control` import `Control`。

**Step 1: 创建文件**

---

## Task 4: 创建 models/Node.ts

**文件：** Create: `core/src/models/Node.ts`

将 `nodes.ts` 中的以下部分移入：
- `InputType` 类型
- `inputTypes` 常量数组
- `Sockets` 联合类型
- `BaseNodeData` 类型
- `JSONBaseNode` 类型
- `BaseNode` 类 + 全部方法（`serialize()`, `deserialize()`, `clone()`, `updateSize()` 等）

**import 依赖：** 需从 `./Socket` import `Socket, RefSocket, ControlSocket`，从 `./Port` import `Input, Output`，从 `./Control` import `Control, InputControl, InsertControl, SelectControl`，从 `../core/types` import `BIND_KEY`。

**特别注意：** `BIND_KEY` 在 `core/types.ts` 中定义，需要保持导入路径。

**Step 1: 创建文件**

---

## Task 5: 创建 models/Connection.ts

**文件：** Create: `core/src/models/Connection.ts`

将 `connections.ts` 全部内容移入（55行）。

**import 依赖：** 需从 `./Node` import `BaseNode`。

**Step 1: 创建文件**

---

## Task 6: 创建 models/index.ts

**文件：** Create: `core/src/models/index.ts`

统一导出所有 models：

```typescript
export * from './Socket'
export * from './Control'
export * from './Port'
export * from './Node'
export * from './Connection'
```

**Step 1: 创建文件**

---

## Task 7: 创建 serializers/SocketSerializer.ts

**文件：** Create: `core/src/serializers/SocketSerializer.ts`

将 `serialization.ts` 中的 `deserializeSocket()` 函数移入。

```typescript
import { JSONSocket, JSONRefSocket, JSONControlSocket } from '../models/Socket'
import { Socket, RefSocket, ControlSocket } from '../models/Socket'

export function SocketSerializer(data: JSONRefSocket | JSONControlSocket | JSONSocket): Socket {
  if ('isRef' in socket) {  // 修正：用 data
    return RefSocket.deserialize(data)
  }
  if ('isControl' in data) {
    return ControlSocket.deserialize(data)
  }
  return Socket.deserialize(data)
}
```

注意：函数签名接收 `data` 参数，需要从 `socket` 改为 `data`。

**Step 1: 创建文件**

---

## Task 8: 创建 serializers/ControlSerializer.ts

**文件：** Create: `core/src/serializers/ControlSerializer.ts`

将 `serialization.ts` 中的 `deserializeControl()` 函数移入。

```typescript
import { Control, InsertControl, SelectControl, InputControl } from '../models/Control'
import { JSONControl, JSONInsertControl, JSONInputControl, JSONSelectControl } from '../models/Control'

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
```

**Step 1: 创建文件**

---

## Task 9: 创建 serializers/PortSerializer.ts

**文件：** Create: `core/src/serializers/PortSerializer.ts`

创建 Input/Output 的序列化工厂函数：

```typescript
import { Input, Output } from '../models/Port'
import { JSONInput, JSONOutput } from '../models/Port'
import { Socket } from '../models/Socket'
import { Control } from '../models/Control'
import { SocketSerializer } from './SocketSerializer'
import { ControlSerializer } from './ControlSerializer'

export function InputSerializer(data: JSONInput): Input<Socket> {
  const socket = SocketSerializer(data.socket)
  const control = data.control ? ControlSerializer(data.control) : undefined
  return Input.deserialize(data, socket, control)
}

export function OutputSerializer(data: JSONOutput): Output<Socket> {
  const socket = SocketSerializer(data.socket)
  const control = data.control ? ControlSerializer(data.control) : undefined
  return Output.deserialize(data, socket, control)
}
```

**Step 1: 创建文件**

---

## Task 10: 创建 serializers/NodeSerializer.ts

**文件：** Create: `core/src/serializers/NodeSerializer.ts`

将 `serialization.ts` 中的 Node 反序列化逻辑移入：

```typescript
import { BaseNode } from '../models/Node'
import { JSONBaseNode } from '../models/Node'
import { Input } from '../models/Port'
import { Output } from '../models/Port'
import { Control } from '../models/Control'
import { InputSerializer, OutputSerializer } from './PortSerializer'
import { ControlSerializer } from './ControlSerializer'

export function NodeSerializer(data: JSONBaseNode): BaseNode {
  return BaseNode.deserialize(
    data,
    input => InputSerializer(input),
    output => OutputSerializer(output),
    control => ControlSerializer(control)
  )
}
```

**Step 1: 创建文件**

---

## Task 11: 创建 serializers/EditorSerializer.ts

**文件：** Create: `core/src/serializers/EditorSerializer.ts`

将 `serialization.ts` 中的 `serialize()` 和 `deserialize()` 移入。

```typescript
import { NodeEditor } from 'rete'
import { Connection } from '../models/Connection'
import { JSONConnection } from '../models/Connection'
import { Schemes } from '../types'
import { BaseNode } from '../models/Node'
import { JSONBaseNode } from '../models/Node'
import { serialize, deserialize } from './index'

// serialize/deserialize 函数放 serializers/index.ts
```

注意：`serialize()` 和 `deserialize()` 是编辑器级别函数，需要 NodeEditor 实例，将放在 `serializers/index.ts` 中。

**Step 1: 创建文件**

---

## Task 12: 创建 serializers/index.ts

**文件：** Create: `core/src/serializers/index.ts`

重新组织 `serialization.ts` 的内容：

```typescript
import { NodeEditor } from 'rete'

import { Connection, JSONConnection } from '../models/Connection'
import { BaseNode, JSONBaseNode } from '../models/Node'
import { Schemes } from '../types'

import { SocketSerializer } from './SocketSerializer'
import { ControlSerializer } from './ControlSerializer'
import { InputSerializer, OutputSerializer } from './PortSerializer'
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
```

**Step 1: 创建文件**

---

## Task 13: 更新 core/src/index.ts

**文件：** Modify: `core/src/index.ts`

将导出改为从新位置重导出：

```typescript
export * from './models'           // 替换 nodes, sockets, controls, connections
export * from './serializers'      // 替换 serialization
export * from './core'
export { applyInteraction } from './interaction'
export type { Language, LanguageSnippet } from './languages'
export * from './languages'
export type { ClassicSchemes, ConnProps, NodeProps, Schemes, Size } from './types'
export * as Utils from './utils'
```

**注意：** `models/index.ts` 已通过 `export * from './Socket'` 等导出所有 JSON 类型，无需额外导出。

**Step 1: 更新文件**

---

## Task 14: 更新 core/src/types.ts

**文件：** Modify: `core/src/types.ts`

更新 import 来源（移除旧的 `from './nodes'` 和 `from './connections'`）：

```typescript
import { ClassicPreset, GetSchemes } from 'rete'
import { BaseNode } from './models/Node'
import { Connection } from './models/Connection'

export type NodeProps = BaseNode
export type ConnProps = Connection<BaseNode, BaseNode>
export type Schemes = GetSchemes<NodeProps, ConnProps>

export interface Cloneable {
  clone(keepId?: boolean): this;
}

type ClassicNode = ClassicPreset.Node & { type: string, data: Record<string, any>, parent?: string } & Cloneable
type C<S extends ClassicNode, T extends ClassicNode> = ClassicPreset.Connection<S, T> & { isLoop?: boolean }
export type ClassicSchemes = GetSchemes<ClassicNode, C<ClassicNode, ClassicNode>>
export type Size = { width: number, height: number }
```

**Step 1: 更新文件**

---

## Task 15: 删除旧文件

**文件：** Delete: `core/src/nodes.ts`, `core/src/sockets.ts`, `core/src/controls.ts`, `core/src/connections.ts`, `core/src/serialization.ts`

确认所有新文件创建完成后删除旧文件。

**Step 1: 删除旧文件**

---

## Task 16: 验证编译

**Step 1:** 运行 TypeScript 编译

```bash
cd core && npm run build
```

或

```bash
npx tsc --noEmit
```

**预期：** 无编译错误。

**Step 2:** 检查 `demo` 和 `ui` 包

```bash
cd demo && npm run build
```

**预期：** 无编译错误，所有外部导入正常工作。

---

## 执行顺序

1. Task 1-6: 创建所有 models 文件
2. Task 7-12: 创建所有 serializers 文件
3. Task 13-14: 更新入口文件
4. Task 15: 删除旧文件
5. Task 16: 验证编译

> **重构原则：** 每个 Task 完成后验证一次编译，不积累错误。
