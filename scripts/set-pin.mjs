#!/usr/bin/env node
// 부모/관리자용: 사용자 PIN 지정 (service role 사용, 서버/박스에서만 실행)
// 사용: node scripts/set-pin.mjs   → 이름과 PIN을 물어봐요(PIN은 화면에 보이지 않음)
// 필요: .env.local 또는 환경변수에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import crypto from "node:crypto";
import fs from "node:fs";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = { ...process.env };
  if (fs.existsSync(".env.local")) {
    for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else if (s.includes("\n") || s.includes("\r")) rl.output.write("\n");
        else rl.output.write("*");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요해요.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const name = process.argv[2] || (await ask("이름: "));
const { data: user, error } = await db.from("users").select("id, name").eq("name", name).maybeSingle();
if (error || !user) {
  console.error("사용자를 찾지 못했어요:", error?.message ?? name);
  process.exit(1);
}
const pin = await ask("새 PIN (4~64자): ", true);
const again = await ask("한 번 더: ", true);
if (pin !== again) {
  console.error("두 PIN이 달라요.");
  process.exit(1);
}
if (pin.length < 4 || pin.length > 64) {
  console.error("PIN은 4~64자여야 해요.");
  process.exit(1);
}
const { error: upErr } = await db.from("user_pins").upsert(
  { user_id: user.id, pin_hash: hashPin(pin), failed_count: 0, locked_until: null, must_change: false, updated_at: new Date().toISOString() },
  { onConflict: "user_id" }
);
if (upErr) {
  console.error("저장 실패:", upErr.message);
  process.exit(1);
}
console.log(`${user.name} 의 PIN을 저장했어요. 기존 로그인은 모두 끊겨요.`);
