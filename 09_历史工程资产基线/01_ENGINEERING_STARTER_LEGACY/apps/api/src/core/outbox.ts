export interface OutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  eventKey: string;
  payload: unknown;
  occurredAt: Date;
}
// Persist this in the SAME DB transaction as the business fact. Worker publishing is separate.
