// SQL 파일을 .env.local의 DATABASE_URL DB에 실행한다. 사용법: node --env-file=.env.local scripts/apply-sql.mjs db/schema.sql
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) throw new Error("실행할 SQL 파일 경로를 넘겨 주세요.");

const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(file, "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}
console.log(`${file}: ${statements.length}개 문장 실행 완료`);
