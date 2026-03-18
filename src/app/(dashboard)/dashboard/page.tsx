import { MapPin, Building2, DollarSign, Calendar } from 'lucide-react';
import {
  TransactionTimeline,
  ActiveStatusCard,
  TeamSection,
  TeamAvatarsRow,
  AIAssistantChat,
  type TimelineStage,
  type ActionItem,
  type TeamMember,
  type SuggestedAction,
} from '@/components/dashboard';

export const metadata = {
  title: 'My Deal',
  description: 'Track your real estate transaction progress in real-time.',
};

// Mock data for Downtown Toronto Condo transaction
const MOCK_TRANSACTION = {
  id: 'tx-001',
  property: {
    address: '123 Queen Street West, Unit 2405',
    city: 'Toronto',
    province: 'ON',
    price: 899000,
    type: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
  },
  stage: 'conditions',
  targetCloseDate: '2025-02-28',
  daysToClose: 47,
};

// Timeline stages
const timelineStages: TimelineStage[] = [
  {
    id: 'search',
    label: 'Search',
    description: 'Found your home',
    status: 'completed',
    icon: 'search',
    date: 'Dec 15, 2024',
  },
  {
    id: 'offer',
    label: 'Offer',
    description: 'Submitted $885K',
    status: 'completed',
    icon: 'offer',
    date: 'Jan 5, 2025',
  },
  {
    id: 'accepted',
    label: 'Accepted',
    description: 'Offer accepted',
    status: 'completed',
    icon: 'accepted',
    date: 'Jan 8, 2025',
  },
  {
    id: 'conditions',
    label: 'Conditions',
    description: 'Inspection & financing',
    status: 'current',
    icon: 'conditions',
    date: 'Due Jan 25',
  },
  {
    id: 'closing',
    label: 'Closing',
    description: 'Final steps',
    status: 'upcoming',
    icon: 'closing',
    date: 'Feb 28, 2025',
  },
];

// Current action item
const mainAction: ActionItem = {
  id: 'action-1',
  title: 'Awaiting Inspection Report',
  description:
    'Your home inspection was completed yesterday. The inspector is preparing the detailed report with findings and recommendations.',
  dueDate: 'January 20, 2025',
  daysRemaining: 2,
  priority: 'high',
  type: 'waiting',
  assignedTo: 'John Smith (HomeCheck Pro)',
  ctaLabel: 'Contact Inspector',
};

// Upcoming actions
const upcomingActions: ActionItem[] = [
  {
    id: 'action-2',
    title: 'Review Inspection Report',
    description: 'Review and discuss findings',
    daysRemaining: 3,
    priority: 'high',
    type: 'review',
  },
  {
    id: 'action-3',
    title: 'Mortgage Pre-Approval',
    description: 'Submit final documents to lender',
    daysRemaining: 5,
    priority: 'medium',
    type: 'action',
  },
  {
    id: 'action-4',
    title: 'Condition Waiver Deadline',
    description: 'All conditions must be satisfied',
    daysRemaining: 7,
    priority: 'high',
    type: 'action',
  },
];

// Team members
const teamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'You',
    role: 'Buyer',
    status: 'active',
    lastActivity: 'Just now',
    tasksCompleted: 8,
    tasksTotal: 12,
  },
  {
    id: 'ai-agent',
    name: 'EASE AI',
    role: 'Transaction Coordinator',
    isAI: true,
    status: 'active',
    lastActivity: 'Monitoring 24/7',
    tasksCompleted: 15,
    tasksTotal: 15,
  },
  {
    id: 'lawyer-1',
    name: 'Jennifer Martinez',
    role: 'Real Estate Lawyer',
    status: 'active',
    lastActivity: '2 hours ago',
    email: 'jennifer@lawfirm.com',
    phone: '(416) 555-0123',
    tasksCompleted: 3,
    tasksTotal: 8,
  },
  {
    id: 'inspector-1',
    name: 'John Smith',
    role: 'Home Inspector',
    status: 'active',
    lastActivity: 'Preparing report',
    email: 'john@homecheck.com',
    phone: '(416) 555-0456',
    tasksCompleted: 1,
    tasksTotal: 2,
  },
  {
    id: 'lender-1',
    name: 'Michael Chen',
    role: 'Mortgage Specialist',
    status: 'pending',
    lastActivity: 'Awaiting documents',
    email: 'mchen@bank.com',
    tasksCompleted: 2,
    tasksTotal: 5,
  },
];

// AI suggested actions
const suggestedActions: SuggestedAction[] = [
  {
    id: 'draft-offer',
    label: 'Draft a Counter-Offer',
    description: 'Based on inspection findings',
    icon: 'draft',
    action: 'Help me draft a counter-offer based on the inspection findings',
  },
  {
    id: 'schedule-viewing',
    label: 'Schedule Final Walkthrough',
    description: 'Before closing day',
    icon: 'schedule',
    action: 'Schedule a final walkthrough before closing',
  },
  {
    id: 'analyze-costs',
    label: 'Analyze My Costs',
    description: 'Full breakdown with LTT',
    icon: 'analyze',
    action: 'Show me a complete breakdown of all my closing costs',
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Property Header */}
      <div className="rounded-2xl border border-secondary-100 bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Property Info */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
              <Building2 className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-secondary-900 sm:text-2xl">
                {MOCK_TRANSACTION.property.address}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {MOCK_TRANSACTION.property.city}, {MOCK_TRANSACTION.property.province}
                </span>
                <span>•</span>
                <span>{MOCK_TRANSACTION.property.type}</span>
                <span>•</span>
                <span>
                  {MOCK_TRANSACTION.property.bedrooms} bed, {MOCK_TRANSACTION.property.bathrooms}{' '}
                  bath
                </span>
              </div>
              {/* Team Avatars */}
              <div className="mt-3">
                <TeamAvatarsRow members={teamMembers} maxDisplay={4} />
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="flex flex-wrap gap-6 lg:gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-secondary-500">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Purchase Price</span>
              </div>
              <p className="mt-1 font-display text-xl font-bold text-secondary-900">
                {formatCurrency(MOCK_TRANSACTION.property.price)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-secondary-500">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Days to Close</span>
              </div>
              <p className="mt-1 font-display text-xl font-bold text-primary-600">
                {MOCK_TRANSACTION.daysToClose}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-secondary-100 bg-white p-6">
        <h2 className="mb-6 font-display text-lg font-semibold text-secondary-900">
          Transaction Timeline
        </h2>
        <TransactionTimeline stages={timelineStages} orientation="horizontal" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Status - Takes 2 columns */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold text-secondary-900">
            What You Need to Do
          </h2>
          <ActiveStatusCard mainAction={mainAction} upcomingActions={upcomingActions} />
        </div>

        {/* AI Assistant (Embedded) */}
        <div className="lg:col-span-1">
          <h2 className="mb-4 font-display text-lg font-semibold text-secondary-900">
            AI Assistant
          </h2>
          <AIAssistantChat suggestedActions={suggestedActions} isFloating={false} />
        </div>
      </div>

      {/* Team Section */}
      <div className="rounded-2xl border border-secondary-100 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-secondary-900">Your Team</h2>
          <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Manage Team
          </button>
        </div>
        <TeamSection members={teamMembers} />
      </div>

      {/* Floating AI Chat Button (visible on scroll) */}
      <AIAssistantChat suggestedActions={suggestedActions} isFloating={true} />
    </div>
  );
}
