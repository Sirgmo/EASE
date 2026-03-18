'use client';

import { cn } from '@/lib/utils';
import {
  Bot,
  CheckCircle2,
  Clock,
  Mail,
  MoreHorizontal,
  Phone,
} from 'lucide-react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isAI?: boolean;
  status: 'active' | 'pending' | 'completed';
  lastActivity?: string;
  email?: string;
  phone?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
}

export interface TeamSectionProps {
  members: TeamMember[];
  className?: string;
}

function getStatusColor(status: TeamMember['status']) {
  switch (status) {
    case 'active':
      return 'bg-success-500';
    case 'pending':
      return 'bg-warning-500';
    case 'completed':
      return 'bg-secondary-400';
  }
}


/**
 * Avatar Component
 */
function Avatar({
  name,
  avatar,
  isAI,
  status,
  size = 'md',
}: {
  name: string;
  avatar?: string;
  isAI?: boolean;
  status: TeamMember['status'];
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const statusSizeClasses = {
    sm: 'h-2.5 w-2.5 -bottom-0 -right-0',
    md: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
    lg: 'h-4 w-4 -bottom-0.5 -right-0.5',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : isAI ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white',
            sizeClasses[size]
          )}
        >
          <Bot className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-secondary-200 font-semibold text-secondary-600',
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}
      {/* Status indicator */}
      <div
        className={cn(
          'absolute rounded-full border-2 border-white',
          getStatusColor(status),
          statusSizeClasses[size]
        )}
      />
    </div>
  );
}

/**
 * Team Member Card
 */
function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-secondary-100 bg-white p-4 transition-all hover:shadow-elevation-1">
      <div className="flex items-center gap-4">
        <Avatar
          name={member.name}
          {...(member.avatar !== undefined && { avatar: member.avatar })}
          {...(member.isAI !== undefined && { isAI: member.isAI })}
          status={member.status}
          size="md"
        />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-secondary-900">{member.name}</h4>
            {member.isAI && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                AI Agent
              </span>
            )}
          </div>
          <p className="text-sm text-secondary-500">{member.role}</p>
          {member.lastActivity && (
            <p className="mt-1 flex items-center gap-1 text-xs text-secondary-400">
              <Clock className="h-3 w-3" />
              {member.lastActivity}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Task progress */}
        {member.tasksCompleted !== undefined && member.tasksTotal !== undefined && (
          <div className="mr-4 text-right">
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success-500" />
              <span className="font-medium text-secondary-900">
                {member.tasksCompleted}/{member.tasksTotal}
              </span>
            </div>
            <p className="text-xs text-secondary-400">Tasks</p>
          </div>
        )}

        {/* Contact buttons */}
        {!member.isAI && (
          <>
            {member.email && (
              <button className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
                <Mail className="h-4 w-4" />
              </button>
            )}
            {member.phone && (
              <button className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
                <Phone className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        <button className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Team Avatars Row (compact view)
 */
export function TeamAvatarsRow({
  members,
  maxDisplay = 5,
  className,
}: {
  members: TeamMember[];
  maxDisplay?: number;
  className?: string;
}) {
  const displayMembers = members.slice(0, maxDisplay);
  const remaining = members.length - maxDisplay;

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-3">
        {displayMembers.map((member) => (
          <div
            key={member.id}
            className="relative rounded-full border-2 border-white"
            title={member.name}
          >
            <Avatar
              name={member.name}
              {...(member.avatar !== undefined && { avatar: member.avatar })}
              {...(member.isAI !== undefined && { isAI: member.isAI })}
              status={member.status}
              size="sm"
            />
          </div>
        ))}
        {remaining > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-secondary-200 text-xs font-semibold text-secondary-600">
            +{remaining}
          </div>
        )}
      </div>
      <span className="ml-3 text-sm text-secondary-500">{members.length} team members</span>
    </div>
  );
}

/**
 * Team Section Component
 *
 * Shows all participants in the transaction
 */
export function TeamSection({ members, className }: TeamSectionProps) {
  // Group members by status
  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const completedMembers = members.filter((m) => m.status === 'completed');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Active Members */}
      {activeMembers.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary-700">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            Active ({activeMembers.length})
          </h3>
          <div className="space-y-3">
            {activeMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Members */}
      {pendingMembers.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary-700">
            <span className="h-2 w-2 rounded-full bg-warning-500" />
            Pending ({pendingMembers.length})
          </h3>
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Members */}
      {completedMembers.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary-700">
            <span className="h-2 w-2 rounded-full bg-secondary-400" />
            Completed ({completedMembers.length})
          </h3>
          <div className="space-y-3">
            {completedMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
