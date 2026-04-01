import type { ReactNode } from 'react';

interface DataCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function DataCard({ children, className = '', index = 0 }: DataCardProps) {
  return (
    <div
      className={`bg-bg-secondary border border-border-subtle rounded-[12px] p-6 hover:border-border-active transition-colors duration-200 animate-fade-in-up ${className}`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
    >
      {children}
    </div>
  );
}
