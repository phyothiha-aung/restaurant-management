import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail, UtensilsCrossed } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useLogin } from "../features/auth/auth-services";
import { LoginSchema, type LoginType } from "../lib/validations/login-schema";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginType) => {
    login.mutate(values, { onSuccess: () => navigate("/") });
  };

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden bg-[#283b37] text-[#f9f5ec] before:absolute before:-right-72 before:-bottom-60 before:h-[42rem] before:w-[42rem] before:rounded-full before:border before:border-[#ebb36f]/30 after:absolute after:-right-24 after:-bottom-24 after:h-96 after:w-96 after:rounded-full after:border after:border-[#ebb36f]/30">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(249,245,236,0.18)_0.7px,transparent_0.7px)] [background-size:5px_5px]" />
        <div className="relative z-10 flex min-h-full flex-col p-6 sm:p-10 lg:p-20">
          <div className="inline-flex items-center gap-3 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl rounded-bl-sm bg-[#ebba79] text-[#283b37]">
              <UtensilsCrossed size={21} />
            </div>
            <span>mise</span>
          </div>
          <div className="my-auto max-w-lg py-16 lg:py-0">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ebba79]">
              Restaurant operations
            </p>
            <h1 className="max-w-[10ch] font-[family-name:var(--font-heading)] text-6xl font-bold leading-[0.94] tracking-tight sm:text-7xl lg:text-[7rem]">
              Keep the floor moving.
            </h1>
            <p className="mt-8 max-w-md text-base text-[#f9f5ec]/75">
              One calm place for the people, places, and details behind every
              memorable service.
            </p>
          </div>
          <p className="text-xs tracking-wide text-[#f9f5ec]/60">
            Built for the rhythm of hospitality.
          </p>
        </div>
      </section>

      <section className="grid place-items-center bg-[var(--surface)] px-5 py-10 sm:px-10 lg:px-20">
        <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[#fffdfa]/70 p-6 shadow-[0_20px_60px_rgba(40,59,55,0.08)] sm:p-9">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Welcome back
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-none tracking-tight text-[var(--ink)]">
              Sign in to your workspace
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Access your restaurant operations dashboard.
            </p>
          </div>
          <div className="mt-8">
            <form
              className="grid gap-5"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <div className="grid gap-2">
                <label
                  className="text-xs font-bold text-[var(--ink)]"
                  htmlFor="email"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    size={17}
                    aria-hidden="true"
                  />
                  <input
                    className="min-h-13 w-full rounded-[0.65rem] border border-[var(--line)] bg-[#fffdfa] py-3 pl-12 pr-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent-strong)] focus:ring-4 focus:ring-[rgba(193,102,65,0.13)]"
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@restaurant.com"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="m-0 text-xs text-[#b7473f]">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label
                  className="text-xs font-bold text-[var(--ink)]"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    size={17}
                    aria-hidden="true"
                  />
                  <input
                    className="min-h-13 w-full rounded-[0.65rem] border border-[var(--line)] bg-[#fffdfa] py-3 pl-12 pr-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent-strong)] focus:ring-4 focus:ring-[rgba(193,102,65,0.13)]"
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="m-0 text-xs text-[#b7473f]">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[0.65rem] bg-[var(--accent-strong)] px-4 py-3 text-sm font-bold text-[#fffaf3] transition hover:-translate-y-px hover:bg-[#aa5336] focus-visible:outline-3 focus-visible:outline-[rgba(193,102,65,0.28)] focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
                type="submit"
                disabled={login.isPending}
              >
                {login.isPending ? "Signing in..." : "Continue"}
                {!login.isPending && <ArrowRight size={17} />}
              </button>
            </form>
            <p className="mt-6 text-center text-xs leading-relaxed text-[var(--muted)]">
              Need access? Contact your restaurant administrator.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
