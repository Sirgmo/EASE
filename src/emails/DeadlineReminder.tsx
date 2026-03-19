// src/emails/DeadlineReminder.tsx
// React Email template for condition deadline reminder notifications
// Source: @react-email/components docs — consistent with SavedSearchAlert.tsx pattern
import { Html, Head, Body, Container, Section, Text, Heading, Hr, Button } from '@react-email/components'

interface DeadlineReminderProps {
  conditionType: string      // 'financing' | 'inspection'
  deadlineAt: string         // ISO date string (UTC)
  hoursRemaining: number     // 48, 24, or 4
  transactionId: string
  mlsNumber: string
  appUrl: string
}

export default function DeadlineReminder({
  conditionType,
  deadlineAt,
  hoursRemaining,
  transactionId,
  mlsNumber,
  appUrl,
}: DeadlineReminderProps) {
  // Format deadline for display in Toronto timezone
  const deadlineDate = new Date(deadlineAt)
  const formattedDeadline = deadlineDate.toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const conditionLabel = conditionType.charAt(0).toUpperCase() + conditionType.slice(1)
  const urgencyColor = hoursRemaining <= 4 ? '#dc2626' : hoursRemaining <= 24 ? '#d97706' : '#2563eb'
  const transactionUrl = `${appUrl}/transactions/${transactionId}`

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ color: '#1e293b', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>
            {conditionLabel} Condition Deadline Reminder
          </Heading>

          <Section
            style={{
              backgroundColor: urgencyColor,
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', margin: '0' }}>
              Your {conditionLabel.toLowerCase()} condition deadline is in {hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <Text style={{ color: '#64748b', fontSize: '14px', margin: '0 0 4px' }}>
              Property (MLS#{mlsNumber})
            </Text>
            <Text style={{ color: '#1e293b', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px' }}>
              Transaction #{transactionId.slice(0, 8).toUpperCase()}
            </Text>

            <Text style={{ color: '#64748b', fontSize: '14px', margin: '0 0 4px' }}>
              Condition Type
            </Text>
            <Text style={{ color: '#1e293b', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px' }}>
              {conditionLabel}
            </Text>

            <Text style={{ color: '#64748b', fontSize: '14px', margin: '0 0 4px' }}>
              Deadline
            </Text>
            <Text style={{ color: '#1e293b', fontSize: '16px', fontWeight: 'bold', margin: '0' }}>
              {formattedDeadline}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}
          >
            <Text style={{ color: '#92400e', fontSize: '14px', margin: '0' }}>
              <strong>Important:</strong> Condition waivers require a signed document. Visit your transaction
              dashboard to manage conditions and initiate the waiver process before the deadline.
            </Text>
          </Section>

          <Button
            href={transactionUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            View Transaction Dashboard
          </Button>

          <Hr style={{ borderColor: '#e2e8f0', margin: '32px 0 16px' }} />

          <Text style={{ color: '#94a3b8', fontSize: '12px', margin: '0' }}>
            This is an automated reminder from Ease. You are receiving this because you have an active
            {' '}{conditionLabel.toLowerCase()} condition on your transaction. If you have already waived
            this condition, you can disregard this message.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
