import { Router } from 'express';
import { StatsQuerySchema, TimelineQuerySchema } from '@omniplan/shared';
import { validateQuery } from '../middleware/validate';
import { getStats, getTimeline } from '../services/stats-service';

const router = Router();

router.get('/stats', validateQuery(StatsQuerySchema), (req, res) => {
  try {
    const data = getStats(req.query.project_id as string | undefined, req.query.target_id as string | undefined);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.get('/timeline', validateQuery(TimelineQuerySchema), (req, res) => {
  try {
    const data = getTimeline(req.query.project_id as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
