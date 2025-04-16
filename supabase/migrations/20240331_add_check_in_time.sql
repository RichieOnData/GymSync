-- Add check_in_time column to attendance table
ALTER TABLE attendance ADD COLUMN check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update any existing rows to have the current timestamp
UPDATE attendance SET check_in_time = CURRENT_TIMESTAMP WHERE check_in_time IS NULL; 