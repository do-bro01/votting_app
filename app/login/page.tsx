import { safeReturnPath } from "@/lib/member-session";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">투표 앱</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        비밀번호를 입력해야 들어갈 수 있습니다.
      </p>
      <LoginForm returnPath={safeReturnPath(next)} />
    </div>
  );
}
