import { Router } from 'express';
import {
  CreateTaskSchema, UpdateTaskSchema, CreateDependencySchema,
  BulkUpdateSchema, TaskQuerySchema, PatchBodySchema,
  IdParamSchema, TargetIdParamSchema,
} from '@omniplan/shared';
import { validate, validateParams, validateQuery } from '../middleware/validate';
import { authRequired } from '../middleware/auth';
import { listTasks, getTask, getTaskDependencies, createTask, updateTask, deleteTask, addDependency, removeDependency, bulkUpdateTasks } from '../services/task-service';

const router = Router();

router.get('/targets/:tid/tasks', validateParams(TargetIdParamSchema), validateQuery(TaskQuerySchema), (req, res) => {
  try {
    const tasks = listTasks(req.params.tid, req.query);
    res.json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.post('/targets/:tid/tasks', authRequired, validateParams(TargetIdParamSchema), validate(CreateTaskSchema), (req, res) => {
  try {
    const task = createTask(req.params.tid, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.get('/tasks/:id', validateParams(IdParamSchema), (req, res) => {
  try {
    const task = getTask(req.params.id);
    const dependencies = getTaskDependencies(req.params.id);
    res.json({ success: true, data: { ...task, dependencies } });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.patch('/tasks/:id', authRequired, validateParams(IdParamSchema), validate(PatchBodySchema), (req, res) => {
  try {
    const { changes, expected_version } = req.body;
    const task = updateTask(req.params.id, changes, expected_version);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.delete('/tasks/:id', authRequired, validateParams(IdParamSchema), (req, res) => {
  try {
    deleteTask(req.params.id);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.post('/tasks/:id/dependencies', authRequired, validateParams(IdParamSchema), validate(CreateDependencySchema), (req, res) => {
  try {
    const dep = addDependency(req.params.id, req.body.dependency_id, req.body.dependency_type);
    res.status(201).json({ success: true, data: dep });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.delete('/tasks/:id/dependencies/:depId', authRequired, (req, res) => {
  try {
    removeDependency(req.params.id, req.params.depId);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

router.post('/bulk/tasks', authRequired, validate(BulkUpdateSchema), (req, res) => {
  try {
    const tasks = bulkUpdateTasks(req.body.task_ids, req.body.changes);
    res.json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

export default router;
