CREATE TABLE admin_audit_log (
  id          SERIAL PRIMARY KEY,
  admin_id    INT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   INT NOT NULL,
  meta        TEXT,
  reversed    BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_at TIMESTAMPTZ,
  reversed_by INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin_id ON admin_audit_log(admin_id);
