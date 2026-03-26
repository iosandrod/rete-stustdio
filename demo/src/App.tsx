import { ConfigProvider } from 'antd'
import './App.css'
import { Playground } from './Playground'
import { tokens } from './theme'
import { SwitchLang, useLang } from './Lang'
import './styles.css'
import { useEffect, useMemo, useState } from 'react'
import JSWorker from './workers/javascript?worker'
import TemplateWorker from './workers/template?worker'
import { OnlyMethods, requestable } from 'worker-bridge'
import { LanguageAdapter } from 'rete-studio-core'

const languages: Record<string, OnlyMethods<LanguageAdapter>> = {
  javascript: requestable<LanguageAdapter>(new JSWorker()),
  template: requestable<LanguageAdapter>(new TemplateWorker())
}

function App() {
  const langId = useLang()
  const lang = useMemo(() => languages[langId], [langId])
  const [playgroundExample, setPlaygroundExample] = useState<string>('')

  useEffect(() => {
    lang.getExample().then(setPlaygroundExample)
  }, [lang])

  return (
    <ConfigProvider
      theme={{
        token: tokens
      }}
    >
      <Playground
        example={playgroundExample}
        lang={lang}
        switchLang={<SwitchLang />}
      />
    </ConfigProvider>
  )
}

export default App
