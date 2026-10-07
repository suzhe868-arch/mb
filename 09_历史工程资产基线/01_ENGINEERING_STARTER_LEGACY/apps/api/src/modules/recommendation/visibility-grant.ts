import type { Queryable } from "../../core/db-types.js";

export async function ensureRecommendationVisibilityGrant(db: Queryable, recommendationId: string) {
  const { rows } = await db.query({
    text: `SELECT r.recommendation_id,r.customer_id,r.vehicle_id,r.listing_cycle_id,v.platform_visibility
           FROM recommendations r
           JOIN vehicles v ON v.vehicle_id=r.vehicle_id
           WHERE r.recommendation_id=$1 AND r.status='active'`,
    values: [recommendationId],
  });
  const row = rows[0];
  if (!row) return { created: false, reason: "RECOMMENDATION_NOT_ACTIVE" } as const;
  if (row.platform_visibility !== "hidden") return { created: false, reason: "VEHICLE_PUBLIC" } as const;

  await db.query({
    text: `INSERT INTO vehicle_visibility_grants
             (vehicle_id,customer_id,listing_cycle_id,source_recommendation_id,grant_reason,created_at)
           VALUES ($1,$2,$3,$4,'recommendation',now())
           ON CONFLICT (source_recommendation_id) DO NOTHING`,
    values: [row.vehicle_id,row.customer_id,row.listing_cycle_id,row.recommendation_id],
  });
  return { created: true, reason: "HIDDEN_RECOMMENDATION_GRANT" } as const;
}

export async function endRecommendationVisibilityGrant(db: Queryable, recommendationId: string, reason = "recommendation_ended") {
  await db.query({
    text: `UPDATE vehicle_visibility_grants
           SET ended_at=COALESCE(ended_at,now()), end_reason=COALESCE(end_reason,$2)
           WHERE source_recommendation_id=$1 AND ended_at IS NULL`,
    values: [recommendationId, reason],
  });
}
