-- First drop existing table if needed (only if you're recreating)
DROP TABLE IF EXISTS attendance;

-- Create attendance table with correct column names
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance (member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);

-- Add sample data that matches the table structure
INSERT INTO attendance (member_id, date, status)
SELECT
  m.id,
  CURRENT_DATE - (floor(random() * 14)::int * interval '1 day'),
  CASE WHEN random() > 0.2 THEN 'Present' ELSE 'Absent' END
FROM
  members m,
  generate_series(1, 5)  -- Each member gets 5 attendance records
WHERE
  m.id IN (SELECT id FROM members LIMIT 6);

-- Create the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();