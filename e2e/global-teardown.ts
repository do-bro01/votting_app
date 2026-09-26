import { db, TEST_PREFIX } from "./support";

export default async function globalTeardown() {
  const sql = db();
  // 선택지는 on delete cascade로 함께 지워진다.
  await sql`delete from polls where question like ${TEST_PREFIX + " %"}`;
}
