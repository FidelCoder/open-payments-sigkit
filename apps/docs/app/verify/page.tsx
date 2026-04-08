import { VerifyTool } from '../../components/verify-tool'
import {
  defaultJwksText,
  defaultPublicKeyJwkText,
  demoExamples,
  getInitialPreset,
  getVerifyToolDefaults,
  presetOptions,
  resolveDemoExampleName
} from '../../lib/demo-defaults'

type VerifyPageProps = {
  searchParams?: Promise<{
    example?: string | string[]
  }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = searchParams ? await searchParams : {}
  const selectedExample = resolveDemoExampleName(params.example, 'custom')

  return (
    <VerifyTool
      key={selectedExample}
      defaults={getVerifyToolDefaults(selectedExample)}
      examples={demoExamples}
      initialPreset={getInitialPreset(selectedExample)}
      jwksText={defaultJwksText}
      presetOptions={presetOptions}
      publicKeyJwkText={defaultPublicKeyJwkText}
      selectedExample={selectedExample}
    />
  )
}
