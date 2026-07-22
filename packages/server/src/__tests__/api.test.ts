/**
 * Integration tests for REST API endpoints.
 * Uses the real database (seed data included).
 * Tests run sequentially within each describe block.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

import '../db/migrate.js';

import authRoutes from '../routes/auth.ts';
import projectRoutes from '../routes/projects.ts';
import targetRoutes from '../routes/targets.ts';
import taskRoutes from '../routes/tasks.ts';
import milestoneRoutes from '../routes/milestones.ts';
import statsRoutes from '../routes/stats.ts';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', targetRoutes);
app.use('/api', taskRoutes);
app.use('/api', milestoneRoutes);
app.use('/api', statsRoutes);

let apiKey: string;
let projectId: string;
let targetId: string;

const testUser = `test_${Date.now()}`;

describe('Integration Tests', () => {
  // ── Auth ──

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUser, display_name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testUser);
    expect(res.body.data.api_key).toBeDefined();
    apiKey = res.body.data.api_key;
  });

  it('should reject duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUser, display_name: 'Dup' });

    expect(res.status).toBe(409);
  });

  it('should login existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser });

    expect(res.status).toBe(200);
    expect(res.body.data.api_key).toBeDefined();
  });

  it('should fail login for unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: `nonexistent_${Date.now()}` });

    expect(res.status).toBe(401);
  });

  it('should verify valid API key', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${apiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.username).toBe(testUser);
  });

  it('should reject invalid API key for verify', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalid_key');

    expect(res.status).toBe(401);
  });

  it('should reject verify without auth header', async () => {
    const res = await request(app).get('/api/auth/verify');

    expect(res.status).toBe(401);
  });

  // ── Projects ──

  it('should reject unauthenticated project creation', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Unauth' });

    expect(res.status).toBe(401);
  });

  it('should create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ name: 'Test Project', description: 'Test desc' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Project');
    projectId = res.body.data.id;
  });

  it('should list all projects', async () => {
    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get project detail', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(projectId);
  });

  it('should return 404 for unknown project', async () => {
    const res = await request(app).get('/api/projects/nonexistent');

    expect(res.status).toBe(404);
  });

  // ── Targets ──

  it('should create a target', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/targets`)
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ name: 'Test Target' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Target');
    targetId = res.body.data.id;
  });

  it('should list targets with stats', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/targets`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].completion_rate).toBeDefined();
  });

  // ── Tasks ──

  let taskId: string;

  it('should create a task', async () => {
    const res = await request(app)
      .post(`/api/targets/${targetId}/tasks`)
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ name: 'Test Task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Task');
    expect(res.body.data.priority).toBe('high');
    taskId = res.body.data.id;
  });

  it('should update a task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ changes: { status: 'done', progress: 100 } });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('done');
    expect(res.body.data.progress).toBe(100);
  });

  it('should get task with dependencies', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.dependencies).toBeDefined();
  });

  // ── Milestones ──

  it('should create a milestone', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/milestones`)
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ name: 'Test Milestone', due_date: '2026-06-01' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Milestone');
  });

  it('should list milestones', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/milestones`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
