import { ExamplesCatalog } from '../../components/examples-catalog'
import { demoExamples } from '../../lib/demo-defaults'

export default function ExamplesPage() {
  return <ExamplesCatalog examples={demoExamples} />
}
