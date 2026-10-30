"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { NavArrowDown } from "iconoir-react";
import { Eye, EyeClosed } from "iconoir-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useF, useI18n } from "@/i18n/client";
import { DiscordButton } from "./Discord";
import { RobloxButton } from "./Roblox";
import type { Providers } from "@/lib/server-api";
import { api, errorMessage, fieldErrors } from "@/lib/api";

export function AuthForm({ mode, providers }: { mode: "login" | "register"; providers: Providers }) {
  const roblox = providers.roblox;
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const f = useF();
  // Galat dari callback OAuth Roblox (?error=KODE)
  const oauthError = params.get("error");
  const [error, setError] = useState<string | null>(oauthError ? (t.errors[oauthError] ?? oauthError) : null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await api(`/auth/${mode}`, {
        method: "POST",
        body: isLogin
          ? { email: form.get("email"), password: form.get("password") }
          : { name: form.get("name"), email: form.get("email"), password: form.get("password"), locale },
      });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, t.errors));
      setFields(fieldErrors(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-6">
      <Image src="/brand/logo-full.webp" alt="ARRR Studio DataBridge" width={900} height={511} priority sizes="224px" className="mx-auto h-auto w-56" />
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[1.15] tracking-display">{isLogin ? t.auth.loginTitle : t.auth.registerTitle}</h1>
        <p className="text-body-sm text-fg-2">{isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}</p>
      </div>
      <Card className="p-6">
        {roblox && (
          <>
            <RobloxButton
              href={`/api/v1/auth/roblox/start?intent=login${params.get("next") ? `&next=${encodeURIComponent(params.get("next")!)}` : ""}`}
              label={f.roblox.signIn}
              className="w-full"
            />
            <div className="my-5 flex items-center gap-3 text-caption text-fg-3" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />
              {f.roblox.or}
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-md border border-danger-edge bg-danger-bg px-3 py-2 text-body-sm text-danger">
            {error}
          </p>
        )}
        {/* User: Discord. Form email hanya untuk admin (dilipat) kecuali signup email diaktifkan */}
        {!providers.emailSignup && (
          <div className="flex flex-col gap-3">
            {providers.discord ? (
              <DiscordButton next={params.get("next")} label={isLogin ? f.discord.signIn : f.discord.signUp} className="w-full" />
            ) : (
              <p className="text-body-sm text-fg-2">{t.errors.DISCORD_DISABLED}</p>
            )}
            <p className="text-center text-caption text-fg-3">{f.discord.loginBody}</p>
          </div>
        )}
        {(providers.emailSignup || isLogin) && (
        <details className="group mt-5 border-t border-line pt-4" open={providers.emailSignup || undefined}>
          {!providers.emailSignup && (
            <summary className="flex cursor-pointer list-none items-center justify-between text-caption font-medium text-fg-3 hover:text-fg [&::-webkit-details-marker]:hidden">
              {f.discord.adminToggle}
              <NavArrowDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
          )}
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          {!isLogin && (
            <Field label={t.auth.name} error={fields.name}>
              {(id, d) => <Input id={id} name="name" autoComplete="name" required maxLength={80} aria-describedby={d} aria-invalid={!!fields.name} />}
            </Field>
          )}
          <Field label={t.auth.email} error={fields.email}>
            {(id, d) => <Input id={id} name="email" type="email" autoComplete="email" required aria-describedby={d} aria-invalid={!!fields.email} />}
          </Field>
          <Field label={t.auth.password} hint={isLogin ? undefined : t.auth.passwordHint} error={fields.password}>
            {(id, d) => (
              <div className="relative">
                <Input
                  id={id}
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="pr-11"
                  aria-describedby={d}
                  aria-invalid={!!fields.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t.common.hide : t.common.show}
                  aria-pressed={showPw}
                  className="absolute right-1 top-1 grid size-8 place-items-center rounded-md text-fg-3 hover:text-fg"
                >
                  {showPw ? <EyeClosed className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            )}
          </Field>
          <Button type="submit" variant="primary" loading={busy} className="mt-2 w-full">
            {isLogin ? (busy ? t.auth.signingIn : t.auth.signIn) : busy ? t.auth.signingUp : t.auth.signUp}
          </Button>
        </form>
        </details>
        )}
      </Card>
      {providers.emailSignup && (
      <p className="text-center text-body-sm text-fg-2">
        {isLogin ? t.auth.noAccount : t.auth.haveAccount}{" "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-link hover:underline">
          {isLogin ? t.auth.toRegister : t.auth.toLogin}
        </Link>
      </p>
      )}
    </div>
  );
}
