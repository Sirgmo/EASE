import crypto from 'crypto'

// ─── Minimal local interface — avoids importing docusign-esign types at build time ─────────────
// Using a local interface instead of `import type { ApiClient } from 'docusign-esign'` prevents
// Turbopack from tracing into the docusign-esign package during production builds.
// docusign-esign uses AMD define() which Turbopack (Next.js 16 production bundler) cannot parse.
interface DocuSignApiClient {
  setBasePath(path: string): void
  requestJWTUserToken(
    integrationKey: string,
    userId: string,
    scopes: string[],
    privateKey: Buffer,
    tokenLifetimeSecs: number
  ): Promise<{ body: { access_token?: string } }>
  addDefaultHeader(key: string, value: string): void
  getUserInfo(token: string): Promise<unknown>
}

type DocuSignModule = {
  ApiClient: new () => DocuSignApiClient
  EnvelopesApi: new (client: DocuSignApiClient) => {
    createEnvelope(accountId: string, opts: { envelopeDefinition: unknown }): Promise<{ envelopeId?: string }>
    createRecipientView(accountId: string, envelopeId: string, opts: { recipientViewRequest: unknown }): Promise<{ url?: string }>
  }
  EnvelopeDefinition: new () => Record<string, unknown>
  Document: new () => Record<string, unknown>
  Signer: new () => Record<string, unknown>
  Recipients: new () => Record<string, unknown>
  RecipientViewRequest: new () => Record<string, unknown>
}

// Lazy-load docusign-esign at runtime to prevent Turbopack from statically tracing its AMD modules.
// Top-level require() is traced by Turbopack; function-level require() is not.
// eslint-disable-next-line @typescript-eslint/no-require-imports
function getDocuSignModule(): DocuSignModule { return require('docusign-esign') as DocuSignModule }

// ─── Pure utility (exported for testability — no HTTP, no SDK) ────────────────

/**
 * Verifies a DocuSign Connect HMAC-SHA256 webhook signature.
 * MUST be called on raw bytes BEFORE JSON.parse() — parsing may normalise whitespace.
 *
 * @param rawBody  Raw request body as Buffer (from request.arrayBuffer())
 * @param signature  Value of X-DocuSign-Signature-1 header (base64-encoded HMAC)
 * @param secret  DOCUSIGN_WEBHOOK_SECRET env var value
 */
export function verifyDocuSignHmac(rawBody: Buffer, signature: string, secret: string): boolean {
  if (!signature) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    )
  } catch {
    // Buffer lengths differ (invalid base64 or empty) — can't be equal
    return false
  }
}

// ─── JWT Authentication ────────────────────────────────────────────────────────

/**
 * Returns an authenticated DocuSign ApiClient.
 * Calls getUserInfo() to get the account-specific base URI — never hardcoded.
 * Catches consent_required and throws with actionable admin message.
 */
export async function getDocuSignApiClient(): Promise<DocuSignApiClient> {
  const docusign = getDocuSignModule()
  const apiClient = new docusign.ApiClient()

  // Initial base path for JWT grant — will be overridden by getUserInfo() result
  apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH ?? 'https://demo.docusign.net/restapi')

  let tokenResult: Awaited<ReturnType<typeof apiClient.requestJWTUserToken>>
  try {
    tokenResult = await apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY!,
      process.env.DOCUSIGN_USER_ID!,
      ['signature', 'impersonation'],
      // DOCUSIGN_RSA_PRIVATE_KEY stored as single line with literal \n — convert to real newlines
      Buffer.from((process.env.DOCUSIGN_RSA_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')),
      3600
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('consent_required')) {
      throw new Error(
        'DocuSign consent_required: Admin must grant consent at ' +
        `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature+impersonation` +
        `&client_id=${process.env.DOCUSIGN_INTEGRATION_KEY}&redirect_uri=https://localhost:3000`
      )
    }
    throw err
  }

  const accessToken = tokenResult.body.access_token!
  apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)

  // Fetch account base URI — do NOT hardcode; account-specific and environment-specific
  const userInfo = await apiClient.getUserInfo(accessToken)
  const account = (userInfo as { accounts?: Array<{ baseUri?: string }> }).accounts?.[0]
  if (!account?.baseUri) {
    throw new Error('DocuSign getUserInfo did not return a baseUri')
  }

  apiClient.setBasePath(`${account.baseUri}/restapi`)

  return apiClient
}

// ─── Envelope + Embedded Signing ──────────────────────────────────────────────

export interface EmbeddedSigningOptions {
  /** Base64-encoded PDF content */
  pdfBase64: string
  /** Display name shown in DocuSign UI */
  documentName: string
  /** Signer's email address */
  signerEmail: string
  /** Signer's full name */
  signerName: string
  /** URL DocuSign redirects to after signing completes */
  returnUrl: string
  /** Unique identifier for this signing session (use document ID) */
  clientUserId: string
}

/**
 * Creates a DocuSign envelope with one PDF and one signer,
 * returns the embedded signing URL for redirect.
 * Phase 4 scope: single-signer only (buyer condition waivers).
 */
export async function createEmbeddedSigningUrl(
  opts: EmbeddedSigningOptions
): Promise<{ signingUrl: string; envelopeId: string }> {
  const docusign = getDocuSignModule()
  const apiClient = await getDocuSignApiClient()
  const envelopesApi = new docusign.EnvelopesApi(apiClient)
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID!

  const envelopeDefinition = new docusign.EnvelopeDefinition()
  envelopeDefinition['emailSubject'] = `Please sign: ${opts.documentName}`
  envelopeDefinition['status'] = 'sent'

  const doc = new docusign.Document()
  doc['documentBase64'] = opts.pdfBase64
  doc['name'] = opts.documentName
  doc['fileExtension'] = 'pdf'
  doc['documentId'] = '1'
  envelopeDefinition['documents'] = [doc]

  // clientUserId marks this as an embedded signer — required for embedded signing URL
  const signer = new docusign.Signer()
  signer['email'] = opts.signerEmail
  signer['name'] = opts.signerName
  signer['recipientId'] = '1'
  signer['routingOrder'] = '1'
  signer['clientUserId'] = opts.clientUserId

  const recipients = new docusign.Recipients()
  recipients['signers'] = [signer]
  envelopeDefinition['recipients'] = recipients

  const envelopeResponse = await envelopesApi.createEnvelope(accountId, { envelopeDefinition })
  const envelopeId = envelopeResponse.envelopeId
  if (!envelopeId) throw new Error('DocuSign createEnvelope did not return an envelopeId')

  const recipientViewRequest = new docusign.RecipientViewRequest()
  recipientViewRequest['returnUrl'] = opts.returnUrl
  recipientViewRequest['authenticationMethod'] = 'none'
  recipientViewRequest['email'] = opts.signerEmail
  recipientViewRequest['userName'] = opts.signerName
  recipientViewRequest['clientUserId'] = opts.clientUserId

  const viewResponse = await envelopesApi.createRecipientView(accountId, envelopeId, {
    recipientViewRequest,
  })

  if (!viewResponse.url) throw new Error('DocuSign createRecipientView did not return a URL')

  return { signingUrl: viewResponse.url, envelopeId }
}
