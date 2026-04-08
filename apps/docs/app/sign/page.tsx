import { SignTool } from '../../components/sign-tool'
import {
  defaultPrivateKeyJwkText,
  demoExamples,
  getInitialPreset,
  getSignToolDefaults,
  presetOptions,
  resolveDemoExampleName
} from '../../lib/demo-defaults'

type SignPageProps = {
  searchParams?: Promise<{
    example?: string | string[]
  }>
}

export default async function SignPage({ searchParams }: SignPageProps) {
  const params = searchParams ? await searchParams : {}
  const selectedExample = resolveDemoExampleName(params.example, 'custom')

  return (
    <SignTool
      key={selectedExample}
      defaults={getSignToolDefaults(selectedExample)}
      examples={demoExamples}
      initialPreset={getInitialPreset(selectedExample)}
      keyId="fixture-primary-key"
      presetOptions={presetOptions}
      privateKeyJwkText={defaultPrivateKeyJwkText}
      selectedExample={selectedExample}
    />
  )
}
