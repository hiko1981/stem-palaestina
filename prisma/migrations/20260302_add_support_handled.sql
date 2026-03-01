ALTER TABLE support_messages
  ADD COLUMN handled_by INT,
  ADD COLUMN handled_at TIMESTAMPTZ;
