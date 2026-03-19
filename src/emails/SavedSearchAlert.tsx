// src/emails/SavedSearchAlert.tsx
// React Email template for new listing alert emails
// Source: @react-email/components docs
import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from '@react-email/components'

interface NewListing {
  mlsNumber: string
  address: string
  price: number
}

interface SavedSearchAlertProps {
  userName: string
  searchName: string
  newListings: NewListing[]
  searchUrl: string
}

export function SavedSearchAlert({ userName, searchName, newListings, searchUrl }: SavedSearchAlertProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>
            New listings match your search
          </Heading>
          <Text style={{ color: '#64748b', fontSize: '16px' }}>
            Hi {userName}, {newListings.length} new listing{newListings.length !== 1 ? 's' : ''} match
            your saved search <strong>&quot;{searchName}&quot;</strong>:
          </Text>

          <Section>
            {newListings.map((listing) => (
              <Section key={listing.mlsNumber} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <Text style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '18px', margin: '0' }}>
                  ${listing.price.toLocaleString()}
                </Text>
                <Text style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                  {listing.address}
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

          <Button
            href={searchUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            View All Listings
          </Button>

          <Text style={{ color: '#94a3b8', fontSize: '12px', marginTop: '32px' }}>
            You&apos;re receiving this because you saved a property search on Ease.
            MLS data is provided under VOW agreement for personal use only.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
