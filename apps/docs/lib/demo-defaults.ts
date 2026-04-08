import { signRequest } from '@open-payments-devkit/core'
import type { HttpRequestShape, PresetName } from '@open-payments-devkit/core'
import { keys, requests } from '@open-payments-devkit/fixtures'
import { serializeHeaders } from './form-helpers'

export type DemoSelectionName = 'custom' | DemoExampleName
export type DocsPresetMode = 'custom' | PresetName
export type DemoExampleName =
  | 'grant-request'
  | 'quote-request'
  | 'incoming-payment'
  | 'outgoing-payment'

export type DemoToolRoute = 'sign' | 'verify' | 'inspect'

export type RequestEditorDefaults = {
  body: string
  headersText: string
  method: string
  url: string
}

export type DemoExample = {
  name: DemoExampleName
  label: string
  description: string
  preset: PresetName
  requestType: string
  request: HttpRequestShape
}

export const customRequestDefaults: RequestEditorDefaults = {
  body: '',
  headersText: '',
  method: 'POST',
  url: ''
}

const toRequestDefaults = (request: HttpRequestShape): RequestEditorDefaults => ({
  body: request.body ?? '',
  headersText: serializeHeaders(request.headers),
  method: request.method,
  url: request.url
})

export const demoExamples: DemoExample[] = [
  {
    description: 'Client grant creation request signed without an Authorization header.',
    label: 'Grant request',
    name: 'grant-request',
    preset: 'grant-request',
    requestType: 'grant creation',
    request: requests.grantRequest as HttpRequestShape
  },
  {
    description: 'Protected quote request carrying a GNAP access token bound to the client key.',
    label: 'Quote request',
    name: 'quote-request',
    preset: 'protected-request',
    requestType: 'quote request',
    request: requests.quoteRequest as HttpRequestShape
  },
  {
    description: 'Resource write flow for creating an incoming payment with digest coverage.',
    label: 'Incoming payment',
    name: 'incoming-payment',
    preset: 'resource-write',
    requestType: 'incoming payment',
    request: requests.incomingPayment as HttpRequestShape
  },
  {
    description: 'Protected resource write flow for creating an outgoing payment request.',
    label: 'Outgoing payment',
    name: 'outgoing-payment',
    preset: 'resource-write',
    requestType: 'outgoing payment',
    request: requests.outgoingPayment as HttpRequestShape
  }
]

export const getDemoExample = (name: DemoExampleName): DemoExample => {
  const example = demoExamples.find((entry) => entry.name === name)

  if (!example) {
    throw new Error(`Unknown demo example "${name}".`)
  }

  return example
}

const buildSignedExampleRequest = (name: DemoExampleName): HttpRequestShape => {
  const example = getDemoExample(name)

  return signRequest(example.request, {
    created: 1735689600,
    keyId: 'fixture-primary-key',
    preset: example.preset,
    privateKeyJwk: keys.privateKey
  }).request
}

export const resolveDemoExampleName = (
  value: string | string[] | undefined,
  fallback: DemoSelectionName
): DemoSelectionName => {
  const candidate = Array.isArray(value) ? value[0] : value

  if (candidate === 'custom') {
    return 'custom'
  }

  const selected = demoExamples.find((example) => example.name === candidate)

  return selected?.name ?? fallback
}

export const defaultPrivateKeyJwkText = JSON.stringify(keys.privateKey, null, 2)
export const defaultPublicKeyJwkText = JSON.stringify(keys.publicKey, null, 2)
export const defaultJwksText = JSON.stringify(keys.jwks, null, 2)

export const getInitialPreset = (name: DemoSelectionName): DocsPresetMode =>
  name === 'custom' ? 'custom' : getDemoExample(name).preset

export const getSignToolDefaults = (name: DemoSelectionName): RequestEditorDefaults =>
  name === 'custom' ? customRequestDefaults : toRequestDefaults(getDemoExample(name).request)

export const getVerifyToolDefaults = (name: DemoSelectionName): RequestEditorDefaults =>
  name === 'custom' ? customRequestDefaults : toRequestDefaults(buildSignedExampleRequest(name))

export const getInspectToolDefaults = (name: DemoSelectionName): RequestEditorDefaults =>
  name === 'custom' ? customRequestDefaults : toRequestDefaults(buildSignedExampleRequest(name))

export const presetOptions: PresetName[] = [
  'grant-request',
  'protected-request',
  'resource-write'
]
