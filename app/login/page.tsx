import { safeReturnPath } from "@/lib/operator";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">운영자 로그인</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        투표는 운영자만 만들 수 있습니다. 운영자 비밀번호를 입력해 주세요.
      </p>
      <LoginForm returnPath={safeReturnPath(next)} />
    </div>
  );
}
