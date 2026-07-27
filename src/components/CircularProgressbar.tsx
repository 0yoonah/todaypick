import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressbarProps {
  value: number; // 0-100 사이의 값
  max?: number; // 최대값 (기본값: 100)
  size?: number; // 원의 크기 (기본값: 80)
  strokeWidth?: number; // 선 두께 (기본값: 6)
  className?: string;
  children?: React.ReactNode;
  showValue?: boolean; // 중앙에 값 표시 여부
  color?: string; // 프로그래스 색상
  backgroundColor?: string; // 배경 색상
}

export default function CircularProgressbar({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  className,
  children,
  showValue = true,
  color = "#3b82f6", // 기본 파란색
  backgroundColor = "#e5e7eb", // 기본 회색
}: CircularProgressbarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), max);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / max) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 프로그래스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>

      {/* 중앙 콘텐츠 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ||
          (showValue && (
            <div className="text-center">
              <div className="text-sm font-bold">{Math.round(progress)}</div>
              <div className="text-xs text-muted-foreground">%</div>
            </div>
          ))}
      </div>
    </div>
  );
}

// 다중 프로그래스바 (3분할)
interface SegmentedProgressRingProps {
  values: number[]; // [피드, 퀴즈, 명언] 순서
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  colors?: string[]; // 각 섹션의 색상
  labels?: string[]; // 각 섹션의 라벨
}

export function SegmentedProgressRing({
  values,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  colors = ["#3b82f6", "#10b981", "#8b5cf6"], // 직접 색상 지정
  labels = ["피드", "퀴즈", "명언"],
}: SegmentedProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalValue = values.reduce((sum, val) => sum + val, 0);

  const segments = values.reduce<
    Array<{
      value: number;
      strokeDasharray: number;
      strokeDashoffset: number;
      color: string;
      label: string;
    }>
  >((acc, value, index) => {
    const progress = Math.min(Math.max(value, 0), max);
    const previousOffset =
      acc.length === 0
        ? 0
        : acc[acc.length - 1].strokeDashoffset +
          (circumference -
            (acc[acc.length - 1].value / max) * circumference);

    return [
      ...acc,
      {
        value: progress,
        strokeDasharray: circumference,
        strokeDashoffset: previousOffset,
        color: colors[index] || "#6b7280",
        label: labels[index] || `항목 ${index + 1}`,
      },
    ];
  }, []);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 각 섹션 */}
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        ))}
      </svg>

      {/* 중앙 콘텐츠 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{Math.round(totalValue)}</div>
          <div className="text-xs text-muted-foreground">/ {max}</div>
        </div>
      </div>
    </div>
  );
}

// 범례 컴포넌트
interface LegendProps {
  items: Array<{
    color: string;
    label: string;
    value?: number;
  }>;
  className?: string;
}

export function Legend({ items, className }: LegendProps) {
  return (
    <div
      className={cn("flex items-center justify-center space-x-6", className)}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center space-x-1 text-xs text-muted-foreground"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
          {item.value !== undefined && (
            <span className="font-medium">({item.value})</span>
          )}
        </div>
      ))}
    </div>
  );
}
