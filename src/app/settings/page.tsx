"use client";

import { useState } from "react";
import { useUIStore, type FontSize } from "@/stores/ui-store";
import { getAllProviders, type ProviderConfig } from "@/lib/ai-providers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Monitor, Palette, Type, Key, Bot } from "lucide-react";

const THEME_OPTIONS = [
  { key: "light" as const, icon: Sun, label: "浅色模式", desc: "明亮的界面主题" },
  { key: "dark" as const, icon: Moon, label: "深色模式", desc: "护眼的暗色主题" },
  { key: "system" as const, icon: Monitor, label: "跟随系统", desc: "自动匹配系统设置" },
];

const FONT_OPTIONS: { key: FontSize; label: string; sample: string }[] = [
  { key: "small", label: "小", sample: "Aa" },
  { key: "medium", label: "中", sample: "Aa" },
  { key: "large", label: "大", sample: "Aa" },
];

const ALL_PROVIDERS = getAllProviders();

function apiKeyStateKey(provider: string): keyof ReturnType<typeof useUIStore.getState> {
  return (provider + "ApiKey") as keyof ReturnType<typeof useUIStore.getState>;
}

export default function SettingsPage() {
  const store = useUIStore();
  const settingsLoaded = store.settingsLoaded;

  // AI
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");

  const currentProvider = ALL_PROVIDERS.find(p => p.key === store.aiProvider) || ALL_PROVIDERS[0]!;
  const currentModel = store.aiModel || currentProvider.defaultModel;
  const currentApiKey = (store[apiKeyStateKey(currentProvider.key)] as string) || "";

  const maskedKey = currentApiKey ? currentApiKey.slice(0, 6) + "••••••••" + currentApiKey.slice(-4) : "";

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">⚙️ 设置</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">自定义你的 DevCockpit</p>
      </div>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Type className="h-4 w-4" />字号大小</CardTitle>
          <CardDescription>调整界面文字大小</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {FONT_OPTIONS.map((opt) => {
              const isActive = store.fontSize === opt.key;
              const sizeClass = opt.key === "small" ? "text-sm" : opt.key === "large" ? "text-lg" : "text-base";
              return (
                <button key={opt.key} onClick={() => store.setFontSize(opt.key)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${isActive ? "border-primary bg-primary/5" : "border-border"}`}>
                  <span className={sizeClass}>{opt.sample}</span>
                  <span className="text-xs">{opt.label}</span>
                  {isActive && <Badge className="text-[9px] h-4">当前</Badge>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4" />AI 助手</CardTitle>
          <CardDescription>选择 AI 提供商、模型和 API Key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">提供商</label>
            <Select value={store.aiProvider} onValueChange={(v) => { store.setAiProvider(v); const p = ALL_PROVIDERS.find(x => x.key === v); if (p) store.setAiModel(p.defaultModel); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_PROVIDERS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">模型</label>
            <Select value={currentModel} onValueChange={(v) => store.setAiModel(v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{currentProvider.apiKeyLabel}</label>
            {!settingsLoaded ? (
              <p className="text-xs text-muted-foreground">加载中...</p>
            ) : currentApiKey && editingProvider !== currentProvider.key ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono select-none">{maskedKey}</code>
                <Button variant="ghost" size="sm" onClick={() => { setKeyInput(""); setEditingProvider(currentProvider.key); }}>更换</Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm("确定清除 API Key？")) store.setApiKey(currentProvider.key, ""); }}>清除</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input type="password" placeholder={`粘贴 ${currentProvider.apiKeyLabel}...`} value={keyInput} onChange={e => setKeyInput(e.target.value)} className="flex-1 h-9 text-sm" />
                  <Button size="sm" onClick={() => { if (keyInput.trim()) { store.setApiKey(currentProvider.key, keyInput.trim()); setKeyInput(""); setEditingProvider(null); } }}>保存</Button>
                  {currentApiKey && <Button variant="ghost" size="sm" onClick={() => { setEditingProvider(null); setKeyInput(""); }}>取消</Button>}
                </div>
                <p className="text-[10px] text-muted-foreground">{currentProvider.apiKeyHelp}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Palette className="h-4 w-4" />外观主题</CardTitle>
          <CardDescription>选择你喜欢的界面配色</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button key={opt.key} onClick={() => store.setTheme(opt.key)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${store.theme === opt.key ? "border-primary bg-primary/5" : "border-border"}`}>
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1"><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                {store.theme === opt.key && <Badge className="text-[10px]">当前</Badge>}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader><CardTitle className="text-sm">关于 DevCockpit</CardTitle><CardDescription>个人开发者项目管理驾驶舱</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>版本: 0.1.0（原型阶段）</p>
            <p>技术栈: Next.js 16 + Tailwind CSS 4 + shadcn/ui + SQLite</p>
            <p>构建日期: 2026-06-21</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
