CREATE TABLE IF NOT EXISTS application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size integer NOT NULL,
  storage_key text NOT NULL,
  status text NOT NULL DEFAULT 'UPLOADED',
  created_at timestamptz NOT NULL DEFAULT now()
)