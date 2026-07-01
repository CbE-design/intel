import { Router } from 'express';
import { pool } from '../lib/db';

const router = Router();

router.get('/research-reports', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM research_reports ORDER BY created_at DESC LIMIT 20`
    );
    res.json(rows.map(r => ({
      id: r.id, topic: r.topic, content: r.content,
      assessment: r.assessment, trendData: r.trend_data,
      analyst: r.analyst, timestamp: r.created_at,
    })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/research-reports', async (req, res) => {
  const { topic, content, assessment, trendData, analyst = 'Veritas AI' } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO research_reports (topic, content, assessment, trend_data, analyst)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [topic, content, assessment ?? null, trendData ? JSON.stringify(trendData) : null, analyst]
    );
    const r = rows[0];
    res.status(201).json({ id: r.id, topic: r.topic, content: r.content, assessment: r.assessment, trendData: r.trend_data, analyst: r.analyst, timestamp: r.created_at });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/research-reports/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM research_reports WHERE id=$1`, [req.params.id]);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
