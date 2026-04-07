import type { HttpRequestShape } from '@open-payments-devkit/core'
import { requests } from '@open-payments-devkit/fixtures'
import { ExamplesCatalog } from '../../components/examples-catalog'

export default function ExamplesPage() {
  return (
    <ExamplesCatalog
      examples={[
        {
          name: 'Grant request',
          preset: 'grant-request',
          request: requests.grantRequest as HttpRequestShape
        },
        {
          name: 'Quote request',
          preset: 'protected-request',
          request: requests.quoteRequest as HttpRequestShape
        },
        {
          name: 'Incoming payment',
          preset: 'resource-write',
          request: requests.incomingPayment as HttpRequestShape
        },
        {
          name: 'Outgoing payment',
          preset: 'resource-write',
          request: requests.outgoingPayment as HttpRequestShape
        }
      ]}
    />
  )
}

