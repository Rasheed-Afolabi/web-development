import { Circle } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { DynamicIcon } from './DynamicIcon';

interface CategoryBadgeProps {
  categoryId: string;
}

export function CategoryBadge({ categoryId }: CategoryBadgeProps) {
  const customCategories = useCategoryStore((s) => s.customCategories);
  const category = EXPENSE_CATEGORIES[categoryId] || customCategories[categoryId];

  if (!category) {
    return <span className="text-text-muted text-xs">{categoryId}</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center"
        style={{ backgroundColor: category.color + '20' }}
      >
        <DynamicIcon name={category.icon} size={12} color={category.color} fallback={Circle} />
      </div>
      <span className="text-text-secondary text-xs font-body">{category.label}</span>
    </div>
  );
}
