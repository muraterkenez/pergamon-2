/*
  # Create missing tables and triggers for initial data

  1. New Tables
    - `profiles` - User profile information
    - `farms` - Farm details
    - `notification_settings` - User notification preferences
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
  3. Triggers
    - Create triggers to automatically create default records for new users
*/

-- Profile table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Farm information table
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  address text,
  size decimal(10,2),
  type text CHECK (type IN ('dairy', 'meat', 'mixed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  health_alerts boolean DEFAULT true,
  financial_reports boolean DEFAULT true,
  milk_production_alerts boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS farms_user_id_idx ON farms (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings (user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies: Farms
CREATE POLICY "Users can view their own farms"
  ON farms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farms"
  ON farms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms"
  ON farms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms"
  ON farms FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies: Notification Settings
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings"
  ON notification_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  -- Create default farm record
  INSERT INTO public.farms (user_id, type)
  VALUES (NEW.id, 'dairy');
  
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create profile, farm, and notification settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create default records for existing users
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT id FROM auth.users WHERE id NOT IN (SELECT id FROM profiles)
  LOOP
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id)
    VALUES (user_rec.id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Create farm if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM farms WHERE user_id = user_rec.id) THEN
      INSERT INTO farms (user_id, type)
      VALUES (user_rec.id, 'dairy');
    END IF;
    
    -- Create notification settings if they don't exist
    IF NOT EXISTS (SELECT 1 FROM notification_settings WHERE user_id = user_rec.id) THEN
      INSERT INTO notification_settings (user_id)
      VALUES (user_rec.id);
    END IF;
  END LOOP;
END;
$$;