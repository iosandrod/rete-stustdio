import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components'
import { Select } from 'antd';

const SwitchSelect = styled(Select)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 20;
`

const defaultLang = 'javascript'

const languages = [{
  name: 'JavaScript',
  key: 'javascript',
}, {
  name: '(template)',
  key: 'template',
}]

export function useLang(lang?: string | null) {
  return lang || defaultLang
}

type SwitchLangProps = {
  lang?: string | null
  setLang: (lang: string) => void
  languages: {
    name: string
    key: string
  }[]
}

export function SwitchLangBase(props: SwitchLangProps) {
  return (
    <SwitchSelect
      size='small'
      value={props.lang || defaultLang}
      onChange={(value: any) => props.setLang(value as string)}
      style={{ width: 110 }}
      options={props.languages.map(({ name, key }) => {
        return { label: name, value: key }
      })}
    />
  )
}

// Default export: URL-wrapped version for App.tsx
export function SwitchLang() {
  const [searchParams, setSearchParams] = useSearchParams()
  return <SwitchLangBase
    languages={languages}
    lang={searchParams?.get('language')}
    setLang={value => setSearchParams([['language', value]])}
  />
}

export function useLangWithUrl() {
  const [searchParams] = useSearchParams()
  return useLang(searchParams?.get('language'))
}
