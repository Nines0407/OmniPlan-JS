import { Router } from 'express';
import { CreateTargetSchema, UpdateTargetSchema, PatchBodySchema, IdParamSchema, ProjectIdParamSchema } from '@omniplan/shared';
import { validate, validateParams } from '../middleware/validate';
import { authRequired } from '../middleware/auth';
import { listTargets, getTarget, createTarget, updateTarget, deleteTarget, getTargetStats } from '../services/target-service';

const router = Router();

router.get('/projects/:pid/targets', validateParams(ProjectIdParamSchema), (req, res) => {
  try {
    const targets = listTargets(req.params.pid!);
    res.json({ success: true, data: targets });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:pid/targets', authRequired, validateParams(ProjectIdParamSchema), validate(CreateTargetSchema), (req, res) => {
  try {
    const target = createTarget(req.params.pid!, req.body);
    res.status(201).json({ success: true, data: target });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.get('/targets/:id', validateParams(IdParamSchema), (req, res) => {
  try {
    const target = getTargetStats(req.params.id!);
    res.json({ success: true, data: target });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.patch('/targets/:id', authRequired, validateParams(IdParamSchema), validate(PatchBodySchema), (req, res) => {
  try {
    const { changes, expected_version } = req.body;
    const target = updateTarget(req.params.id!, changes, expected_version);
    res.json({ success: true, data: target });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.delete('/targets/:id', authRequired, validateParams(IdParamSchema), (req, res) => {
  try {
    deleteTarget(req.params.id!);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
