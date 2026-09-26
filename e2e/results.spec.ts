import { expect, test, type Page } from "@playwright/test";
import { createPollViaApi, db, testQuestion } from "./support";

// 표 던지기(03) 없이 결과 화면을 검증하기 위해 득표수를 DB에 직접 넣는다.
async function setVotes(pollId: string, votes: number[]) {
  const sql = db();
  for (const [index, count] of votes.entries()) {
    await sql`update options set vote_count = ${count} where poll_id = ${pollId} and position = ${index + 1}`;
  }
}

// 각 막대가 트랙에서 차지하는 비율(%)을 화면에서 실제로 잰다.
async function barPercents(page: Page): Promise<number[]> {
  const tracks = page.getByTestId("result-track");
  const count = await tracks.count();
  const percents: number[] = [];
  for (let i = 0; i < count; i++) {
    const track = tracks.nth(i);
    const trackBox = await track.boundingBox();
    const barBox = await track.getByTestId("result-bar").boundingBox();
    percents.push(Math.round(((barBox?.width ?? 0) / trackBox!.width) * 100));
  }
  return percents;
}

test.describe("결과 보기", () => {
  test("표가 없는 투표는 모든 선택지가 0표·0%이고 안내 문구가 보인다", async ({ page, request }) => {
    const question = testQuestion("결과 0표");
    const id = await createPollViaApi(request, question, ["치킨", "피자", "짜장면"]);

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
    await expect(page.getByText("아직 표가 없습니다")).toBeVisible();
    await expect(page.getByTestId("result-label")).toHaveText(["치킨", "피자", "짜장면"]);
    await expect(page.getByTestId("result-votes")).toHaveText(["0표", "0표", "0표"]);
    await expect(page.getByTestId("result-percent")).toHaveText(["0%", "0%", "0%"]);
    await expect(page.getByTestId("total-votes")).toHaveText("전체 0표");
  });

  test("득표수와 정수로 반올림한 퍼센트, 전체 표 수가 보인다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("결과 퍼센트"), ["가", "나", "다"]);
    await setVotes(id, [1, 2, 0]);

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByTestId("result-votes")).toHaveText(["1표", "2표", "0표"]);
    await expect(page.getByTestId("result-percent")).toHaveText(["33%", "67%", "0%"]);
    await expect(page.getByTestId("total-votes")).toHaveText("전체 3표");
    await expect(page.getByText("아직 표가 없습니다")).toHaveCount(0);
  });

  test("결과 화면과 투표하기 화면, 목록 사이를 오갈 수 있다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("결과 링크"), ["가", "나"]);

    await page.goto(`/polls/${id}`);
    await page.getByRole("link", { name: "결과 보기" }).click();
    await expect(page).toHaveURL(new RegExp(`/polls/${id}/results$`));

    await page.getByRole("link", { name: "투표하러 가기" }).click();
    await expect(page).toHaveURL(new RegExp(`/polls/${id}$`));

    await page.goto(`/polls/${id}/results`);
    await page.getByRole("link", { name: "목록으로" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("없는 투표의 결과 화면은 '투표를 찾을 수 없습니다'", async ({ page }) => {
    await page.goto(`/polls/${crypto.randomUUID()}/results`);
    await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
    await page.goto("/polls/not-a-uuid/results");
    await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
  });

  test("그래프: 막대 길이가 선택지별 퍼센트와 같다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("그래프 퍼센트"), ["가", "나", "다"]);
    await setVotes(id, [1, 2, 0]);

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByTestId("result-track")).toHaveCount(3);
    expect(await barPercents(page)).toEqual([33, 67, 0]);
  });

  test("그래프: 표가 0개여도 깨지지 않고 모든 막대가 0이다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("그래프 0표"), ["가", "나"]);

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByText("아직 표가 없습니다")).toBeVisible();
    await expect(page.getByTestId("result-track")).toHaveCount(2);
    expect(await barPercents(page)).toEqual([0, 0]);
  });

  test("그래프: 동률인 선택지의 막대 길이가 같다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("그래프 동률"), ["가", "나", "다"]);
    await setVotes(id, [2, 2, 1]);

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByTestId("result-track")).toHaveCount(3);
    const [a, b, c] = await barPercents(page);
    expect(a).toBe(b);
    expect(a).toBe(40);
    expect(c).toBe(20);
  });

  test("그래프: 막대는 장식이고 결과는 텍스트로 읽힌다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("그래프 접근성"), ["가", "나"]);
    await setVotes(id, [1, 0]);

    await page.goto(`/polls/${id}/results`);
    for (const track of await page.getByTestId("result-track").all()) {
      await expect(track).toHaveAttribute("aria-hidden", "true");
    }
    await expect(page.getByTestId("result-label")).toHaveText(["가", "나"]);
    await expect(page.getByTestId("result-percent")).toHaveText(["100%", "0%"]);
  });
});
