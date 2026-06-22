"use client";

import { useState } from "react";
import { useUIStore, type FontSize } from "@/stores/ui-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Monitor, Palette, Type, Key } from "lucide-react";

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

export default function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const fontSize = useUIStore((s) => s.fontSize);
  const setFontSize = useUIStore((s) => s.setFontSize);
  const geminiApiKey = useUIStore((s) => s.geminiApiKey);
  const setGeminiApiKey = useUIStore((s) => s.setGeminiApiKey);
  const settingsLoaded = useUIStore((s) => s.settingsLoaded);
  const [editingKey, setEditingKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const maskedKey = geminiApiKey ? geminiApiKey.slice(0, 6) + "••••••••••••••••" + geminiApiKey.slice(-4) : "";

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
              const isActive = fontSize === opt.key;
              const sizeClass = opt.key === "small" ? "text-sm" : opt.key === "large" ? "text-lg" : "text-base";
              return (
                <button key={opt.key} onClick={() => setFontSize(opt.key)}
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

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Key className="h-4 w-4" />Gemini API Key</CardTitle>
          <CardDescription>密钥加密存储在本地，填写后无法查看</CardDescription>
        </CardHeader>
        <CardContent>
          {!settingsLoaded ? (
            <p className="text-xs text-muted-foreground">加载中...</p>
          ) : geminiApiKey && !editingKey ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono select-none">{maskedKey}</code>
              <Button variant="ghost" size="sm" onClick={() => { setKeyInput(""); setEditingKey(true); }}>更换</Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => { if (confirm("确定清除 API Key？AI 助手将无法使用")) setGeminiApiKey(""); }}>清除</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input type="password" placeholder="粘贴你的 Gemini API Key..." value={keyInput} onChange={e => setKeyInput(e.target.value)} className="flex-1 h-9 text-sm" />
                <Button size="sm" onClick={() => { if (keyInput.trim()) { setGeminiApiKey(keyInput.trim()); setKeyInput(""); setEditingKey(false); } }}>保存</Button>
                {geminiApiKey && <Button variant="ghost" size="sm" onClick={() => setEditingKey(false)}>取消</Button>}
              </div>
              <p className="text-[10px] text-muted-foreground">在 <a href="https://aistudio.google.com/apikey" target="_blank" className="underline">aistudio.google.com/apikey</a> 免费获取</p>
            </div>
          )}
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
              <button key={opt.key} onClick={() => setTheme(opt.key)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${theme === opt.key ? "border-primary bg-primary/5" : "border-border"}`}>
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1"><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                {theme === opt.key && <Badge className="text-[10px]">当前</Badge>}
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
