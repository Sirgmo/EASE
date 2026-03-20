import { Html, Head, Body, Container, Section, Text, Heading, Hr, Button, Preview } from '@react-email/components'

interface InvitationEmailProps {
  token: string
  transactionId: string
  role: string
  inviterName: string
  appUrl: string
}

const ROLE_LABELS: Record<string, string> = {
  lawyer: 'Lawyer',
  inspector: 'Home Inspector',
  coordinator: 'Transaction Coordinator',
}

export function InvitationEmail({
  token,
  transactionId: _transactionId,
  role,
  inviterName,
  appUrl,
}: InvitationEmailProps) {
  const roleLabel = ROLE_LABELS[role] ?? role
  // Email links to confirmation PAGE — not directly to accept API endpoint
  // This prevents Microsoft SafeLink / corporate email scanners from consuming the token
  const acceptUrl = `${appUrl}/accept-invitation/${token}`

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} has invited you to join a real estate transaction on Ease as {roleLabel}
      </Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px', border: '1px solid #e5e7eb' }}>
          <Heading style={{ fontSize: '22px', color: '#111827', marginBottom: '8px' }}>
            You&apos;ve been invited to a transaction
          </Heading>
          <Text style={{ color: '#6b7280', marginTop: 0 }}>
            {inviterName} has invited you to join their real estate transaction on Ease as <strong>{roleLabel}</strong>.
          </Text>
          <Text style={{ color: '#374151' }}>
            As {roleLabel}, you will have access to the relevant documents and the transaction dashboard for this property.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={acceptUrl}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '15px',
                textDecoration: 'none',
              }}
            >
              View Invitation
            </Button>
          </Section>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>
            This invitation expires in 48 hours. If you did not expect this invitation, you can safely ignore this email.
          </Text>
          <Hr style={{ borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            Ease — Smarter real estate transactions.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InvitationEmail
