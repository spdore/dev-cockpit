/**
 * Chat & conversation business logic service.
 */

import type { ChatRepository } from "@/core/repositories/chat-repository";
import type { Conversation, ChatMessage, ChatMessageInput, Achievement } from "@/core/entities";

export class ChatService {
  constructor(private readonly chatRepo: ChatRepository) {}

  /** List all conversations. */
  getConversations(): Conversation[] {
    return this.chatRepo.findAllConversations();
  }

  /** Create a new conversation. */
  createConversation(title: string): string {
    const id = `conv-${crypto.randomUUID()}`;
    this.chatRepo.createConversation(id, title || "新对话");
    return id;
  }

  /** Delete a conversation and its messages. */
  deleteConversation(id: string): void {
    this.chatRepo.deleteConversation(id);
  }

  /** Get messages for a conversation. */
  getMessages(conversationId: string, limit = 200): ChatMessage[] {
    return this.chatRepo.findMessages(conversationId, limit);
  }

  /** Persist a new message. */
  createMessage(input: ChatMessageInput): number {
    return this.chatRepo.createMessage(input);
  }

  /** Mark an action within a message as executed/ignored. */
  markActionExecuted(messageId: number, actionIndex: number, executed = true): void {
    this.chatRepo.markActionExecuted(messageId, actionIndex, executed);
  }

  /** Delete messages, optionally scoped to a conversation. */
  deleteMessages(conversationId?: string): void {
    this.chatRepo.deleteMessages(conversationId);
  }
}
