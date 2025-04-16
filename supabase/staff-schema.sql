-- Drop existing tables if they exist
DROP TABLE IF EXISTS staff_attendance CASCADE;
DROP TABLE IF EXISTS staff_shifts CASCADE;
DROP TABLE IF EXISTS staff_tasks CASCADE;
DROP TABLE IF EXISTS equipment_maintenance CASCADE;
DROP TABLE IF EXISTS daily_qr_codes CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT CHECK (status IN ('active', 'on_leave')) DEFAULT 'active',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  qualifications TEXT[],
  shift_type TEXT CHECK (shift_type IN ('morning', 'evening', 'flexible')) DEFAULT 'flexible',
  seniority_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily QR codes table
CREATE TABLE IF NOT EXISTS daily_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  qr_code_id TEXT NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  qr_code_id TEXT REFERENCES daily_qr_codes(qr_code_id),
  checkin_time TIMESTAMP WITH TIME ZONE,
  checkout_time TIMESTAMP WITH TIME ZONE,
  expected_checkin_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('present', 'late', 'absent', 'pending')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('morning', 'evening', 'flexible')),
  status TEXT CHECK (status IN ('scheduled', 'completed', 'missed', 'conflict')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS staff_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')) DEFAULT 'todo',
  completion_time TIMESTAMP WITH TIME ZONE,
  verification_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment maintenance table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  last_maintained_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_due TIMESTAMP WITH TIME ZONE,
  maintained_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample staff data
INSERT INTO staff (name, role, email, phone, status, shift_type, seniority_level, qualifications, hire_date)
VALUES
  ('John Smith', 'Trainer', 'john.smith@gymsync.com', '+1 (555) 123-4567', 'active', 'morning', 3, ARRAY['Certified Trainer', 'Nutrition Specialist'], '2022-03-15'),
  ('Priya Sharma', 'Nutritionist', 'priya.sharma@gymsync.com', '+1 (555) 234-5678', 'active', 'flexible', 2, ARRAY['Nutrition Degree', 'Wellness Coach'], '2021-11-08'),
  ('Rahul Patel', 'Front Desk', 'rahul.patel@gymsync.com', '+1 (555) 345-6789', 'active', 'evening', 1, ARRAY['Customer Service'], '2023-01-20'),
  ('Ananya Gupta', 'Yoga Instructor', 'ananya.gupta@gymsync.com', '+1 (555) 456-7890', 'on_leave', 'morning', 2, ARRAY['Yoga Certification', 'Meditation Coach'], '2022-07-12'),
  ('Vikram Singh', 'Manager', 'vikram.singh@gymsync.com', '+1 (555) 567-8901', 'active', 'flexible', 5, ARRAY['Business Management', 'Staff Training'], '2021-05-03');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_qr_codes_staff_id ON daily_qr_codes(staff_id);
CREATE INDEX IF NOT EXISTS idx_daily_qr_codes_date ON daily_qr_codes(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_status ON staff_attendance(status);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON staff_shifts(date);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned_to ON staff_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON staff_tasks(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_attendance_updated_at
BEFORE UPDATE ON staff_attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_shifts_updated_at
BEFORE UPDATE ON staff_shifts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_tasks_updated_at
BEFORE UPDATE ON staff_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_maintenance_updated_at
BEFORE UPDATE ON equipment_maintenance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to generate daily QR codes for all active staff
CREATE OR REPLACE FUNCTION generate_daily_qr_codes()
RETURNS void AS $$
DECLARE
  staff_record RECORD;
  today DATE := CURRENT_DATE;
BEGIN
  -- Delete any existing QR codes for today that haven't been used
  DELETE FROM daily_qr_codes
  WHERE date = today AND is_used = FALSE;
  
  -- Generate new QR codes for all active staff
  FOR staff_record IN SELECT id FROM staff WHERE status = 'active' LOOP
    -- Check if QR code already exists for this staff and date
    IF NOT EXISTS (SELECT 1 FROM daily_qr_codes WHERE staff_id = staff_record.id AND date = today) THEN
      -- Insert new QR code
      INSERT INTO daily_qr_codes (staff_id, date, qr_code_id)
      VALUES (staff_record.id, today, 'QR_' || staff_record.id || '_' || today || '_' || md5(random()::text));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to mark staff as absent if they haven't checked in
CREATE OR REPLACE FUNCTION mark_absent_staff()
RETURNS void AS $$
DECLARE
  shift_record RECORD;
  today DATE := CURRENT_DATE;
  now_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Find all scheduled shifts for today where staff hasn't checked in
  -- and the shift start time was more than 30 minutes ago
  FOR shift_record IN 
    SELECT s.id, s.staff_id, s.start_time
    FROM staff_shifts s
    WHERE s.date = today
    AND s.status = 'scheduled'
    AND s.start_time < (now_time - INTERVAL '30 minutes')
    AND NOT EXISTS (
      SELECT 1 FROM staff_attendance a
      WHERE a.staff_id = s.staff_id
      AND a.date = today
      AND a.checkin_time IS NOT NULL
    )
  LOOP
    -- Mark staff as absent
    INSERT INTO staff_attendance (staff_id, date, status, expected_checkin_time, notes)
    VALUES (
      shift_record.staff_id,
      today,
      'absent',
      shift_record.start_time,
      'Automatically marked as absent after 30 minutes'
    )
    ON CONFLICT (staff_id, date)
    DO UPDATE SET
      status = 'absent',
      expected_checkin_time = shift_record.start_time,
      notes = 'Automatically marked as absent after 30 minutes',
      updated_at = NOW();
      
    -- Update shift status
    UPDATE staff_shifts
    SET status = 'missed'
    WHERE id = shift_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

