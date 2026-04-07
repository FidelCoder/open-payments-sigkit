import { VerifyTool } from '../../components/verify-tool'
import {
  defaultJwksText,
  defaultPublicKeyJwkText,
  signedQuoteRequestDefaults,
  presetOptions
} from '../../lib/demo-defaults'

export default function VerifyPage() {
  return (
    <VerifyTool
      defaults={signedQuoteRequestDefaults}
      jwksText={defaultJwksText}
      presetOptions={presetOptions}
      publicKeyJwkText={defaultPublicKeyJwkText}
    />
  )
}
