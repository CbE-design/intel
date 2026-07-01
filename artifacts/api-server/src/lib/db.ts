import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      name TEXT NOT NULL,
      id_number TEXT NOT NULL,
      address TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Clear','Review','Pending')),
      last_check TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subject_locations (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      consent BOOLEAN DEFAULT TRUE,
      device_id TEXT DEFAULT 'UNKNOWN',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS background_checks (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      report TEXT NOT NULL,
      risk_assessment TEXT NOT NULL,
      verification_score INTEGER NOT NULL DEFAULT 0,
      initiated_by TEXT DEFAULT 'Veritas AI',
      criminal_record_check BOOLEAN DEFAULT TRUE,
      credit_history_check BOOLEAN DEFAULT FALSE,
      employment_verification BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      analyst TEXT NOT NULL DEFAULT 'System Agent',
      status TEXT NOT NULL DEFAULT 'Info' CHECK (status IN ('Success','Warning','Info')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS case_notes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT 'Observation' CHECK (tag IN ('Evidence','Observation','Action','Alert')),
      analyst TEXT NOT NULL DEFAULT 'Analyst',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS research_reports (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      assessment TEXT,
      trend_data JSONB,
      analyst TEXT NOT NULL DEFAULT 'Veritas AI',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
