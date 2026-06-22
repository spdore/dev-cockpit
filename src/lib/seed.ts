import { db } from "./db";

const TODAY = "2026-06-21T12:00:00.000Z";

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

export function seedDatabase() {
  const count = db.prepare("SELECT COUNT(*) as c FROM projects").get() as { c: number };
  if (count.c > 0) return;

  const insP = db.prepare("INSERT OR IGNORE INTO projects (id, name, description, color, status, repo_url, start_date, target_date) VALUES (?,?,?,?,?,?,?,?)");
  const insT = db.prepare("INSERT OR IGNORE INTO tasks (id, title, content, project_id, priority, status, start_date, due_date, tags, created_at, completed_at, today_order, subtasks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  const insM = db.prepare("INSERT OR IGNORE INTO milestones (id, project_id, title, target_date, progress) VALUES (?,?,?,?,?)");
  const insA = db.prepare("INSERT OR IGNORE INTO achievements (id, title, description, icon, condition_type, condition_value, unlocked_at) VALUES (?,?,?,?,?,?,?)");
  const insD = db.prepare("INSERT OR IGNORE INTO daily_summaries (id, date, content, work_hours, mood) VALUES (?,?,?,?,?)");

  db.transaction(() => {
    // ── Projects ──
    insP.run("proj-1","SaaS-Platform","多租户 SaaS 管理平台，包含认证、支付、分析等模块","#8B5CF6","active","https://github.com/user/saas-platform","2026-03-01T00:00:00Z","2026-08-01T00:00:00Z");
    insP.run("proj-2","Side-Proj-A","个人副业项目 — AI 辅助写作工具","#F97316","active","https://github.com/user/side-proj-a","2026-04-15T00:00:00Z","2026-09-01T00:00:00Z");
    insP.run("proj-3","OpenSource-X","开源的 CLI 效率工具集，200+ GitHub stars","#22C55E","maintaining","https://github.com/user/opensource-x","2025-11-01T00:00:00Z",null);
    insP.run("proj-4","Blog-Engine","基于 Next.js 的静态博客引擎","#3B82F6","paused","https://github.com/user/blog-engine","2026-01-10T00:00:00Z","2026-12-31T00:00:00Z");
    insP.run("proj-5","CLI-Toolbox","开发者日常使用的命令行工具箱","#EC4899","planned","",null,"2026-12-01T00:00:00Z");
    insP.run("proj-6","Old-Portfolio","旧版个人作品集网站（已迁移到新版）","#6B7280","completed","https://github.com/user/portfolio","2025-06-01T00:00:00Z","2025-12-31T00:00:00Z");
    insP.run("proj-7","Analytics-Dash","实时数据分析仪表盘，支持 WebSocket 推送","#F59E0B","active","https://github.com/user/analytics-dash","2026-05-01T00:00:00Z","2026-10-15T00:00:00Z");
    insP.run("proj-8","DevTools-Plugin","VS Code 扩展 — 提升开发效率的插件","#06B6D4","active","https://github.com/user/devtools-plugin","2026-06-01T00:00:00Z","2026-08-15T00:00:00Z");

    // ── Tasks (with content, start_date, due_date) ──
    const tasks: (string | null)[][] = [
      ["task-1","完成用户认证模块重构","重构 JWT 认证中间件，支持 refresh token 轮转，OAuth2 集成","proj-1","high","in_progress","2026-06-19","2026-06-23",'["auth","refactor"]',TODAY,null,"0",'[{"title":"迁移 middleware 逻辑","done":true},{"title":"更新测试用例","done":false},{"title":"更新 API 文档","done":false}]'],
      ["task-2","修复支付回调签名验证 Bug","支付宝和微信支付回调签名验证失败，导致订单状态不同步","proj-1","high","todo","2026-06-22","2026-06-24",'["bug","payment"]',TODAY,null,"1",null],
      ["task-3","优化首页 Lighthouse 评分","Google Lighthouse 性能评分从 72 提升到 95+","proj-2","medium","todo","2026-06-22","2026-06-25",'["perf","frontend"]',TODAY,null,"2",null],
      ["task-4","编写单元测试覆盖率达到80%","覆盖 auth、payment、user 等核心模块","proj-1","medium","todo","2026-06-20","2026-07-05",'["testing"]',daysAgo(1),null,null,'[{"title":"auth 模块测试","done":false},{"title":"payment 模块测试","done":false}]'],
      ["task-5","调研并集成 Sentry 错误监控","评估 Sentry vs Datadog，完成错误监控 SDK 集成","proj-1","low","todo","2026-06-25","2026-07-10",'["devops","monitoring"]',daysAgo(2),null,null,null],
      ["task-6","重构 Side-Proj-A 数据库 Schema","从单表设计迁移到规范化关系模型，支持全文搜索","proj-2","high","in_progress","2026-06-18","2026-06-28",'["database","refactor"]',daysAgo(1),null,null,null],
      ["task-7","更新 OpenSource-X README","添加快速开始指南、API 文档链接和贡献者指南","proj-3","low","review","2026-06-15","2026-06-22",'["docs"]',daysAgo(3),null,null,null],
      ["task-8","修复 Blog-Engine 图片懒加载 Bug","IntersectionObserver 在 Safari 上不触发回调","proj-4","medium","todo","2026-06-10","2026-06-20",'["bug","frontend"]',daysAgo(4),null,null,null],
      ["task-9","设计 CLI-Toolbox 插件系统架构","支持第三方插件的热插拔架构设计文档","proj-5","high","todo","null","2026-08-01",'["architecture","design"]',daysAgo(5),null,null,null],
      ["task-10","实现 Analytics-Dash 实时数据流","WebSocket + Redis Pub/Sub 实现实时数据推送","proj-7","high","in_progress","2026-06-20","2026-06-30",'["data","realtime"]',daysAgo(1),null,null,null],
      ["task-11","设计 DevTools-Plugin UI 界面","Figma 设计稿 → React 组件实现，支持暗色主题","proj-8","medium","review","2026-06-16","2026-06-24",'["design","ui"]',daysAgo(2),null,null,null],
      ["task-12","编写 API 接口文档","Swagger/OpenAPI 规范，覆盖所有 REST 端点","proj-1","low","done","2026-06-14","2026-06-20",'["docs"]',daysAgo(1),daysAgo(0),null,null],
      ["task-13","数据库性能优化","慢查询优化，索引重建，连接池调优","proj-7","urgent","todo","2026-06-22","2026-06-27",'["database","perf"]',daysAgo(3),null,null,null],
      ["task-14","添加暗色模式支持","CSS 变量 + Tailwind 暗色主题，支持系统跟随","proj-8","medium","done","2026-06-12","2026-06-19",'["ui","theme"]',daysAgo(4),daysAgo(1),null,null],
      ["task-15","修复移动端响应式布局","iOS Safari 底部导航栏遮挡，viewport 高度计算错误","proj-4","low","done","2026-06-08","2026-06-15",'["bug","responsive"]',daysAgo(5),daysAgo(2),null,null],
    ];
    for (const t of tasks) insT.run(...t);

    // ── Milestones ──
    insM.run("ms-1","proj-1","v2.0 正式发布","2026-06-25T00:00:00Z",85);
    insM.run("ms-2","proj-1","支付模块全面上线","2026-06-30T00:00:00Z",60);
    insM.run("ms-3","proj-2","App Store 审核提交","2026-07-15T00:00:00Z",35);
    insM.run("ms-4","proj-7","Beta 版本内测","2026-07-01T00:00:00Z",50);

    // ── Achievements ──
    insA.run("ach-1","初出茅庐","完成第一个任务","🌟","task_count",1,daysAgo(10));
    insA.run("ach-2","任务机器","累计完成 10 个任务","⚡","task_count",10,daysAgo(3));
    insA.run("ach-3","连续打卡","连续 7 天有完成任务","🔥","streak",7,null);
    insA.run("ach-4","完美一周","一周内完成所有计划任务","💎","weekly_complete",1,daysAgo(5));
    insA.run("ach-5","多面手","同时推进 3 个以上项目","🎯","project_count",3,daysAgo(1));
    insA.run("ach-6","代码机器","单日完成 5 个以上任务","🚀","daily_count",5,daysAgo(7));
    insA.run("ach-7","文档大师","累计完成 5 个文档相关任务","📚","tag_docs",5,null);
    insA.run("ach-8","Bug 杀手","累计修复 5 个 Bug","🐛","tag_bug",5,daysAgo(4));

    // ── Daily Summaries ──
    insD.run("ds-1",daysAgo(0).split("T")[0],"今天主要完成了 API 文档编写和暗色模式适配，支付模块的 Bug 还需要明天继续排查。",7.5,"😊");
    insD.run("ds-2",daysAgo(1).split("T")[0],"集中精力重构了认证模块的 middleware 层，测试覆盖率有了明显提升。",8.0,"💪");
    insD.run("ds-3",daysAgo(2).split("T")[0],"调研了 Sentry 和 Datadog，最终决定使用 Sentry。下午处理了一些 Code Review。",6.0,"🤔");
    insD.run("ds-4",daysAgo(3).split("T")[0],"OpenSource-X 的 README 更新合并了，社区反馈不错。顺便处理了 2 个小 issue。",5.5,"😎");
    insD.run("ds-5",daysAgo(4).split("T")[0],"周末休息，只看了一些技术文章。没有写代码。",1.0,"🌴");
    insD.run("ds-6",daysAgo(6).split("T")[0],"数据库 Schema 重构方案确定了，画了 ER 图，明天开始写 migration。",4.0,"🧐");
    insD.run("ds-7",daysAgo(8).split("T")[0],"完成了 DevTools-Plugin 的 UI 设计稿评审，获得团队一致认可。",6.5,"🎨");
  })();

  console.log("[DB] Seeded projects, tasks, milestones, achievements, summaries");
}
