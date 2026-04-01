import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  fallback?: LucideIcon;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconsMap = LucideIcons as any;

export function DynamicIcon({ name, size = 16, color, className, fallback }: DynamicIconProps) {
  const Icon = iconsMap[name] || fallback || LucideIcons.Circle;
  return <Icon size={size} color={color} className={className} />;
}
