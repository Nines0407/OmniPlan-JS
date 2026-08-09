#!/usr/bin/env node

/**
 * OmniPlan MCP Server
 *
 * Exposes OmniPlan Core API as MCP Tools for AI assistants (opencode, Claude Code, etc.).
 * The AI tool's LLM handles "natural language → Tool calling" reasoning.
 * This server does NOT implement any LLM logic.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const CORE_API_URL = process.env.OMNIPLAN_API_URL || 'http://localhost:3000';
const API_KEY = process.env.OMNIPLAN_API_KEY || '';

interface ApiResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function apiFetch(path: string, options?: RequestInit): Promise<ApiResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(`${CORE_API_URL}${path}`, { ...options, headers });
  const json = await res.json();
  return json as ApiResult;
}

function formatResult(result: ApiResult): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}

const server = new McpServer({
  name: 'omniplan-mcp',
  version: '0.1.0',
});

// ─── Projects ────────────────────────────────────────────────

server.tool('list_projects', '列出所有项目', {}, async () => {
  const result = await apiFetch('/api/projects');
  return formatResult(result);
});

server.tool(
  'get_project',
  '获取项目详情',
  { project_id: z.string().describe('项目 ID') },
  async ({ project_id }) => {
    const result = await apiFetch(`/api/projects/${project_id}`);
    return formatResult(result);
  },
);

server.tool(
  'create_project',
  '创建新项目',
  {
    name: z.string().describe('项目名称'),
    description: z.string().optional().describe('项目描述'),
    color: z.string().optional().describe('颜色 (hex)'),
  },
  async (args) => {
    const result = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return formatResult(result);
  },
);

server.tool(
  'update_project',
  '更新项目',
  {
    project_id: z.string().describe('项目 ID'),
    name: z.string().optional().describe('新名称'),
    description: z.string().optional().describe('新描述'),
    color: z.string().optional().describe('颜色'),
  },
  async ({ project_id, ...changes }) => {
    const result = await apiFetch(`/api/projects/${project_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ changes }),
    });
    return formatResult(result);
  },
);

server.tool(
  'delete_project',
  '归档项目',
  { project_id: z.string().describe('项目 ID') },
  async ({ project_id }) => {
    const result = await apiFetch(`/api/projects/${project_id}`, { method: 'DELETE' });
    return formatResult(result);
  },
);

// ─── Targets ─────────────────────────────────────────────────

server.tool(
  'list_targets',
  '列出项目下的所有目标及其完成率',
  { project_id: z.string().describe('项目 ID') },
  async ({ project_id }) => {
    const result = await apiFetch(`/api/projects/${project_id}/targets`);
    return formatResult(result);
  },
);

server.tool(
  'get_target',
  '获取目标详情及统计',
  { target_id: z.string().describe('目标 ID') },
  async ({ target_id }) => {
    const result = await apiFetch(`/api/targets/${target_id}`);
    return formatResult(result);
  },
);

server.tool(
  'create_target',
  '创建目标',
  {
    project_id: z.string().describe('所属项目 ID'),
    name: z.string().describe('目标名称'),
    description: z.string().optional().describe('目标描述'),
  },
  async ({ project_id, ...data }) => {
    const result = await apiFetch(`/api/projects/${project_id}/targets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return formatResult(result);
  },
);

server.tool(
  'update_target',
  '更新目标',
  {
    target_id: z.string().describe('目标 ID'),
    name: z.string().optional().describe('新名称'),
    description: z.string().optional().describe('新描述'),
  },
  async ({ target_id, ...changes }) => {
    const result = await apiFetch(`/api/targets/${target_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ changes }),
    });
    return formatResult(result);
  },
);

server.tool(
  'delete_target',
  '删除目标',
  { target_id: z.string().describe('目标 ID') },
  async ({ target_id }) => {
    const result = await apiFetch(`/api/targets/${target_id}`, { method: 'DELETE' });
    return formatResult(result);
  },
);

// ─── Tasks ───────────────────────────────────────────────────

server.tool(
  'list_tasks',
  '列出目标下的所有任务，可按状态和日期过滤',
  {
    target_id: z.string().describe('所属目标 ID'),
    status: z.string().optional().describe('按状态过滤: todo, in_progress, review, done, cancelled'),
    assignee_id: z.string().optional().describe('按负责人 ID 过滤'),
    start_date: z.string().optional().describe('按起始日期过滤 (YYYY-MM-DD)'),
  },
  async ({ target_id, ...filters }) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, v);
    }
    const query = params.toString();
    const result = await apiFetch(`/api/targets/${target_id}/tasks${query ? '?' + query : ''}`);
    return formatResult(result);
  },
);

server.tool(
  'get_task',
  '获取任务详情（含依赖关系）',
  { task_id: z.string().describe('任务 ID') },
  async ({ task_id }) => {
    const result = await apiFetch(`/api/tasks/${task_id}`);
    return formatResult(result);
  },
);

server.tool(
  'create_task',
  '创建任务',
  {
    target_id: z.string().describe('所属目标 ID'),
    name: z.string().describe('任务名称'),
    description: z.string().optional().describe('任务描述'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('优先级'),
    start_date: z.string().optional().describe('起始日期 (YYYY-MM-DD)'),
    duration_days: z.number().optional().describe('持续天数'),
    assignee_id: z.string().optional().describe('负责人 ID'),
  },
  async ({ target_id, ...data }) => {
    const result = await apiFetch(`/api/targets/${target_id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return formatResult(result);
  },
);

server.tool(
  'update_task',
  '更新任务 (可变更状态、进度、优先级等)',
  {
    task_id: z.string().describe('任务 ID'),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional().describe('新状态'),
    progress: z.number().min(0).max(100).optional().describe('进度百分比'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('新优先级'),
    name: z.string().optional().describe('新任务名称'),
    start_date: z.string().optional().describe('新起始日期'),
    assignee_id: z.string().optional().describe('新负责人 ID'),
    duration_days: z.number().optional().describe('新持续天数'),
    description: z.string().optional().describe('新描述'),
  },
  async ({ task_id, ...changes }) => {
    // Remove undefined fields
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) filtered[k] = v;
    }
    const result = await apiFetch(`/api/tasks/${task_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ changes: filtered }),
    });
    return formatResult(result);
  },
);

server.tool(
  'delete_task',
  '删除任务',
  { task_id: z.string().describe('任务 ID') },
  async ({ task_id }) => {
    const result = await apiFetch(`/api/tasks/${task_id}`, { method: 'DELETE' });
    return formatResult(result);
  },
);

server.tool(
  'add_dependency',
  '添加任务依赖关系',
  {
    task_id: z.string().describe('任务 ID'),
    dependency_id: z.string().describe('依赖的前置任务 ID'),
    dependency_type: z
      .enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])
      .optional()
      .describe('依赖类型，默认 finish_to_start'),
  },
  async ({ task_id, dependency_id, dependency_type }) => {
    const result = await apiFetch(`/api/tasks/${task_id}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ dependency_id, dependency_type: dependency_type || 'finish_to_start' }),
    });
    return formatResult(result);
  },
);

server.tool(
  'remove_dependency',
  '移除任务依赖',
  {
    task_id: z.string().describe('任务 ID'),
    dependency_id: z.string().describe('依赖的前置任务 ID'),
  },
  async ({ task_id, dependency_id }) => {
    const result = await apiFetch(`/api/tasks/${task_id}/dependencies/${dependency_id}`, {
      method: 'DELETE',
    });
    return formatResult(result);
  },
);

server.tool(
  'bulk_update_tasks',
  '批量更新任务状态/进度/日期',
  {
    task_ids: z.array(z.string()).describe('要更新的任务 ID 列表'),
    status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional().describe('新状态'),
    progress: z.number().min(0).max(100).optional().describe('进度百分比'),
    start_date: z.string().optional().describe('新起始日期'),
  },
  async ({ task_ids, ...changes }) => {
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) filtered[k] = v;
    }
    const result = await apiFetch('/api/bulk/tasks', {
      method: 'POST',
      body: JSON.stringify({ task_ids, changes: filtered }),
    });
    return formatResult(result);
  },
);

// ─── Milestones ──────────────────────────────────────────────

server.tool(
  'list_milestones',
  '列出项目的所有里程碑',
  { project_id: z.string().describe('项目 ID') },
  async ({ project_id }) => {
    const result = await apiFetch(`/api/projects/${project_id}/milestones`);
    return formatResult(result);
  },
);

server.tool(
  'create_milestone',
  '创建里程碑',
  {
    project_id: z.string().describe('项目 ID'),
    name: z.string().describe('里程碑名称'),
    due_date: z.string().describe('截止日期 (YYYY-MM-DD)'),
    description: z.string().optional().describe('描述'),
  },
  async ({ project_id, ...data }) => {
    const result = await apiFetch(`/api/projects/${project_id}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return formatResult(result);
  },
);

server.tool(
  'update_milestone',
  '更新里程碑',
  {
    milestone_id: z.string().describe('里程碑 ID'),
    name: z.string().optional().describe('新名称'),
    due_date: z.string().optional().describe('新截止日期'),
    status: z.enum(['pending', 'completed', 'cancelled']).optional().describe('新状态'),
  },
  async ({ milestone_id, ...changes }) => {
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (v !== undefined) filtered[k] = v;
    }
    const result = await apiFetch(`/api/milestones/${milestone_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ changes: filtered }),
    });
    return formatResult(result);
  },
);

server.tool(
  'delete_milestone',
  '删除里程碑',
  { milestone_id: z.string().describe('里程碑 ID') },
  async ({ milestone_id }) => {
    const result = await apiFetch(`/api/milestones/${milestone_id}`, { method: 'DELETE' });
    return formatResult(result);
  },
);

// ─── Stats & Timeline ────────────────────────────────────────

server.tool(
  'get_stats',
  '获取项目或目标的聚合统计数据',
  {
    project_id: z.string().optional().describe('项目 ID'),
    target_id: z.string().optional().describe('目标 ID'),
  },
  async ({ project_id, target_id }) => {
    const params = new URLSearchParams();
    if (project_id) params.set('project_id', project_id);
    if (target_id) params.set('target_id', target_id);
    const result = await apiFetch(`/api/stats?${params.toString()}`);
    return formatResult(result);
  },
);

server.tool(
  'get_timeline',
  '获取项目时间线数据，用于甘特图渲染',
  {
    project_id: z.string().describe('项目 ID'),
  },
  async ({ project_id }) => {
    const result = await apiFetch(`/api/timeline?project_id=${project_id}`);
    return formatResult(result);
  },
);

// ─── Auth ────────────────────────────────────────────────────

server.tool(
  'register_user',
  '注册新用户',
  {
    username: z.string().describe('用户名'),
    display_name: z.string().describe('显示名称'),
  },
  async (args) => {
    const result = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return formatResult(result);
  },
);

server.tool(
  'login',
  '登录获取 API Key',
  { username: z.string().describe('用户名') },
  async (args) => {
    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return formatResult(result);
  },
);


server.tool(
  "get_server_time",
  "获取服务器当前时间（吪时区）",
  {},
  async () => {
    const now = new Date();
    return formatResult({
      success: true,
      data: {
        iso: now.toISOString(),
        unix: Math.floor(now.getTime() / 1000),
        local: now.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
  },
);

// ─── Startup ─────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.warn('[OmniPlan MCP] server started via stdio');
}

main().catch(console.error);

export { server };
