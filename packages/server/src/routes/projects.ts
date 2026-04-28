import { Router } from 'express';
import { CreateProjectSchema, UpdateProjectSchema, PatchBodySchema, IdParamSchema } from '@omniplan/shared';
import { validate, validateParams } from '../middleware/validate';
import { authRequired, authOptional } from '../middleware/auth';
import { listProjects, getProject, createProject, updateProject, deleteProject } from '../services/project-service';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/', authOptional, (req, res) => {
  const projects = listProjects();
  res.json({ success: true, data: projects });
});

router.post('/', authRequired, validate(CreateProjectSchema), (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const project = createProject(userId, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.get('/:id', validateParams(IdParamSchema), (req, res) => {
  try {
    const project = getProject(req.params.id);
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.patch('/:id', authRequired, validateParams(IdParamSchema), validate(PatchBodySchema), (req, res) => {
  try {
    const { changes, expected_version } = req.body;
    const project = updateProject(req.params.id, changes, expected_version);
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authRequired, validateParams(IdParamSchema), (req, res) => {
  try {
    deleteProject(req.params.id);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
