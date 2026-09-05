import { CategoryChip } from '@/ui';
import type { CategoryGroup } from '@/ui/tokens';

/* ── Category Metadata ────────────────────────────────── */

const CATEGORY_NAMES: Record<string, { readonly name: string; readonly group: CategoryGroup }> = {
  groceries: { name: 'Boodschappen', group: 'huishoudelijk' },
  dining: { name: 'Horeca', group: 'vrij_besteedbaar' },
  salary: { name: 'Salaris', group: 'inkomen' },
  transport: { name: 'Vervoer', group: 'vrij_besteedbaar' },
  health_insurance: { name: 'Zorg', group: 'vaste_lasten' },
  rent_mortgage: { name: 'Wonen', group: 'vaste_lasten' },
  energy_water: { name: 'Energie', group: 'vaste_lasten' },
  internet_tv: { name: 'Internet', group: 'vaste_lasten' },
  streaming: { name: 'Abonnementen', group: 'vaste_lasten' },
  unassigned: { name: 'Onbekend', group: 'vrij_besteedbaar' },
};

/* ── Component ────────────────────────────────────────── */

export function CategoryBadge({ categoryKey }: { readonly categoryKey: string }) {
  const meta = CATEGORY_NAMES[categoryKey] ?? { name: categoryKey, group: 'vrij_besteedbaar' };

  return (
    <CategoryChip
      name={meta.name}
      group={meta.group}
      icon={null}
      testID={`category-chip-${categoryKey}`}
    />
  );
}
