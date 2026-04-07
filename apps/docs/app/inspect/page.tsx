import { InspectTool } from '../../components/inspect-tool'
import { signedQuoteRequestDefaults } from '../../lib/demo-defaults'

export default function InspectPage() {
  return <InspectTool defaults={signedQuoteRequestDefaults} />
}
