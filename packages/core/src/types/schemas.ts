import { z } from 'zod'

const presetNameSchema = z.enum(['grant-request', 'protected-request', 'resource-write'])

const jwkSchema = z
  .object({
    alg: z.string().optional(),
    crv: z.string(),
    d: z.string().optional(),
    kid: z.string().optional(),
    kty: z.string(),
    x: z.string()
  })
  .passthrough()

export const httpRequestShapeSchema = z.object({
  body: z.string().optional(),
  headers: z.record(z.string()).optional(),
  method: z.string().min(1),
  url: z.string().url()
})

export const signRequestOptionsSchema = z.object({
  components: z.array(z.string().min(1)).optional(),
  created: z.number().int().nonnegative().optional(),
  expires: z.number().int().nonnegative().optional(),
  keyId: z.string().min(1),
  nonce: z.string().min(1).optional(),
  preset: presetNameSchema.optional(),
  privateKeyJwk: jwkSchema,
  tag: z.string().min(1).optional()
})

export const verifyRequestOptionsSchema = z.object({
  jwks: z
    .object({
      keys: z.array(jwkSchema)
    })
    .optional(),
  preset: presetNameSchema.optional(),
  publicKeyJwk: jwkSchema.optional(),
  requireDigestForBody: z.boolean().optional(),
  requiredComponents: z.array(z.string().min(1)).optional()
})

