const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "database", "dev-cockpit.db"));

// Backup settings
const settings = db.prepare("SELECT * FROM user_settings").all();
console.log(`已备份 ${settings.length} 条设置`);

// Wipe all tables
db.exec("PRAGMA foreign_keys = OFF");
const tables = [
  "tasks",
  "milestones",
  "achievements",
  "daily_summaries",
  "conversations",
  "chat_messages",
  "projects",
];
for (const t of tables) {
  const { c } = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
  db.prepare(`DELETE FROM ${t}`).run();
  console.log(`已清空 ${t} (${c} 行)`);
}
db.exec("PRAGMA foreign_keys = ON");

// Ensure inbox project exists
db.prepare("INSERT OR IGNORE INTO projects (id, name, description, color, status) VALUES (?,?,?,?,?)").run(
  "inbox", "📥 收件箱", "未分类的任务", "#6B7280", "active"
);
console.log("已创建收件箱项目");

// Restore settings
const ins = db.prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)");
for (const s of settings) ins.run(s.key, s.value);
console.log(`已恢复 ${settings.length} 条设置`);

// Verify
console.log("\n--- 最终状态 ---");
for (const t of tables) {
  const { c } = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
  console.log(`${t}: ${c} 行`);
}
const s = db.prepare("SELECT * FROM user_settings").all();
console.log(`user_settings: ${s.length} 条`);
for (const r of s) {
  console.log(`  ${r.key}: ${r.key === "geminiApiKey" ? "***" + r.value.slice(-4) : r.value}`);
}

db.close();
console.log("\n✅ 数据库已清空，可开始使用");
