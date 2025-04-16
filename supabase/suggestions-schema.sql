-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  member_name TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'reviewed', 'actioned')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suggestion_insights table
CREATE TABLE IF NOT EXISTS suggestion_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  themes TEXT[] NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('equipment', 'class', 'membership', 'facility', 'staff', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  suggested_action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create draft_offers table
CREATE TABLE IF NOT EXISTS draft_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  member_name TEXT NOT NULL,
  current_plan TEXT NOT NULL,
  renewal_date DATE NOT NULL,
  offer_type TEXT NOT NULL,
  offer_description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES members(id),
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'scheduled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add negotiated price columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS standard_price INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS negotiated_price INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS negotiation_remarks TEXT;

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON suggestions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestion_insights_updated_at
BEFORE UPDATE ON suggestion_insights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_draft_offers_updated_at
BEFORE UPDATE ON draft_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add sample data for suggestions
INSERT INTO suggestions (member_id, member_name, content, date, status)
VALUES
  ((SELECT id FROM members LIMIT 1), 'John Doe', 'I would like to suggest adding more yoga classes in the evening.', '2023-05-15', 'new'),
  ((SELECT id FROM members LIMIT 1 OFFSET 1), 'Jane Smith', 'The locker rooms could use better ventilation.', '2023-06-02', 'reviewed'),
  ((SELECT id FROM members LIMIT 1 OFFSET 2), 'Michael Johnson', 'Could we get some new treadmills? The current ones are quite old.', '2023-06-10', 'actioned');

-- Add sample data for suggestion insights
INSERT INTO suggestion_insights (title, description, themes, action_type, priority, suggested_action)
VALUES
  ('Evening Class Demand', 'Multiple members have requested additional evening classes, particularly yoga and pilates.', ARRAY['yoga', 'evening classes', 'schedule'], 'class', 'medium', 'Consider adding 2-3 additional evening yoga classes between 6-8pm on weekdays.'),
  ('Equipment Upgrade Needed', 'Several members have complained about aging cardio equipment, particularly treadmills.', ARRAY['equipment', 'treadmills', 'maintenance'], 'equipment', 'high', 'Budget for replacement of at least 5 treadmills in the next quarter.'),
  ('Facility Improvement', 'Locker room ventilation and cleanliness has been mentioned by multiple members.', ARRAY['facility', 'maintenance', 'comfort'], 'facility', 'medium', 'Schedule HVAC inspection and consider upgrading ventilation system in locker rooms.');

-- Add sample data for draft offers
INSERT INTO draft_offers (member_id, member_name, current_plan, renewal_date, offer_type, offer_description, status)
VALUES
  ((SELECT id FROM members LIMIT 1), 'John Doe', 'Basic', '2023-07-15', 'Loyalty Upgrade', '50% off first month of Pro plan for loyal members', 'draft'),
  ((SELECT id FROM members LIMIT 1 OFFSET 1), 'Jane Smith', 'Pro', '2023-08-20', 'Premium Trial', 'Try Premium features for 2 weeks with your renewal', 'draft'),
  ((SELECT id FROM members LIMIT 1 OFFSET 2), 'Michael Johnson', 'Premium', '2023-09-10', 'Renewal Discount', '10% off your next renewal as a thank you for your loyalty', 'draft');

