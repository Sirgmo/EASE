'use client';

import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  daysRemaining?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'action' | 'waiting' | 'review' | 'info';
  assignedTo?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface ActiveStatusCardProps {
  mainAction: ActionItem;
  upcomingActions?: ActionItem[];
  className?: string;
}

function getPriorityStyles(priority: ActionItem['priority']) {
  switch (priority) {
    case 'urgent':
      return {
        badge: 'bg-error-100 text-error-700',
        border: 'border-error-200',
        icon: 'text-error-500',
      };
    case 'high':
      return {
        badge: 'bg-warning-100 text-warning-700',
        border: 'border-warning-200',
        icon: 'text-warning-500',
      };
    case 'medium':
      return {
        badge: 'bg-primary-100 text-primary-700',
        border: 'border-primary-200',
        icon: 'text-primary-500',
      };
    case 'low':
      return {
        badge: 'bg-secondary-100 text-secondary-700',
        border: 'border-secondary-200',
        icon: 'text-secondary-500',
      };
  }
}

function getTypeIcon(type: ActionItem['type']) {
  switch (type) {
    case 'action':
      return AlertCircle;
    case 'waiting':
      return Clock;
    case 'review':
      return FileText;
    case 'info':
      return AlertTriangle;
  }
}

function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  }
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  return `Due in ${days} days`;
}

/**
 * Active Status Card Component
 *
 * Prominently displays "What do I need to do right now?"
 */
export function ActiveStatusCard({
  mainAction,
  upcomingActions = [],
  className,
}: ActiveStatusCardProps) {
  const priorityStyles = getPriorityStyles(mainAction.priority);
  const TypeIcon = getTypeIcon(mainAction.type);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Action Card */}
      <div
        className={cn(
          'rounded-2xl border-2 bg-white p-6 shadow-elevation-2 transition-all',
          priorityStyles.border
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
              mainAction.priority === 'urgent'
                ? 'bg-error-100'
                : mainAction.priority === 'high'
                  ? 'bg-warning-100'
                  : 'bg-primary-100'
            )}
          >
            <TypeIcon className={cn('h-6 w-6', priorityStyles.icon)} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                  priorityStyles.badge
                )}
              >
                {mainAction.priority === 'urgent' ? 'Action Required' : mainAction.type}
              </span>
              {mainAction.daysRemaining !== undefined && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    mainAction.daysRemaining <= 1 ? 'text-error-600' : 'text-secondary-500'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {formatDaysRemaining(mainAction.daysRemaining)}
                </span>
              )}
            </div>

            <h3 className="mt-2 font-display text-xl font-bold text-secondary-900">
              {mainAction.title}
            </h3>
            <p className="mt-1 text-secondary-600">{mainAction.description}</p>

            {mainAction.assignedTo && (
              <p className="mt-2 text-sm text-secondary-500">
                Assigned to: <span className="font-medium">{mainAction.assignedTo}</span>
              </p>
            )}

            {mainAction.dueDate && (
              <div className="mt-3 flex items-center gap-2 text-sm text-secondary-500">
                <Calendar className="h-4 w-4" />
                <span>Due: {mainAction.dueDate}</span>
              </div>
            )}

            {mainAction.ctaLabel && (
              <button className="btn-primary mt-4">
                {mainAction.ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Actions */}
      {upcomingActions.length > 0 && (
        <div className="rounded-xl border border-secondary-100 bg-white p-4">
          <h4 className="text-sm font-semibold text-secondary-700">Coming Up Next</h4>
          <div className="mt-3 space-y-3">
            {upcomingActions.map((action) => {
              const styles = getPriorityStyles(action.priority);
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between rounded-lg bg-secondary-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary-300" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{action.title}</p>
                      {action.daysRemaining !== undefined && (
                        <p className="text-xs text-secondary-500">
                          {formatDaysRemaining(action.daysRemaining)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles.badge)}>
                    {action.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
