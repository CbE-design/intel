import { Router } from 'express';
import { pool } from '../lib/db';

const router = Router();

function toSubject(row: any) {
  return {
    id: row.id,
    name: row.name,
    idNumber: row.id_number,
    address: row.address,
    phoneNumber: row.phone_number,
    avatarUrl: row.avatar_url,
    status: row.status,
    lastCheck: row.last_check,
  };
}

router.get('/subjects', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM subjects ORDER BY name ASC`
    );
    res.json(rows.map(toSubject));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/subjects/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM subjects WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(toSubject(rows[0]));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/subjects', async (req, res) => {
  const { name, idNumber, address, phoneNumber } = req.body;
  const avatarUrl = `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/100/100`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO subjects (name, id_number, address, phone_number, avatar_url, status)
       VALUES ($1,$2,$3,$4,$5,'Pending') RETURNING *`,
      [name, idNumber, address, phoneNumber, avatarUrl]
    );
    res.status(201).json(toSubject(rows[0]));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM subjects WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/subjects/:id/locations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM subject_locations WHERE subject_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows.map(r => ({ id: r.id, lat: r.lat, lng: r.lng, consent: r.consent, deviceId: r.device_id, timestamp: r.created_at })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/subjects/:id/locations', async (req, res) => {
  const { lat, lng, consent = true, deviceId = 'GSM-ACTIVE-01' } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO subject_locations (subject_id, lat, lng, consent, device_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, lat, lng, consent, deviceId]
    );
    const r = rows[0];
    res.status(201).json({ id: r.id, lat: r.lat, lng: r.lng, consent: r.consent, deviceId: r.device_id, timestamp: r.created_at });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/subjects/:id/background-checks', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM background_checks WHERE subject_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows.map(r => ({
      id: r.id,
      report: r.report,
      riskAssessment: r.risk_assessment,
      verificationScore: r.verification_score,
      initiatedBy: r.initiated_by,
      timestamp: r.created_at,
      parameters: {
        criminalRecordCheck: r.criminal_record_check,
        creditHistoryCheck: r.credit_history_check,
        employmentVerification: r.employment_verification,
      }
    })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/subjects/:id/background-checks', async (req, res) => {
  const { report, riskAssessment, verificationScore, initiatedBy = 'Veritas AI', parameters = {} } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO background_checks
        (subject_id, report, risk_assessment, verification_score, initiated_by,
         criminal_record_check, credit_history_check, employment_verification)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.params.id, report, riskAssessment, verificationScore, initiatedBy,
        parameters.criminalRecordCheck ?? true,
        parameters.creditHistoryCheck ?? false,
        parameters.employmentVerification ?? true,
      ]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id, report: r.report, riskAssessment: r.risk_assessment,
      verificationScore: r.verification_score, initiatedBy: r.initiated_by, timestamp: r.created_at,
      parameters: { criminalRecordCheck: r.criminal_record_check, creditHistoryCheck: r.credit_history_check, employmentVerification: r.employment_verification }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/subjects/:id/audit-log', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM audit_log WHERE subject_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json(rows.map(r => ({ id: r.id, action: r.action, analyst: r.analyst, status: r.status, timestamp: r.created_at })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/subjects/:id/audit-log', async (req, res) => {
  const { action, analyst = 'System Agent', status = 'Info' } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO audit_log (subject_id, action, analyst, status) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, action, analyst, status]
    );
    const r = rows[0];
    res.status(201).json({ id: r.id, action: r.action, analyst: r.analyst, status: r.status, timestamp: r.created_at });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/subjects/:id/case-notes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM case_notes WHERE subject_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows.map(r => ({ id: r.id, content: r.content, tag: r.tag, analyst: r.analyst, timestamp: r.created_at })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/subjects/:id/case-notes', async (req, res) => {
  const { content, tag = 'Observation', analyst = 'Analyst' } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO case_notes (subject_id, content, tag, analyst) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, content, tag, analyst]
    );
    const r = rows[0];
    res.status(201).json({ id: r.id, content: r.content, tag: r.tag, analyst: r.analyst, timestamp: r.created_at });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/subjects/:id/case-notes/:noteId', async (req, res) => {
  try {
    await pool.query(`DELETE FROM case_notes WHERE id=$1 AND subject_id=$2`, [req.params.noteId, req.params.id]);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
