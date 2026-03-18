'use client';

import { cn } from '@/lib/utils';
import {
  Search,
  FileText,
  CheckCircle2,
  ClipboardCheck,
  Key,
  Circle,
  Clock,
} from 'lucide-react';

export interface TimelineStage {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
  icon: 'search' | 'offer' | 'accepted' | 'conditions' | 'closing';
}

export interface TransactionTimelineProps {
  stages: TimelineStage[];
  className?: string | undefined;
  orientation?: 'horizontal' | 'vertical';
}

const stageIcons = {
  search: Search,
  offer: FileText,
  accepted: CheckCircle2,
  conditions: ClipboardCheck,
  closing: Key,
};

function getStatusStyles(status: TimelineStage['status']) {
  switch (status) {
    case 'completed':
      return {
        container: 'bg-success-500 text-white',
        line: 'bg-success-500',
        label: 'text-secondary-900',
        description: 'text-secondary-500',
      };
    case 'current':
      return {
        container: 'bg-primary-500 text-white ring-4 ring-primary-100',
        line: 'bg-secondary-200',
        label: 'text-primary-600 font-semibold',
        description: 'text-secondary-600',
      };
    case 'upcoming':
      return {
        container: 'bg-secondary-100 text-secondary-400',
        line: 'bg-secondary-200',
        label: 'text-secondary-400',
        description: 'text-secondary-400',
      };
  }
}

/**
 * Horizontal Timeline Component
 */
function HorizontalTimeline({ stages, className }: TransactionTimelineProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex items-start justify-between">
        {/* Connection line */}
        <div className="absolute left-0 right-0 top-6 h-0.5 bg-secondary-200" />

        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.icon];
          const styles = getStatusStyles(stage.status);
          const isLast = index === stages.length - 1;

          return (
            <div
              key={stage.id}
              className="relative flex flex-col items-center"
              style={{ flex: isLast ? '0 0 auto' : '1 1 0' }}
            >
              {/* Progress line overlay for completed stages */}
              {stage.status === 'completed' && !isLast && (
                <div
                  className="absolute left-1/2 top-6 h-0.5 w-full bg-success-500"
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}

              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300',
                  styles.container
                )}
              >
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : stage.status === 'current' ? (
                  <Icon className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>

              {/* Label and description */}
              <div className="mt-3 text-center">
                <p className={cn('text-sm font-medium', styles.label)}>{stage.label}</p>
                <p className={cn('mt-0.5 text-xs', styles.description)}>{stage.description}</p>
                {stage.date && (
                  <p className="mt-1 text-xs text-secondary-400">{stage.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Vertical Timeline Component
 */
function VerticalTimeline({ stages, className }: TransactionTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Connection line */}
      <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-secondary-200" />

      <div className="space-y-6">
        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.icon];
          const styles = getStatusStyles(stage.status);
          const isFirst = index === 0;

          return (
            <div key={stage.id} className="relative flex gap-4">
              {/* Progress line overlay for completed stages */}
              {stage.status === 'completed' && (
                <div
                  className="absolute left-6 w-0.5 bg-success-500"
                  style={{
                    top: isFirst ? '24px' : '0',
                    bottom: '0',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}

              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300',
                  styles.container
                )}
              >
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : stage.status === 'current' ? (
                  <Icon className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2 pt-2">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', styles.label)}>{stage.label}</p>
                  {stage.status === 'current' && (
                    <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                      <Clock className="h-3 w-3" />
                      In Progress
                    </span>
                  )}
                </div>
                <p className={cn('mt-0.5 text-sm', styles.description)}>{stage.description}</p>
                {stage.date && (
                  <p className="mt-1 text-xs text-secondary-400">{stage.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Transaction Timeline Component
 *
 * Shows the flow: Search -> Offer -> Acceptance -> Conditions -> Closing
 */
export function TransactionTimeline({
  stages,
  className,
  orientation = 'horizontal',
}: TransactionTimelineProps) {
  if (orientation === 'vertical') {
    return <VerticalTimeline stages={stages} className={className} />;
  }
  return <HorizontalTimeline stages={stages} className={className} />;
}
