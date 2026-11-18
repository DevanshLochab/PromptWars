import { describe, it, expect } from 'vitest';
import { HouseholdProfileSchema, ActionSchema } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';
import actionsData from '@/data/actions.json';

describe('Foundation Schemas and Data Validation', () => {
  it('validates demo profile against HouseholdProfileSchema', () => {
    const result = HouseholdProfileSchema.safeParse(demoSnapshot.profile);
    expect(result.success).toBe(true);
  });

  it('validates all 44 seed actions against ActionSchema', () => {
    expect(actionsData.length).toBe(44);
    for (const action of actionsData) {
      const result = ActionSchema.safeParse(action);
      if (!result.success) {
        console.error('Failed action validation:', action.id, result.error);
      }
      expect(result.success).toBe(true);
    }
  });
});
