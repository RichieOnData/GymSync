-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    address TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    membership_plan TEXT NOT NULL CHECK (membership_plan IN ('Basic', 'Pro', 'Premium', 'One-Day Pass')),
    join_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_members_name ON members (name);
CREATE INDEX IF NOT EXISTS idx_members_registration_number ON members (registration_number);
CREATE INDEX IF NOT EXISTS idx_members_membership_plan ON members (membership_plan);
CREATE INDEX IF NOT EXISTS idx_members_expiration_date ON members (expiration_date);

-- Add sample data with expiration dates
INSERT INTO members (name, age, address, registration_number, membership_plan, join_date, expiration_date)
VALUES
    ('John Doe', 28, '123 Main St, Anytown, USA', 'GYM-2023-001', 'Basic', '2023-01-15', '2023-03-15'),
    ('Jane Smith', 34, '456 Oak Ave, Somewhere, USA', 'GYM-2023-002', 'Pro', '2023-02-20', '2023-08-20'),
    ('Michael Johnson', 42, '789 Pine Rd, Nowhere, USA', 'GYM-2023-003', 'Premium', '2023-03-10', '2024-03-10'),
    ('Sarah Williams', 25, '321 Elm St, Anywhere, USA', 'GYM-2023-004', 'Basic', '2023-04-05', '2023-06-05'),
    ('Robert Brown', 31, '654 Maple Dr, Everywhere, USA', 'GYM-2023-005', 'Pro', '2023-05-12', '2023-11-12'),
    ('Emily Davis', 29, '987 Cedar Ln, Somewhere, USA', 'GYM-2023-006', 'One-Day Pass', '2023-06-01', '2023-06-02');

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