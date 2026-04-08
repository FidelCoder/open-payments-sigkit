import { InspectTool } from '../../components/inspect-tool'
import {
  demoExamples,
  getInspectToolDefaults,
  resolveDemoExampleName
} from '../../lib/demo-defaults'

type InspectPageProps = {
  searchParams?: Promise<{
    example?: string | string[]
  }>
}

export default async function InspectPage({ searchParams }: InspectPageProps) {
  const params = searchParams ? await searchParams : {}
  const selectedExample = resolveDemoExampleName(params.example, 'custom')

  return (
    <InspectTool
      key={selectedExample}
      defaults={getInspectToolDefaults(selectedExample)}
      examples={demoExamples}
      selectedExample={selectedExample}
    />
  )
}
