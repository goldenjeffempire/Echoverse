import { and, isNull } from 'drizzle-orm';
export function withoutSoftDeleted(deletedAtColumn) {
    return isNull(deletedAtColumn);
}
export function activeOnly(deletedAtColumn, additionalConditions) {
    if (additionalConditions) {
        return and(isNull(deletedAtColumn), additionalConditions);
    }
    return isNull(deletedAtColumn);
}
export async function softDelete(updateFn) {
    await updateFn({ deletedAt: new Date() });
}
