'use client'

// src/components/transaction/ProgressTracker.tsx
// Persistent step-by-step progress tracker for buyer transaction journey.
// Horizontal on desktop (lg+), vertical on mobile.

import type { TransactionStep } from '@/lib/transactions/steps'

interface ProgressTrackerProps {
  steps: TransactionStep[]
  isCancelled?: boolean
}

// Checkmark SVG icon for completed steps
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8l3.5 3.5L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ProgressTracker({ steps, isCancelled = false }: ProgressTrackerProps) {
  // CANCELLED state: show distinct red banner instead of the normal stepper
  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="h-4 w-4 text-red-600"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-red-800">Transaction Cancelled</p>
          <p className="text-sm text-red-600">This transaction has been cancelled and is no longer active.</p>
        </div>
      </div>
    )
  }

  return (
    <nav aria-label="Transaction progress">
      {/* ── Desktop: horizontal stepper (lg+) ── */}
      <ol className="hidden lg:flex items-center w-full">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}
            >
              {/* Step indicator + label */}
              <div className="flex flex-col items-center gap-1 min-w-[4rem]">
                {/* Circle */}
                <div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium flex-shrink-0
                    ${step.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.status === 'current'
                        ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-white border-secondary-300 text-secondary-400'
                    }
                  `}
                >
                  {step.status === 'completed' ? (
                    <CheckIcon />
                  ) : step.status === 'current' ? (
                    <span className="sr-only">Current: </span>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  {/* Pulse animation ring for current step */}
                  {step.status === 'current' && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-30" />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`
                    text-xs text-center leading-tight max-w-[5rem]
                    ${step.status === 'completed'
                      ? 'text-green-700'
                      : step.status === 'current'
                        ? 'text-indigo-700 font-bold'
                        : 'text-secondary-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-1 mt-[-1.25rem]
                    ${step.status === 'completed' ? 'bg-green-400' : 'bg-secondary-200'}
                  `}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* ── Mobile: vertical stepper (< lg) ── */}
      <ol className="flex lg:hidden flex-col gap-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <li key={step.id} className="flex gap-3">
              {/* Left column: circle + connector line */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium flex-shrink-0
                    ${step.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.status === 'current'
                        ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-white border-secondary-300 text-secondary-400'
                    }
                  `}
                >
                  {step.status === 'completed' ? (
                    <CheckIcon />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  {step.status === 'current' && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-30" />
                  )}
                </div>
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className={`
                      w-0.5 flex-1 min-h-[1.5rem] mt-1
                      ${step.status === 'completed' ? 'bg-green-400' : 'bg-secondary-200'}
                    `}
                  />
                )}
              </div>

              {/* Right column: label + description */}
              <div className="pb-4">
                <p
                  className={`
                    text-sm leading-tight
                    ${step.status === 'completed'
                      ? 'text-green-700'
                      : step.status === 'current'
                        ? 'text-indigo-700 font-bold'
                        : 'text-secondary-400'
                    }
                  `}
                >
                  {step.label}
                </p>
                <p className="text-xs text-secondary-400 mt-0.5">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
