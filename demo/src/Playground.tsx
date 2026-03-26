'use client'
import { Editor } from '@monaco-editor/react';
import { editor as monaco } from 'monaco-editor';
import { useEffect, useState, useCallback } from 'react';
import { LanguageAdapter, LanguageSnippet } from 'rete-studio-core';
import styled from 'styled-components';
import { useDebounceValue } from 'usehooks-ts'
import { Spin as AntSpin } from 'antd'
import { DeliveredProcedureOutlined, CodeFilled, LayoutFilled } from '@ant-design/icons'
import { Button, Tooltip, message, Alert } from 'antd';
import { useRete } from 'rete-react-plugin';
import { createEditor } from './editor'
import { Theme } from './theme';

// Inline Alert component
const StyledAlert = styled(Alert)`
  position: absolute;
  bottom: 1em;
  z-index: 14;
`
function CodeError(props: { message: string, placement: 'left' | 'right' }) {
  return <StyledAlert
    type='error'
    message={props.message}
    showIcon={true}
    style={props.placement === 'left' ? { left: '1em' } : { right: '1em' }}
  />
}

// Inline Spin component
const Spin = styled(AntSpin)`
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 2;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: none !important;
`

// Inline Area component
const Area = styled.div`
  border-radius: 1em;
  overflow: hidden;
  border: 2px solid #464646;
  background: #1e1e1e;
  color: white;
`

// Inline CopyCode component
const CopyButton = styled(Button)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 20;
`
function CopyCode(props: { value: string }) {
  const [messageApi, contextHolder] = message.useMessage({ top: 20 });
  return (
    <Theme>
      {contextHolder}
      <Tooltip placement="top" title="Copy executable code">
        <CopyButton
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

// Editor buttons
const SaveButton = styled(Button)`
  position: absolute !important;
  top: 1em;
  right: 1em;
  z-index: 1;
`
const LayoutButton = styled(Button)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 1;
`

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
          <SaveButton onClick={graphToCode.execute} icon={<CodeFilled />} />
        </Tooltip>
        <Tooltip placement="top" title="Layout">
          <LayoutButton onClick={() => editor?.layout()} icon={<LayoutFilled />} />
        </Tooltip>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />
      </Theme>
    )
  }
}

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 2fr 3fr;
  grid-template-areas:
    'source result'
    'canvas canvas';
  gap: 0.6em;
  padding: 0.6em;
  box-sizing: border-box;
  overflow: hidden;
  @media (max-height: 500px) {
    grid-template-columns: minmax(300px, 1fr) 3fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      'source canvas'
      'result canvas';
  }
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr 1fr;
    grid-template-areas:
      'source'
      'canvas'
      'result';
  }
`

const Source = styled(Area)`
  grid-area: source;
  position: relative;
`

const Result = styled(Area)`
  grid-area: result;
  position: relative;
`

const Canvas = styled(Area)`
  grid-area: canvas;
  position: relative;
`

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
      <LayoutGrid>
        <Source>
          <Editor theme="vs-dark" language="javascript" value={code} onChange={setCode} options={options} />
          {switchLang}
          {editor.codeToGraph.status && <CodeError message={editor.codeToGraph.status?.message} placement="right" />}
        </Source>
        <Result>
          <Spin spinning={editor.graphToCode.loading} />
          <Editor theme="vs-dark" language="javascript" value={editor.code} options={{ readOnly: true, ...options }} />
          <CopyCode value={editor.executableCode || ''} />
          {editor.graphToCode.status && <CodeError message={editor.graphToCode.status?.message} placement="right" />}
        </Result>
        <Canvas>
          <Spin spinning={editor.codeToGraph.loading} size="large" />
          {editor.canvas}
        </Canvas>
      </LayoutGrid>
    </Theme>
  )
}
