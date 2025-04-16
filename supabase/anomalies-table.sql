-- Create anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  type TEXT NOT NULL CHECK (type IN ('duplicate_scan', 'unusual_hours', 'expired_membership')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_anomalies_member_id ON anomalies (member_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies (type);
CREATE INDEX IF NOT EXISTS idx_anomalies_resolved ON anomalies (resolved);

-- Add anomaly column to attendance table if it doesn't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS anomaly TEXT;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_anomalies_updated_at
BEFORE UPDATE ON anomalies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();