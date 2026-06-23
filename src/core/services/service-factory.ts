/**
 * Service factory — dependency injection container.
 *
 * Creates and wires up all repository and service instances.
 * API routes import pre-constructed services from here rather
 * than constructing their own dependencies.
 */

import { getDb } from "@/core/database/connection";

// Repositories
import {
  ProjectRepository,
  TaskRepository,
  AchievementRepository,
  DailySummaryRepository,
  ChatRepository,
  SettingsRepository,
} from "@/core/repositories";

// Services
import { ProjectService } from "./project-service";
import { TaskService } from "./task-service";
import { DashboardService } from "./dashboard-service";
import { DailySummaryService } from "./daily-summary-service";
import { ChatService } from "./chat-service";
import { SettingsService } from "./settings-service";

/** Shared database connection. */
const db = getDb();

// ── Repositories ──
const projectRepo = new ProjectRepository(db);
const taskRepo = new TaskRepository(db);
const achievementRepo = new AchievementRepository(db);
const dailySummaryRepo = new DailySummaryRepository(db);
const chatRepo = new ChatRepository(db);
const settingsRepo = new SettingsRepository(db);

// ── Services ──

export const projectService = new ProjectService(projectRepo, taskRepo);
export const taskService = new TaskService(taskRepo, projectRepo);
export const dashboardService = new DashboardService(taskRepo, projectRepo, achievementRepo, dailySummaryRepo);
export const dailySummaryService = new DailySummaryService(dailySummaryRepo);
export const chatService = new ChatService(chatRepo);
export const settingsService = new SettingsService(settingsRepo);
