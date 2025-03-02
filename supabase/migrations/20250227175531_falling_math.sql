/*
  # Finance Module Schema

  1. New Tables
    - `expenses` table for tracking farm expenses
      - `id` (uuid, primary key)
      - `date` (date, when the expense occurred)
      - `category` (text, expense category)
      - `description` (text, expense details)
      - `amount` (decimal, expense amount)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
    
    - `income` table for tracking farm income
      - `id` (uuid, primary key)
      - `date` (date, when the income occurred)
      - `source` (text, income source)
      - `description` (text, income details)
      - `amount` (decimal, income amount)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT valid_category CHECK (category IN ('feed', 'medicine', 'equipment', 'other'))
);

-- Create income table if it doesn't exist
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  source text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT valid_source CHECK (source IN ('milk', 'animal_sale', 'subsidy', 'other'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses (category);
CREATE INDEX IF NOT EXISTS income_date_idx ON income (date);
CREATE INDEX IF NOT EXISTS income_source_idx ON income (source);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for income
CREATE POLICY "Users can view their own income"
  ON income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income"
  ON income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income"
  ON income FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income"
  ON income FOR DELETE
  USING (auth.uid() = user_id);