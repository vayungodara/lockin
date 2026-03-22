-- Add 'monthly' to pacts recurrence_type constraint
ALTER TABLE pacts DROP CONSTRAINT IF EXISTS pacts_recurrence_type_check;
ALTER TABLE pacts ADD CONSTRAINT pacts_recurrence_type_check
  CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'weekdays', 'monthly'));
