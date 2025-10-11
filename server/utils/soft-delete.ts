import { SQL, and, isNull } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export function withoutSoftDeleted<T extends PgColumn>(deletedAtColumn: T): SQL {
  return isNull(deletedAtColumn);
}

export function activeOnly<T extends PgColumn>(deletedAtColumn: T, additionalConditions?: SQL): SQL {
  if (additionalConditions) {
    return and(isNull(deletedAtColumn), additionalConditions)!;
  }
  return isNull(deletedAtColumn);
}

export async function softDelete<T extends { deletedAt: PgColumn }>(
  updateFn: (data: { deletedAt: Date }) => Promise<any>
): Promise<void> {
  await updateFn({ deletedAt: new Date() });
}
