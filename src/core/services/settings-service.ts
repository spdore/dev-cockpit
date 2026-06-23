/**
 * User settings business logic service.
 * Handles encryption/decryption of sensitive values like API keys.
 */

import type { SettingsRepository } from "@/core/repositories/settings-repository";

/** Simple XOR-based obfuscation for API keys (not cryptographic — just prevents plain-text storage). */
const CIPHER_KEY = "devcockpit-k3y";

function encrypt(plain: string): string {
  let result = "";
  for (let i = 0; i < plain.length; i++) {
    result += String.fromCharCode(plain.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
  }
  return Buffer.from(result, "utf-8").toString("base64");
}

function decrypt(encoded: string): string {
  try {
    const text = Buffer.from(encoded, "base64").toString("utf-8");
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
    }
    return result;
  } catch {
    return encoded; // fallback: return as-is for plaintext values
  }
}

export class SettingsService {
  constructor(private readonly settingsRepo: SettingsRepository) {}

  /** Setting keys that contain sensitive API keys. */
  private readonly API_KEY_KEYS = ["geminiApiKey", "openaiApiKey", "claudeApiKey", "deepseekApiKey", "qwenApiKey"];

  /** Get all settings, decrypting sensitive values. */
  getAllSettings(): Record<string, string> {
    const raw = this.settingsRepo.findAll();
    for (const key of this.API_KEY_KEYS) {
      if (raw[key]) raw[key] = decrypt(raw[key]);
    }
    return raw;
  }

  /** Persist settings, encrypting sensitive values. */
  saveSettings(settings: Record<string, string>): void {
    const toSave = { ...settings };
    for (const key of this.API_KEY_KEYS) {
      if (toSave[key]) toSave[key] = encrypt(toSave[key]);
    }
    this.settingsRepo.saveBatch(toSave);
  }
}
