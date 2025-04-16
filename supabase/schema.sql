-- Create members table (if not exists)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  membership_plan TEXT NOT NULL CHECK (membership_plan IN ('Basic', 'Pro', 'Premium', 'One-Day Pass')),
  join_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  amount NUMERIC NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('Basic', 'Pro', 'Premium', 'One-Day Pass')),
  payment_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  payment_id TEXT,
  order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  message TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('New', 'Read', 'Resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_members_name ON members (name);
CREATE INDEX IF NOT EXISTS idx_members_registration_number ON members (registration_number);
CREATE INDEX IF NOT EXISTS idx_members_membership_plan ON members (membership_plan);
CREATE INDEX IF NOT EXISTS idx_members_expiration_date ON members (expiration_date);
CREATE INDEX IF NOT EXISTS idx_members_status ON members (status);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments (member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance (member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_suggestions_member_id ON suggestions (member_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions (status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

