import type { Task } from './task.js';
import type { TargetStats } from './target.js';
import type { Milestone } from './milestone.js';
import type { Project } from './project.js';

export type WsEvent =
  | { type: 'task.updated'; entity: Task }
  | { type: 'task.created'; entity: Task }
  | { type: 'task.deleted'; id: string }
  | { type: 'target.updated'; entity: TargetStats }
  | { type: 'milestone.completed'; entity: Milestone }
  | { type: 'project.updated'; entity: Project }
  | { type: 'bulk.updated'; entities: Task[] };
