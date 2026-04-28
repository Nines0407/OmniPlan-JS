import { Router } from 'express';
import { CreateMilestoneSchema, UpdateMilestoneSchema, PatchBodySchema, IdParamSchema, ProjectIdParamSchema } from '@omniplan/shared';
import { validate, validateParams } from '../middleware/validate';
import { authRequired } from '../middleware/auth';
import { listMilestones, getMilestone, createMilestone, updateMilestone, deleteMilestone } from '../services/milestone-service';

const router = Router();

router.get('/projects/:pid/milestones', validateParams(ProjectIdParamSchema), (req, res) => {
  try {
    const milestones = listMilestones(req.params.pid);
    res.json({ success: true, data: milestones });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:pid/milestones', authRequired, validateParams(ProjectIdParamSchema), validate(CreateMilestoneSchema), (req, res) => {
  try {
    const milestone = createMilestone(req.params.pid, req.body);
    res.status(201).json({ success: true, data: milestone });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.get('/milestones/:id', validateParams(IdParamSchema), (req, res) => {
  try {
    const milestone = getMilestone(req.params.id);
    res.json({ success: true, data: milestone });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.patch('/milestones/:id', authRequired, validateParams(IdParamSchema), validate(PatchBodySchema), (req, res) => {
  try {
    const { changes, expected_version } = req.body;
    const milestone = updateMilestone(req.params.id, changes, expected_version);
    res.json({ success: true, data: milestone });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.delete('/milestones/:id', authRequired, validateParams(IdParamSchema), (req, res) => {
  try {
    deleteMilestone(req.params.id);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
