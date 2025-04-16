-- Add columns to attendance table if they don't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to count attendance by date
CREATE OR REPLACE FUNCTION count_attendance_by_date() RETURNS TRIGGER AS $$
BEGIN
  -- This function will be used to maintain a count of attendance by date
  -- for more efficient queries
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the count
CREATE TRIGGER update_attendance_count
AFTER INSERT OR UPDATE OR DELETE ON attendance
FOR EACH ROW
EXECUTE FUNCTION count_attendance_by_date();

-- Create a view for attendance counts by date
CREATE OR REPLACE VIEW attendance_by_date AS
SELECT 
  date,
  status,
  COUNT(*) as count
FROM attendance
GROUP BY date, status;

-- Create a view for revenue by month and plan
CREATE OR REPLACE VIEW revenue_by_month_plan AS
SELECT 
  DATE_TRUNC('month', payment_date) as month,
  plan,
  SUM(amount) as revenue
FROM payments
GROUP BY month, plan
ORDER BY month DESC;

-- Create a view for active members by month
CREATE OR REPLACE VIEW active_members_by_month AS
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(DISTINCT member_id) as active_count
FROM attendance
WHERE status = 'Present'
GROUP BY month
ORDER BY month DESC;

