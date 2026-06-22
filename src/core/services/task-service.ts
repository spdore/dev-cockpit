/**
 * Task business logic service.
 */

import type { TaskRepository } from "@/core/repositories/task-repository";
import type { ProjectRepository } from "@/core/repositories/project-repository";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/core/entities";
import { ValidationError } from "@/shared/errors";

export class TaskService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly projectRepo: ProjectRepository,
  ) {}

  /** List all tasks. */
  getAllTasks(): Task[] {
    return this.taskRepo.findAll();
  }

  /**
   * Create a new task.
   * Falls back to the first available project if no projectId is given.
   */
  createTask(input: CreateTaskInput): string {
    let projectId = input.projectId || "";

    if (!projectId) {
      const first = this.projectRepo.findFirst();
      if (!first) {
        throw new ValidationError("请先创建项目再添加任务");
      }
      projectId = first.id;
    }

    return this.taskRepo.create({ ...input, projectId });
  }

  /** Update an existing task. */
  updateTask(id: string, input: UpdateTaskInput): void {
    this.taskRepo.update(id, input);
  }

  /** Toggle task completion status. */
  toggleTask(id: string): { status: string; completedAt: string | null } {
    return this.taskRepo.toggle(id);
  }

  /** Reorder tasks in today's focus list. */
  reorderTasks(orderedIds: string[]): void {
    this.taskRepo.reorder(orderedIds);
  }

  /** Delete a task. */
  deleteTask(id: string): void {
    this.taskRepo.delete(id);
  }
}
