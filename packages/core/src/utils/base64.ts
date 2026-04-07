export const encodeUtf8 = (value: string): Buffer => Buffer.from(value, 'utf8')

export const encodeBase64 = (value: Uint8Array): string => Buffer.from(value).toString('base64')

export const decodeBase64 = (value: string): Buffer => Buffer.from(value, 'base64')

