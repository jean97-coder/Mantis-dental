CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  patient_phone VARCHAR(40) NOT NULL,
  patient_name VARCHAR(150) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'bot', 'patient')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_timestamp_idx
  ON whatsapp_messages (patient_phone, timestamp DESC);