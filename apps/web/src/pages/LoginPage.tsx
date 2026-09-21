import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
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
    <main className="min-h-screen bg-[var(--surface)] lg:grid lg:grid-cols-[minmax(25rem,0.9fr)_1.1fr]">
      <section className="relative overflow-hidden bg-[var(--brand-red)] text-white lg:min-h-screen">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full border-[44px] border-[var(--brand-gold)]/20" />
        <div className="absolute -bottom-36 -right-28 h-96 w-96 rounded-full border-[58px] border-white/8" />
        <div className="relative z-10 flex flex-col p-5 sm:p-8 lg:h-full lg:p-14 xl:p-18">
          <div className="inline-flex items-center gap-3">
            <img
              className="h-13 w-13 rounded-full border-2 border-[var(--brand-gold)] bg-white object-cover shadow-lg"
              src="/icon.jpg"
              alt="Ann Htike logo"
            />
            <div>
              <p className="font-[family-name:var(--font-heading)] text-xl font-bold leading-none sm:text-2xl">Ann Htike</p>
              <p className="mt-1 text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-[#ffe4a0]">
                Restaurant management
              </p>
            </div>
          </div>
          <div className="hidden max-w-xl py-16 lg:my-auto lg:block lg:py-10">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffe4a0]">
              One clear workspace
            </p>
            <h1 className="max-w-[11ch] font-[family-name:var(--font-heading)] text-5xl font-bold leading-[1.02] tracking-tight xl:text-6xl">
              Keep your restaurant team connected.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
              Manage people, branches, and access for Ann Htike from one simple place.
            </p>
            <div className="mt-9 space-y-3 text-sm font-semibold text-white/85">
              {["Clear role-based access", "Simple branch management", "Built for daily restaurant work"].map(
                (item) => (
                  <div className="flex items-center gap-3" key={item}>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-gold)] text-[#3b2a06]">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
          <p className="mt-8 hidden text-xs tracking-wide text-white/55 lg:block">
            Ann Htike · Restaurant operations
          </p>
        </div>
      </section>

      <section className="grid place-items-center px-5 py-8 sm:px-10 sm:py-10 lg:px-16">
        <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-9">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-red)]">
              Welcome back
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight tracking-tight text-[var(--ink)]">
              Sign in to Ann Htike
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Use your staff account to continue to the restaurant workspace.
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-red)]"
                    size={17}
                    aria-hidden="true"
                  />
                  <input
                    className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white py-3 pl-12 pr-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[#a8a0a1] focus:border-[var(--brand-red)] focus:ring-4 focus:ring-[var(--brand-red-soft)]"
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@annhtike.com"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="m-0 text-xs font-semibold text-[var(--danger)]">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-red)]"
                    size={17}
                    aria-hidden="true"
                  />
                  <input
                    className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white py-3 pl-12 pr-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[#a8a0a1] focus:border-[var(--brand-red)] focus:ring-4 focus:ring-[var(--brand-red-soft)]"
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="m-0 text-xs font-semibold text-[var(--danger)]">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                className="mt-1 w-full"
                type="submit"
                size="lg"
                isLoading={login.isPending}
                loadingLabel="Signing in..."
              >
                Continue <ArrowRight size={17} />
              </Button>
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
