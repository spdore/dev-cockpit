"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useUIStore } from "@/stores/ui-store";
import { api, type TaskData, type ProjectData } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, Check, X, Loader2, ArrowRight, Trash2, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";

interface ActionType { type: string; entity: string; data: Record<string, unknown>; executed?: boolean }
interface ChatMessage { id?: number; role: string; content: string; action?: ActionType; actions?: ActionType[]; executed?: boolean; error?: string; }
interface Conversation { id: string; title: string; createdAt: string; }


interface SSEEvent {
  type: "token" | "done" | "error";
  text?: string;
  reply?: string;
  displayText?: string;
  error?: string;
  action?: ActionType;
  actions?: ActionType[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AIPage() {
  const aiProvider = useUIStore(s => s.aiProvider);
  const aiModel = useUIStore(s => s.aiModel);
  const geminiApiKey = useUIStore(s => s.geminiApiKey);
  const openaiApiKey = useUIStore(s => s.openaiApiKey);
  const claudeApiKey = useUIStore(s => s.claudeApiKey);
  const deepseekApiKey = useUIStore(s => s.deepseekApiKey);
  const qwenApiKey = useUIStore(s => s.qwenApiKey);
  const apiKeys: Record<string, string> = { gemini: geminiApiKey, openai: openaiApiKey, claude: claudeApiKey, deepseek: deepseekApiKey, qwen: qwenApiKey };
  const currentApiKey = apiKeys[aiProvider] || "";
  const settingsLoaded = useUIStore(s => s.settingsLoaded);
  const [activeConv, setActiveConv] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  const { data: conversations = [], mutate: mutateConvs } = useSWR<Conversation[]>("/api/ai/conversations", fetcher);

  // Restore last active conversation on mount
  useEffect(() => {
    if (initialized || conversations.length === 0) return;
    const stored = localStorage.getItem("devcockpit-active-conv");
    if (stored && conversations.some(c => c.id === stored)) {
      setActiveConv(stored);
    } else {
      setActiveConv(conversations[0].id);
    }
    setInitialized(true);
  }, [conversations, initialized]);

  // Persist active conversation
  useEffect(() => {
    if (activeConv) localStorage.setItem("devcockpit-active-conv", activeConv);
  }, [activeConv]);
  const { data: messages = [], mutate: mutateHistory } = useSWR<ChatMessage[]>(`/api/ai/history?conversation_id=${activeConv}`, fetcher);
  const { data: tasks = [], mutate: mutateTasks } = useSWR<TaskData[]>("tasks", api.getTasks);
  const { data: projects = [], mutate: mutateProjects } = useSWR<ProjectData[]>("projects", api.getProjects);
  const { data: summaries = [], mutate: mutateSummaries } = useSWR<{date:string;content:string;workHours:number;mood:string}[]>("/api/daily-summary", fetcher);

  /** Invalidate entity caches — each page revalidates on its own when mounted. */
  const invalidateCaches = useCallback(() => {
    mutateTasks();
    mutateProjects();
    mutateSummaries();
  }, [mutateTasks, mutateProjects, mutateSummaries]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Cache newly created project name→id for same-batch task resolution */
  const freshProjectIds = useRef<Map<string, string>>(new Map());

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Synchronous message cache — SWR is async, but buildContext needs the latest messages NOW.
  const localMessages = useRef<ChatMessage[]>([]);
  useEffect(() => { localMessages.current = messages; }, [messages]);

  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);

  // No auto-creation — let user start their first conversation manually

  /** Generate a conversation title — uses Gemini free tier as lightweight utility. */
  const autoTitle = useCallback(async (convId: string, firstMessage: string) => {
    const titleKey = geminiApiKey || currentApiKey; // prefer Gemini key, fallback to current
    if (!titleKey || !firstMessage.trim()) return;
    const conv = conversations.find(c => c.id === convId);
    if (!conv || !/^(新对话|对话 \d+)$/.test(conv.title)) return;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(titleKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `用3-8个中文字总结这段对话的主题，只返回总结不要其他内容：${firstMessage.slice(0, 200)}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 20 },
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const title = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || firstMessage.slice(0, 15);
        await fetch("/api/ai/conversations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: convId, title: title.slice(0, 30) }),
        });
        mutateConvs();
      }
    } catch { /* non-critical */ }
  }, [geminiApiKey, currentApiKey, conversations, mutateConvs]);

  // Persist a message to DB synchronously (fire-and-forget for tokens, awaited for final)
  const persistMessage = useCallback(async (msg: Partial<ChatMessage>, convId?: string) => {
    const cid = convId || activeConv;
    const body: Record<string, unknown> = { ...msg, conversationId: cid };
    if (msg.actions && !msg.action) body.action = msg.actions;
    delete body.actions;
    const res = await fetch("/api/ai/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    mutateHistory();
    return res;
  }, [activeConv, mutateHistory]);

  const buildContext = () => {
    const ctx: string[] = [];
    const now = new Date();
    ctx.push(`当前日期: ${now.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "long" })} (YYYY-MM-DD: ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")})`);
    const all = localMessages.current;
    if (all.length > 0) {
      ctx.push(`对话历史（共${all.length}条）:\n` + all.map(m => `${m.role === "user" ? "👤用户" : "🤖AI"}: ${m.content.slice(0, 500)}`).join("\n"));
    }
    if (tasks.length > 0) ctx.push(`当前任务: ${tasks.slice(0, 20).map(t => `[${t.id}] "${t.title}" (状态:${t.status}, 优先级:${t.priority}, 项目:${t.project.name})`).join("; ")}`);
    if (projects.length > 0) ctx.push(`当前项目: ${projects.slice(0, 10).map(p => `[${p.id}] "${p.name}" (${p.status})`).join("; ")}`);
    if (summaries.length > 0) {
      const ss = summaries as {date:string;content:string;workHours:number;mood:string}[];
      ctx.push(`已有状态记录(${ss.length}条): ${ss.slice(0,14).map(s => `${s.date} ${s.workHours}h ${s.mood} ${s.content ? '"'+s.content.slice(0,80)+'"' : ""}`).join(" | ")}${ss.length>14?"...":""}`);
    }
    return ctx.join("\n");
  };

  const send = async () => {
    const text = input.trim(); if (!text || loading) return;
    setInput("");
    setLoading(true);
    setStreamingText("");

    // Ensure a conversation exists before sending
    let convId = activeConv;
    if (!convId) {
      const res = await fetch("/api/ai/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "新对话" }) });
      const { id } = await res.json();
      convId = id;
      setActiveConv(id);
      mutateConvs();
    }

    // 1. Persist user message (must be in DB before AI reads context)
    await persistMessage({ role: "user", content: text }, convId);

    if (!currentApiKey) {
      await persistMessage({ role: "ai", content: "请先在设置中填写 Gemini API Key。", error: "no_key" }, convId);
      setLoading(false);
      return;
    }

    // 2. Start streaming — add placeholder for real-time updates
    const placeholder: ChatMessage = { role: "ai", content: "" };
    localMessages.current = [...localMessages.current, placeholder];

    try {
      const contextMsg = `上下文:\n${buildContext()}\n\n用户输入: ${text}`;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextMsg, apiKey: currentApiKey, provider: aiProvider, model: aiModel }),
      });

      if (!res.ok || !res.body) {
        await persistMessage({ role: "ai", content: `请求失败 (${res.status})`, error: "network" }, convId);
        setLoading(false);
        mutateHistory();
        return;
      }

      // 3. Consume SSE stream — tokens arrive asynchronously, UI updates synchronously per chunk
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let finalReply = "";
      let finalAction: ActionType | undefined;
      let finalActions: ActionType[] | undefined;
      let streamError: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event: SSEEvent = JSON.parse(jsonStr);

            if (event.type === "token" && event.text) {
              accumulated += event.text;
              setStreamingText(accumulated);
            } else if (event.type === "done") {
              finalReply = event.reply || accumulated;
              finalAction = event.action;
              finalActions = event.actions;
              // Replace any leaked JSON with clean reply
              if (event.displayText) setStreamingText(event.displayText as string);
            } else if (event.type === "error") {
              streamError = event.error;
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      // 4. Stream complete — persist the final message synchronously
      const finalMsg: Partial<ChatMessage> = {
        role: "ai",
        content: streamError || finalReply || accumulated || "（空响应）",
        action: finalActions ? undefined : (finalAction?.type && finalAction.type !== "none" ? finalAction : undefined),
        actions: finalActions && finalActions.length > 0 ? finalActions : undefined,
        error: streamError,
      };

      // Run query inline so results appear in the same reply bubble
      const queryAction = finalActions?.find((a: ActionType) => a.type === "query") || (finalAction?.type === "query" ? finalAction : null);
      if (queryAction && !streamError) {
        let result = ""; const entity = queryAction.entity || "none";
        const qd = queryAction.data || {};

        // Project queries
        if (entity === "project" || entity === "none") {
          let filtered = projects;
          if (qd.status) filtered = filtered.filter(p => p.status === qd.status);
          // Projects with active tasks
          const projectsWithActive = filtered.filter(p => tasks.some(t => t.projectId === p.id && (t.status === "in_progress" || t.status === "review")));
          if (projectsWithActive.length > 0) {
            result += `📁 有进行中任务的项目 (${projectsWithActive.length} 个)：\n`;
            for (const p of projectsWithActive) {
              const activeCount = tasks.filter(t => t.projectId === p.id && (t.status === "in_progress" || t.status === "review")).length;
              result += `  ${p.name} — ${activeCount} 个进行中${p.description ? "（"+p.description.slice(0,30)+"）" : ""}\n`;
            }
          }
          if (!qd.status && projectsWithActive.length === 0) {
            result += `📁 全部项目 (${filtered.length} 个)：\n`;
            for (const p of filtered) result += `  ${p.name} — ${p.taskCount} 个任务\n`;
          }
        }

        // Task queries
        if (entity === "task" || entity === "none") {
          let filtered = [...tasks];
          // Status filter — only use AI-provided status, never guess from user text
          if (qd.status) filtered = filtered.filter(t => t.status === qd.status);
          // Priority filter
          if (qd.priority) filtered = filtered.filter(t => t.priority === qd.priority);
          // Tag filter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((qd as any).tags && Array.isArray((qd as any).tags)) {
            filtered = filtered.filter(t => (qd as any).tags.some((tag: string) => t.tags?.includes(tag)));
          }
          // Project filter
          if (qd.projectId) filtered = filtered.filter(t => t.projectId === qd.projectId || t.project?.name === qd.projectId);

          if (filtered.length > 0) {
            // Group by project for multi-part questions
            const projMap = new Map<string, { name: string; tasks: typeof filtered }>();
            for (const t of filtered) {
              const key = t.projectId;
              if (!projMap.has(key)) projMap.set(key, { name: t.project.name, tasks: [] });
              projMap.get(key)!.tasks.push(t);
            }
            const st: Record<string,string>={todo:"⏳待开始",in_progress:"🚧进行中",review:"🔍审查中",done:"✅已完成",inbox:"📥收件箱"};

            // If user explicitly asked for both in-progress AND completed, show all
            const hasStatusFilter = !!qd.status;
            if (!hasStatusFilter && projMap.size > 0) {
              // Grouped by project, in-progress first then done
              for (const [_, p] of projMap) {
                const active = p.tasks.filter(t => t.status === "in_progress" || t.status === "review");
                const done = p.tasks.filter(t => t.status === "done");
                const other = p.tasks.filter(t => !["in_progress","review","done"].includes(t.status));
                result += `\n${p.name} (${p.tasks.length} 个任务)`;
                if (active.length > 0) { result += `\n  进行中: ${active.map(t => t.title).join("、")}`; }
                if (done.length > 0) { result += `\n  已完成: ${done.map(t => t.title).join("、")}`; }
                if (other.length > 0) { result += `\n  其他: ${other.map(t => `${st[t.status]||t.status} ${t.title}`).join("、")}`; }
                result += "\n";
              }
            } else {
              // Simple flat list for targeted queries
              result += `\n📋 任务 (${filtered.length} 个)：\n`;
              for (const t of filtered.slice(0, 20)) {
                const tags = t.tags?.length ? ` [${t.tags.join(",")}]` : "";
                const prio = t.priority==="urgent"?"紧急":t.priority==="high"?"高优先":t.priority==="low"?"低优先":"";
                result += `  ${st[t.status]||t.status} ${t.title}${prio?"（"+prio+"）":""} · ${t.project.name}${tags}\n`;
              }
              if (filtered.length > 20) result += `  ...还有 ${filtered.length - 20} 个任务\n`;
            }
          }
        }
        if (result) finalMsg.content = (finalReply || accumulated) + "\n\n" + result.trim();
      }

      await persistMessage(finalMsg, convId);
      setStreamingText("");
      // Auto-title on first exchange
      if (messages.length === 0) autoTitle(activeConv, text);
      invalidateCaches();
    } catch {
      await persistMessage({ role: "ai", content: "网络错误，请重试。", error: "network" });
      setStreamingText("");
    }
    setLoading(false);
  };

