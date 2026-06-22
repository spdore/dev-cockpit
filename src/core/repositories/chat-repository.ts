/**
 * Chat & conversation data-access repository.
 */

import { BaseRepository } from "./base-repository";
import { NotFoundError } from "@/shared/errors";
import { mapConversation, mapChatMessage } from "@/shared/mappers";
import type { Conversation, ChatMessage, ChatMessageInput } from "@/core/entities";

export class ChatRepository extends BaseRepository {
  // ── Conversations ──

  /** List all conversations, newest first. */
  findAllConversations(): Conversation[] {
    const rows = this.db
      .prepare("SELECT * FROM conversations ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map(mapConversation);
  }

  /** Create or ensure a conversation exists. */
  createConversation(id: string, title: string): void {
    this.db
      .prepare("INSERT OR IGNORE INTO conversations (id, title) VALUES (?, ?)")
      .run(id, title);
  }

  /** Delete a conversation and its messages (CASCADE). */
  deleteConversation(id: string): void {
    this.db.prepare("DELETE FROM chat_messages WHERE conversation_id = ?").run(id);
    const result = this.db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
    this.assertAffected(result, "对话");
  }

  // ── Messages ──

  /** Get messages for a conversation, oldest first, limited. */
  findMessages(conversationId: string, limit = 200): ChatMessage[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?"
      )
      .all(conversationId, limit) as Record<string, unknown>[];
    return rows.map(mapChatMessage);
  }

  /** Persist a new chat message. Returns the auto-incremented ID. */
  createMessage(input: ChatMessageInput): number {
    const actionJson = input.action ? JSON.stringify(input.action) : null;
    const result = this.db
      .prepare(
        `INSERT INTO chat_messages (conversation_id, role, content, action, executed, error)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.conversationId,
        input.role,
        input.content,
        actionJson,
        input.executed ? 1 : 0,
        input.error ?? null
      );
    return Number(result.lastInsertRowid);
  }

  /**
   * Mark a specific action within a message as executed (or un-executed).
   * @param messageId — the chat_messages row ID
   * @param actionIndex — index into the actions array (0 for single action)
   * @param executed — true to mark executed, false to revert
   */
  markActionExecuted(messageId: number, actionIndex: number, executed: boolean): void {
    const row = this.db
      .prepare("SELECT action FROM chat_messages WHERE id = ?")
      .get(messageId) as { action: string } | undefined;

    if (!row) throw new NotFoundError("消息");

    try {
      const parsed = JSON.parse(row.action);

      if (Array.isArray(parsed)) {
        // Multiple actions
        if (actionIndex < parsed.length) {
          parsed[actionIndex].executed = executed;
        }
        const allDone = parsed.every((a: { executed?: boolean }) => a.executed);
        this.db
          .prepare("UPDATE chat_messages SET action = ?, executed = ? WHERE id = ?")
          .run(JSON.stringify(parsed), allDone ? 1 : 0, messageId);
      } else {
        // Single action
        this.db
          .prepare("UPDATE chat_messages SET executed = ? WHERE id = ?")
          .run(executed ? 1 : 0, messageId);
      }
    } catch {
      // If JSON parse fails, just toggle executed flag
      this.db
        .prepare("UPDATE chat_messages SET executed = ? WHERE id = ?")
        .run(executed ? 1 : 0, messageId);
    }
  }

  /** Delete messages, optionally filtered by conversation. */
  deleteMessages(conversationId?: string): void {
    if (conversationId) {
      this.db.prepare("DELETE FROM chat_messages WHERE conversation_id = ?").run(conversationId);
    } else {
      this.db.prepare("DELETE FROM chat_messages").run();
    }
  }
}
