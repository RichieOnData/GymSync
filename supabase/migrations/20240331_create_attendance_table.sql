-- Drop existing table if it exists
DROP TABLE IF EXISTS attendance CASCADE;

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_time TIMESTAMP WITH TIME ZONE,
  checkout_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'pending')) DEFAULT 'pending',
  shift_type TEXT CHECK (shift_type IN ('morning', 'evening', 'flexible')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 