  // Optimistic UI update — mark action as executed BEFORE async API call
  const optimisticMark = (msgIdx: number, actionIdx: number) => {
    mutateHistory(
      (data) => data?.map(m => {
        if (m.id !== messages[msgIdx]?.id) return m;
        const updated = { ...m };
        const actions = getActions(updated);
        if (actions.length > 0) {
          // mark target action executed, strip _idx before storing
          const marked: ActionType[] = actions.map((a, ai) => {
            const { _idx, ...rest } = a;
            return ai === actionIdx ? { ...rest, executed: true } : rest;
          });
          if (Array.isArray(updated.action)) {
            updated.action = marked as unknown as ActionType;
          } else if (updated.actions) {
            updated.actions = marked;
          } else {
            updated.action = marked[0]!;
          }
          if (marked.every(a => a.executed)) updated.executed = true;
        }
        return updated;
      }),
      false
    );
  };

  /** Execute a single action, optionally collecting result instead of persisting. */
  const executeOne = async (msgIdx: number, actionIdx: number, silent: boolean): Promise<string> => {
    const msg = messages[msgIdx];
    if (!msg) return "";
    const actionList = getActions(msg);
    const actionItem = actionList[actionIdx];
    if (!actionItem || actionItem.executed) return "";

    const { type, entity, data: raw } = actionItem;
    // Strip empty values to prevent overwriting existing data
    const d: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== "" && v !== null && v !== undefined) d[k] = v;
    }
    optimisticMark(msgIdx, actionIdx);

    try {
      let result = "";
      if (entity === "task") {
        if (type === "create") { const projId = d.projectId ? resolveProjectId(d.projectId as string) : ""; const res = await api.createTask({ title: d.title || "新任务", content: d.content || "", projectId: projId, priority: d.priority || "medium", status: d.status || "todo", startDate: (d.startDate || d.beginDate || null) as string | null, dueDate: (d.dueDate || d.endDate || d.deadline || null) as string | null, tags: d.tags || [] }); result = `✅ 创建任务「${d.title}」`; }
        else if (type === "update") { const id = d.id as string || findTask(d.title as string); if (!id) { result = `⚠ 找不到任务「${d.title}」`; } else { await api.updateTask(id, d); result = `✅ 更新任务「${d.title||id}」`; } }
        else if (type === "delete") { const id = d.id as string || findTask(d.title as string); const taskName = d.title || tasks.find(t=>t.id===id)?.title || "任务"; if (!id) { result = `⚠ 找不到任务「${taskName}」`; } else { try { await api.deleteTask(id); result = `✅ 删除任务「${taskName}」`; } catch { result = `ℹ️ 任务已级联删除`; } } }
      } else if (entity === "project") {
        if (type === "create") { const res = await api.createProject({ name: d.name || "新项目", description: d.description || "", color: d.color || "#8B5CF6", status: d.status || "active", repoUrl: d.repoUrl || "", startDate: d.startDate || null, targetDate: d.targetDate || null }); freshProjectIds.current.set(d.name as string || "", res.id); result = `✅ 创建项目「${d.name}」`; }
        else if (type === "update") { const id = d.id as string || findProj(d.name as string); if (!id) { result = `⚠ 找不到项目「${d.name}」`; } else { await api.updateProject(id, d); result = `✅ 更新项目「${d.name||id}」`; } }
        else if (type === "delete") { const id = d.id as string || findProj(d.name as string); const projName = d.name || projects.find(p=>p.id===id)?.name || "项目"; if (!id) { result = `⚠ 找不到项目「${projName}」`; } else { try { await api.deleteProject(id); result = `✅ 删除项目「${projName}」`; } catch { result = `ℹ️ 项目已删除`; } } }
      } else if (entity === "status") {
        if (type === "create" || type === "update") {
          const MOOD_MAP: Record<string, string> = { "累":"😩","疲劳":"😩","开心":"😊","高兴":"😊","专注":"💪","努力":"💪","困惑":"🤔","思考":"🤔","得意":"😎","满意":"😎","生气":"😤","不爽":"😤","放松":"🌴","休息":"🌴","创意":"🎨","灵感":"🎨","深入":"🧐","研究":"🧐","困":"😴","困倦":"😴","兴奋":"🤩","激动":"🤩" };
          const rawMood = (d.mood as string) || "";
          const mood = rawMood ? (MOOD_MAP[rawMood] || (/^[😊💪🤔😎😤🌴🎨🧐😴🤩😩]$/.test(rawMood) ? rawMood : "😊")) : "";
          const dateStr = (d.date as string) || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`;
          // Merge with existing record — preserve fields AI didn't specify
          const existing = summaries.find((s: {date:string;content:string;workHours:number;mood:string}) => s.date === dateStr);
          const finalContent = (d.content as string) || existing?.content || "";
          const finalHours = d.workHours !== undefined ? (d.workHours as number) : (existing?.workHours ?? 0);
          const finalMood = mood || existing?.mood || "";
          await api.addDailySummary({ date: dateStr, content: finalContent, workHours: finalHours, mood: finalMood });
          result = `✅ 已${existing ? "更新" : "记录"}${dateStr}状态`;
        }
      }
      // Mark as executed in DB
      if (msg.id) await fetch("/api/ai/history", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msg.id, actionIndex: actionIdx }) });
      return result;
    } catch (e) { return `❌ 失败: ${e}`; }
  };

  const execute = async (msgIdx: number, actionIdx: number = 0) => {
    setLoading(true);
    const result = await executeOne(msgIdx, actionIdx, false);
    if (result) await persistMessage({ role: "ai", content: result });
    mutateHistory();
    await invalidateCaches();
    setLoading(false);
  };

  const executeBatch = async (msgIdx: number) => {
    const msg = messages[msgIdx];
    if (!msg) return;
    const actionList = getActions(msg);
    const pending = actionList.filter(a => !a.executed && a.type !== "query");
    if (pending.length === 0) return;
    setLoading(true);
    freshProjectIds.current.clear();
    const results: string[] = [];
    for (const act of pending) {
      const r = await executeOne(msgIdx, act._idx, true);
      if (r) results.push(r);
    }
    // Single summary message
    const summary = results.length > 0 ? `批量操作完成（${results.length} 项）：\n${results.map(r => `  ${r}`).join("\n")}` : "操作已完成";
    await persistMessage({ role: "ai", content: summary });
    mutateHistory();
    await invalidateCaches();
    setLoading(false);
  };

  const ignoreAction = async (msgIdx: number, actionIdx: number) => {
    const msg = messages[msgIdx];
    if (!msg || !msg.id) return;
    const actionList = getActions(msg);
    const actionItem = actionList[actionIdx];
    if (!actionItem || actionItem.executed) return;
    optimisticMark(msgIdx, actionIdx);
    await fetch("/api/ai/history", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msg.id, actionIndex: actionIdx }) });
    mutateHistory();
  };

  const newConversation = async () => {
    const res = await fetch("/api/ai/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "新对话" }) });
    const { id } = await res.json(); mutateConvs(); setActiveConv(id);
  };

  /** Format SQLite datetime (local time, space-separated) to relative time. */
  const formatTime = (raw: string) => {
    // SQLite stores "YYYY-MM-DD HH:MM:SS" in local time.
    // Replace space with 'T' so JS parses it as local time (not UTC).
    // SQLite now stores localtime. Replace space with 'T' for valid ISO-8601.
    const d = new Date(raw.replace(" ", "T") + "Z"); // DB stores UTC, parse as such
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}小时前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };
  const deleteConversation = async (id: string) => {
    if (!confirm("删除此对话？")) return;
    await fetch(`/api/ai/conversations?id=${id}`, { method: "DELETE" }); mutateConvs();
    if (activeConv === id) { localStorage.removeItem("devcockpit-active-conv"); setActiveConv(""); }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  function findTask(title: string) { const s = title.toLowerCase(); return tasks.find(x => x.title.toLowerCase().includes(s) || s.includes(x.title.toLowerCase()))?.id; }
  function findProj(name: string) { const s = name.toLowerCase(); return projects.find(x => x.name.toLowerCase().includes(s) || s.includes(x.name.toLowerCase()))?.id; }
  /** Resolve a project ID or name to an actual project ID for task creation. */
  function resolveProjectId(raw: string | undefined): string {
    if (!raw) return "";
    // Check freshly created projects first (same batch)
    if (freshProjectIds.current.has(raw)) return freshProjectIds.current.get(raw)!;
    // Direct ID match
    if (projects.some(p => p.id === raw)) return raw;
    // Name match
    const byName = findProj(raw);
    if (byName) return byName;
    // Partial match
    const s = raw.toLowerCase();
    const partial = projects.find(p => p.name.toLowerCase().includes(s));
    return partial?.id || raw;
  }

  const getActions = (msg: ChatMessage): (ActionType & { _idx: number })[] => {
    if (msg.actions) return msg.actions.map((a, i) => ({ ...a, _idx: i }));
    if (msg.action) {
      // DB stores multi-action as JSON array in the `action` column
      if (Array.isArray(msg.action)) return msg.action.map((a, i) => ({ ...a, _idx: i }));
      return [{ ...msg.action, _idx: 0 }];
    }
    return [];
  };

  const actionLabel = (a: ActionType) => {
    const typeLabel = a.type === "create" ? "创建" : a.type === "update" ? "更新" : a.type === "delete" ? "删除" : "查询";
    const entityLabel = a.entity === "task" ? " 任务" : a.entity === "project" ? " 项目" : a.entity === "status" ? " 状态" : "";
    return typeLabel + entityLabel;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border"><Button size="sm" className="w-full text-xs" onClick={newConversation}><Plus className="h-3.5 w-3.5 mr-1" />新对话</Button></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.map(c => (
            <div key={c.id} className={`group flex flex-col rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors ${activeConv === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`} onClick={() => setActiveConv(c.id)}>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 shrink-0 opacity-50" />
                <span className="flex-1 truncate font-medium">{c.title}</span>
                <button onClick={e => { e.stopPropagation(); deleteConversation(c.id); }} className="opacity-0 group-hover:opacity-100 shrink-0"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" /></button>
              </div>
              <span className="text-[10px] text-muted-foreground ml-4 mt-0.5">{formatTime(c.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv && conversations.length === 0 ? (
          /* Welcome — no conversations yet */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">AI 助手</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
              通过自然语言管理项目和任务，支持创建、查询、更新和删除操作
            </p>
            <Button onClick={newConversation}><Plus className="h-4 w-4 mr-1" />开始新对话</Button>
            <div className="mt-8 text-xs text-muted-foreground text-center space-y-1">
              <p>试试这些：</p>
              <p>• 创建高优先级任务「修复支付 Bug」</p>
              <p>• 查看所有进行中的任务</p>
              <p>• 把某某任务标记为已完成</p>
            </div>
          </div>
        ) : (
          /* Normal chat view */
          <>
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-border">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />AI 助手
              </h1>
              <p className="text-xs text-muted-foreground">{tasks.length} 任务 · {projects.length} 项目</p>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !streamingText && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center"><Bot className="h-4 w-4 text-amber-400" /></div>
                  <Card><CardContent className="p-3 text-sm whitespace-pre-wrap">你好！我是 AI 助手 🤖{'\n\n'}试试这些：{'\n'}• 创建高优先级任务「修复支付 Bug」{'\n'}• 查看所有进行中的任务{'\n'}• 把某某任务标记为已完成{'\n'}• 今天工作了 8 小时 😊</CardContent></Card>
                </div>
              )}
              {messages.map((msg, i) => {
                const actionList = getActions(msg);
                const allExecuted = actionList.length > 0 && actionList.every(a => a.executed);
                return (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "ai" && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center"><Bot className="h-4 w-4 text-amber-400" /></div>
                    )}
                    <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                      <Card className={msg.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                        <CardContent className="p-3 text-sm whitespace-pre-wrap">{msg.content}</CardContent>
                      </Card>
                      {(() => {
                        const pending = actionList.filter(a => !a.executed && a.type !== "query");
                        if (pending.length === 0) return null;
                        if (pending.length === 1) {
                          const act = pending[0]!;
                          return (
                            <Card key={act._idx} className="mt-2 border-amber-400/30 bg-amber-400/5">
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                  <span className="text-xs font-medium">{actionLabel(act)}</span>
                                </div>
                                {act.data && Object.keys(act.data).filter(k => !['id','projectId'].includes(k)).length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(act.data).filter(([k]) => !['id','projectId'].includes(k)).map(([k, v]) => (
                                      <Badge key={k} variant="outline" className="text-[10px]">{k}: {typeof v === "string" ? v.slice(0, 40) : String(v).slice(0, 40)}</Badge>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 text-[11px]" onClick={() => execute(i, act._idx)} disabled={loading}>
                                    {loading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /></> : <><Check className="h-3 w-3 mr-1" /></>}执行
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => ignoreAction(i, act._idx)}>
                                    <X className="h-3 w-3 mr-1" />忽略
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        // Multiple actions → consolidated card
                        return (
                          <Card key="batch" className="mt-2 border-amber-400/30 bg-amber-400/5">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                <span className="text-xs font-medium">批量操作（{pending.length} 项）</span>
                              </div>
                              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                {pending.map((act) => (
                                  <div key={act._idx} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span className="shrink-0 w-4 text-center">{act._idx + 1}.</span>
                                    <span>{actionLabel(act)}</span>
                                    {act.data && Object.keys(act.data).filter(k => !['id','projectId'].includes(k)).length > 0 && (
                                      <span className="text-[10px]">
                                        {Object.entries(act.data).filter(([k]) => !['id','projectId'].includes(k)).map(([k, v]) => `${k}:${String(v).slice(0, 20)}`).join("，")}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 text-[11px]" onClick={() => executeBatch(i)} disabled={loading}>
                                  {loading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /></> : <><Check className="h-3 w-3 mr-1" /></>}全部执行
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={async () => { for (const act of pending) { await ignoreAction(i, act._idx); } }}>
                                  <X className="h-3 w-3 mr-1" />全部忽略
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}
                      {allExecuted && <p className="text-[10px] text-emerald-400 mt-1 ml-1">✓ 已执行</p>}
                      {msg.executed && actionList.length === 0 && <p className="text-[10px] text-emerald-400 mt-1 ml-1">✓ 已执行</p>}
                      {msg.error && <p className="text-[10px] text-red-400 mt-1 ml-1">⚠ {msg.error}</p>}
                    </div>
                    {msg.role === "user" && (
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                    )}
                  </div>
                );
              })}
              {streamingText && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center"><Bot className="h-4 w-4 text-amber-400" /></div>
                  <div className="max-w-[85%]">
                    <Card className="border-amber-400/20">
                      <CardContent className="p-3 text-sm whitespace-pre-wrap">
                        {streamingText}<span className="inline-block w-1.5 h-4 bg-amber-400 animate-pulse ml-0.5 align-middle" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              {loading && !streamingText && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center"><Bot className="h-4 w-4 text-amber-400" /></div>
                  <Card><CardContent className="p-3 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />思考中...</CardContent></Card>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {/* Input bar */}
            <div className="shrink-0 p-4 border-t border-border flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={settingsLoaded && !currentApiKey ? "请先在设置中配置 API Key" : "描述你想做什么...（Enter 发送，Shift+Enter 换行）"}
                className="flex-1 text-sm min-h-[40px] max-h-[160px] resize-none"
                rows={1}
                disabled={loading}
              />
              <Button size="icon" className="h-10 w-10 shrink-0" onClick={send} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {settingsLoaded && !currentApiKey && (
              <div className="shrink-0 pb-3 text-center">
                <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  前往设置配置 API Key <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
