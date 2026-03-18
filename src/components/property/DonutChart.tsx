'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface DonutChartSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutChartSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Donut Chart Component
 *
 * A clean, animated donut chart for visualizing cost breakdowns.
 * Uses SVG for crisp rendering at any size.
 */
export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 24,
  className,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate total and percentages
  const total = useMemo(() => segments.reduce((sum, seg) => sum + seg.value, 0), [segments]);

  // Calculate stroke-dasharray and stroke-dashoffset for each segment
  const segmentData = useMemo(() => {
    let cumulativePercent = 0;

    return segments.map((segment) => {
      const percent = total > 0 ? segment.value / total : 0;
      const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
      const strokeDashoffset = -circumference * cumulativePercent;

      cumulativePercent += percent;

      return {
        ...segment,
        percent,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [segments, total, circumference]);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary-100"
        />

        {/* Segments */}
        {segmentData.map((segment, index) => (
          <circle
            key={segment.id}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          />
        ))}
      </svg>

      {/* Center content */}
      {(centerLabel ?? centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="font-display text-2xl font-bold text-secondary-900">
              {centerValue}
            </span>
          )}
          {centerLabel && <span className="text-sm text-secondary-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Donut Chart Legend
 */
export interface DonutChartLegendProps {
  segments: DonutChartSegment[];
  total: number;
  formatValue?: (value: number) => string;
  className?: string;
}

export function DonutChartLegend({
  segments,
  total,
  formatValue = (v) => v.toLocaleString(),
  className,
}: DonutChartLegendProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {segments.map((segment) => {
        const percent = total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0';
        return (
          <div key={segment.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-secondary-600">{segment.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-900">
                {formatValue(segment.value)}
              </span>
              <span className="text-xs text-secondary-400">({percent}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
