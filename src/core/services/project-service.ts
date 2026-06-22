/**
 * Project business logic service.
 */

import type { ProjectRepository } from "@/core/repositories/project-repository";
import type { TaskRepository } from "@/core/repositories/task-repository";
import type { Project, Task, CreateProjectInput, UpdateProjectInput } from "@/core/entities";
import { NotFoundError } from "@/shared/errors";

export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly taskRepo: TaskRepository,
  ) {}

  /** List all projects with computed stats. */
  getAllProjects(): Project[] {
    return this.projectRepo.findAll();
  }

  /** Get a single project with its associated tasks. */
  getProjectWithTasks(id: string): { project: Project; tasks: Task[] } {
    const project = this.projectRepo.findById(id);
    if (!project) throw new NotFoundError("项目");
    const tasks = this.taskRepo.findByProject(id);
    return { project, tasks };
  }

  /** Create a new project. */
  createProject(input: CreateProjectInput): string {
    return this.projectRepo.create(input);
  }

  /** Update an existing project. */
  updateProject(id: string, input: UpdateProjectInput): void {
    this.projectRepo.update(id, input);
  }

  /** Delete a project and its associated tasks. */
  deleteProject(id: string): void {
    this.projectRepo.delete(id);
  }
}
