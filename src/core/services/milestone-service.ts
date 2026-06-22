/**
 * Milestone business logic service.
 */

import type { MilestoneRepository } from "@/core/repositories/milestone-repository";
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from "@/core/entities";

export class MilestoneService {
  constructor(private readonly milestoneRepo: MilestoneRepository) {}

  /** List all milestones. */
  getAllMilestones(): Milestone[] {
    return this.milestoneRepo.findAll();
  }

  /** Create a milestone. */
  createMilestone(input: CreateMilestoneInput): string {
    return this.milestoneRepo.create(input);
  }

  /** Update a milestone. */
  updateMilestone(input: UpdateMilestoneInput): void {
    this.milestoneRepo.update(input);
  }

  /** Delete a milestone. */
  deleteMilestone(id: string): void {
    this.milestoneRepo.delete(id);
  }
}
