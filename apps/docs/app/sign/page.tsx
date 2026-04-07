import { SignTool } from '../../components/sign-tool'
import {
  defaultPrivateKeyJwkText,
  grantRequestDefaults,
  presetOptions
} from '../../lib/demo-defaults'

export default function SignPage() {
  return (
    <SignTool
      defaults={grantRequestDefaults}
      keyId="fixture-primary-key"
      presetOptions={presetOptions}
      privateKeyJwkText={defaultPrivateKeyJwkText}
    />
  )
}

