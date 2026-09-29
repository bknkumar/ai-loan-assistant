ALTER TABLE application_documents ADD COLUMN IF NOT EXISTS processing_code text;
ALTER TABLE application_documents ADD COLUMN IF NOT EXISTS extracted_text text;
ALTER TABLE application_documents ADD COLUMN IF NOT EXISTS extracted_fields jsonb;
ALTER TABLE application_documents ADD COLUMN IF NOT EXISTS processed_at timestamptz;