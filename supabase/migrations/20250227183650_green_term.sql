/*
  # Create budgets table for financial planning

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `month` (text, YYYY-MM format)
      - `category` (text)
      - `amount` (decimal)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on `budgets` table
    - Add policies for authenticated users to manage their own budget data
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL, -- Format: 'YYYY-MM'
  category text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT valid_category CHECK (category IN ('feed', 'medicine', 'equipment', 'other')),
  CONSTRAINT valid_month_format CHECK (month ~ '^[0-9]{4}-[0-9]{2}$')
);

-- Create a unique constraint for user_id, month, and category
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_category_idx ON budgets (user_id, month, category);

-- Create indexes
CREATE INDEX IF NOT EXISTS budgets_month_idx ON budgets (month);
CREATE INDEX IF NOT EXISTS budgets_category_idx ON budgets (category);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);