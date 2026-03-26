'use client'
import { Editor } from '@monaco-editor/react';
import { editor as monaco } from 'monaco-editor';
import { useEffect, useState, useCallback } from 'react';
import { LanguageAdapter, LanguageSnippet } from 'rete-studio-core';
import { useDebounceValue } from 'usehooks-ts'
import { Spin as AntSpin } from 'antd'
import { DeliveredProcedureOutlined, CodeFilled, LayoutFilled } from '@ant-design/icons'
import { Button, Tooltip, message, Alert } from 'antd';
import { useRete } from 'rete-react-plugin';
import { createEditor } from './editor'
import { Theme } from './theme';

type CodeErrorProps = { message: string, placement: 'left' | 'right' }
function CodeError(props: CodeErrorProps) {
  return (
    <Alert
      type='error'
      message={props.message}
      showIcon={true}
      className="absolute bottom-4 z-14"
      style={props.placement === 'left' ? { left: '1em' } : { right: '1em' }}
    />
  )
}

type CopyCodeProps = { value: string }
function CopyCode(props: CopyCodeProps) {
  const [messageApi, contextHolder] = message.useMessage({ top: 20 });
  return (
    <Theme>
      {contextHolder}
      <Tooltip placement="top" title="Copy executable code">
        <Button
          className="absolute bottom-4 right-4 z-20"
          onClick={() => {
            navigator.clipboard.writeText(props.value)
            messageApi.info('Copied to clipboard')
          }}
          icon={<DeliveredProcedureOutlined />}
        />
      </Tooltip>
    </Theme>
  )
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function useTask(props: { execute: () => unknown | Promise<unknown>, fail: () => unknown | Promise<unknown> }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  return {
    loading,
    status,
    async execute() {
      try {
        setLoading(true)
        setStatus(null)
        await props.execute()
      } catch (e) {
        await props.fail()
        setStatus({ type: 'error', message: (e as Error).message })
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
  }
}

function useEditor(props: { lang: LanguageAdapter, code: string | undefined, autoCode?: boolean }) {
  const [snippets, setSnippets] = useState<LanguageSnippet[]>([])

  const create = useCallback((container: HTMLElement) => {
    return createEditor(container, snippets, props.lang)
  }, [snippets, props.lang])
  const [ref, editor] = useRete(create)
  const [code, setCode] = useState<string | undefined>()
  const [executableCode, setExecutableCode] = useState<undefined | string>()

  useEffect(() => {
    props.lang.getSnippets().then(setSnippets)
  }, [props.lang])

  useEffect(() => {
    if (code && editor) {
      editor.codeToExecutable(code).then(setExecutableCode)
    } else setExecutableCode(undefined)
  }, [code, editor])

  const codeToGraph = useTask({
    async execute() {
      if (!editor || !props.code) return
      await Promise.all([delay(400), editor.codeToGraph(props.code)])
    },
    fail: () => editor?.clear()
  })
  const graphToCode = useTask({
    async execute() {
      if (!editor) return
      const [, code] = await Promise.all([delay(400), editor.graphToCode()])
      setCode(code)
    },
    fail: () => setCode('// can\'t transpile graph into code')
  })

  useEffect(() => {
    if (props.code && editor) {
      void async function () {
        await codeToGraph.execute()
        if (props.autoCode !== false) await graphToCode.execute()
      }()
    }
  }, [editor, props.code])

  return {
    codeToGraph,
    graphToCode,
    code,
    executableCode,
    canvas: (
      <Theme>
        <Tooltip placement="bottom" title="To code">
          <Button
            className="absolute top-4 right-4 z-10"
            onClick={graphToCode.execute}
            icon={<CodeFilled />}
          />
        </Tooltip>
        <Tooltip placement="top" title="Layout">
          <Button
            className="absolute bottom-4 right-4 z-10"
            onClick={() => editor?.layout()}
            icon={<LayoutFilled />}
          />
        </Tooltip>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />
      </Theme>
    )
  }
}

export function Playground({ lang, example, switchLang }: { switchLang: React.ReactNode, example: string, lang: LanguageAdapter }) {
  const [code, setCode] = useState<string | undefined>()
  const [debouncedCode] = useDebounceValue(code, 500)
  const editor = useEditor({ lang, code: debouncedCode })

  useEffect(() => {
    setCode(example)
  }, [example])

  const options: monaco.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    padding: { top: 10 }
  }

  return (
    <Theme>
      <div className="grid grid-cols-2 grid-rows-2 gap-2 p-2 box-border overflow-hidden" style={{ gridTemplateAreas: "'source result' 'canvas canvas'" }}>
        <div className="rounded-lg overflow-hidden border-2 border-[#464646] bg-[#1e1e1e] text-white relative" style={{ gridArea: 'source' }}>
          <Editor theme="vs-dark" language="javascript" value={code} onChange={setCode} options={options} />
          {switchLang}
          {editor.codeToGraph.status && <CodeError message={editor.codeToGraph.status?.message} placement="right" />}
        </div>

        <div className="rounded-lg overflow-hidden border-2 border-[#464646] bg-[#1e1e1e] text-white relative" style={{ gridArea: 'result' }}>
          <AntSpin
            spinning={editor.graphToCode.loading}
            className="!absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none !z-10"
          />
          <Editor theme="vs-dark" language="javascript" value={editor.code} options={{ readOnly: true, ...options }} />
          <CopyCode value={editor.executableCode || ''} />
          {editor.graphToCode.status && <CodeError message={editor.graphToCode.status?.message} placement="right" />}
        </div>

        <div className="rounded-lg overflow-hidden border-2 border-[#464646] bg-[#1e1e1e] text-white relative" style={{ gridArea: 'canvas' }}>
          <AntSpin
            spinning={editor.codeToGraph.loading}
            size="large"
            className="!absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none !z-10"
          />
          {editor.canvas}
        </div>
      </div>
    </Theme>
  )
}
