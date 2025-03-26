
-- Add pdf_url column to credit_notes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'credit_notes' 
    AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE credit_notes ADD COLUMN pdf_url TEXT;
  END IF;
END $$;
