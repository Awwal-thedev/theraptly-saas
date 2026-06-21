"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Check, Loader2, Mail, Square, UserRound } from "lucide-react"
import { toast } from "sonner"

import { signUpSchema, passwordRules, type SignUpValues } from "@/lib/validations"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { AuthShell } from "@/components/auth/auth-shell"
import {
  AuthDivider,
  AuthField,
  AuthHeader,
  MicrosoftButton,
  PasswordField,
} from "@/components/auth/auth-ui"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

type RoleChoice = "admin" | "staff"

const ROLES: { id: RoleChoice; label: string; Icon: React.ElementType }[] = [
  { id: "admin", label: "Health Service Provider (Admin)", Icon: Building2 },
  { id: "staff", label: "Worker", Icon: UserRound },
]

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<0 | 1>(0)
  const [role, setRole] = useState<RoleChoice>("admin")
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form

  const password = watch("password") ?? ""

  function onDetailsSubmit() {
    setStep(1)
  }

  async function finishSignUp() {
    const values = form.getValues()
    setSubmitting(true)
    try {
      const { needsVerification } = await signUp({
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        password: values.password,
        role,
      })
      if (needsVerification) {
        toast.success("Account created — check your email for a code")
        router.replace("/verify-email")
      } else {
        toast.success("Account created!")
        router.replace("/onboarding/role")
      }
    } catch {
      toast.error("Could not create your account. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      {step === 0 ? (
        /* ── Step 0: Account details ── */
        <form
          onSubmit={handleSubmit(onDetailsSubmit)}
          className="flex flex-col gap-10"
          noValidate
        >
          <AuthHeader
            title="Create a new account"
            subtitle="Create a new account to get started."
          />

          <div className="flex flex-col gap-9">
            <MicrosoftButton>Sign Up with Microsoft</MicrosoftButton>
            <AuthDivider>or continue with email</AuthDivider>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                {/* Names */}
                <div className="flex flex-col gap-5 sm:flex-row sm:gap-4">
                  <AuthField
                    id="firstName"
                    label="First Name"
                    autoComplete="given-name"
                    placeholder="Enter your first name"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />
                  <AuthField
                    id="lastName"
                    label="Last Name"
                    autoComplete="family-name"
                    placeholder="Enter your last name"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                </div>

                <AuthField
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  icon={<Mail className="size-5 shrink-0 text-muted-foreground" />}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <PasswordField
                  id="password"
                  label="Create Password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  {...register("password")}
                />

                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                {/* Password requirements */}
                <ul className="flex flex-col gap-[9px]">
                  {passwordRules.map((rule) => {
                    const met = rule.test(password)
                    return (
                      <li key={rule.id} className="flex items-center gap-[9px]">
                        {met ? (
                          <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-success text-white">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        ) : (
                          <Square className="size-5 shrink-0 text-muted-foreground/50" />
                        )}
                        <span
                          className={cn(
                            "text-[15px]",
                            met ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {rule.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Terms */}
              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-1.5">
                  <Controller
                    control={control}
                    name="terms"
                    render={({ field }) => (
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 size-5"
                      />
                    )}
                  />
                  <label
                    htmlFor="terms"
                    className="text-[15px] font-medium leading-5 text-foreground"
                  >
                    Yes, I understand and agree to the{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Theraptly Terms of Service
                    </Link>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive">
                    {errors.terms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="h-[60px] w-full rounded-xl text-[15px] font-semibold hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3] disabled:opacity-100"
              >
                Continue
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1">
            <span className="text-[15px] font-medium text-foreground">
              Already have an account?
            </span>
            <Link
              href="/login"
              className="px-0.5 py-1.5 text-[15px] font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </div>
        </form>
      ) : (
        /* ── Step 1: Role selection ── */
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <Logo />
            <div className="flex flex-col gap-1 px-1">
              <h1 className="font-display text-[26px] font-semibold leading-8 text-[#202020]">
                Tell us about your role
              </h1>
              <p className="text-base text-[#475467]">
                Choose the option that best describes how you wish to use
                Theraptly.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
              {ROLES.map(({ id, label, Icon }) => {
                const active = role === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-[14px] px-7 py-9 text-left shadow-[0_3.4px_6.9px_rgba(41,82,225,0.15)] transition-all",
                      active
                        ? "border-[1.7px] border-[#496ef1] bg-[#f3f8ff]"
                        : "border border-transparent bg-white"
                    )}
                  >
                    <div className="flex h-24 flex-col justify-between">
                      <Icon
                        className={cn(
                          "size-10",
                          active ? "text-[#2952e1]" : "text-[#2c2c2c]"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xl font-semibold leading-[30px]",
                          active ? "text-[#2952e1]" : "text-[#2c2c2c]"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {/* Radio */}
                    <div
                      className={cn(
                        "mt-1 flex size-[22px] shrink-0 items-center justify-center rounded-xl border-[1.8px] transition-colors",
                        active ? "border-[#2952e1]" : "border-black/40"
                      )}
                    >
                      {active && (
                        <div className="size-[13px] rounded-full bg-[#2952e1]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex w-full items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={submitting}
                className="h-12 flex-1 rounded-xl border border-[#e4e7ec] text-[15px] font-semibold text-[#475367] transition-colors hover:bg-[#f9fafb] disabled:opacity-50"
              >
                Back
              </button>
              <Button
                type="button"
                onClick={finishSignUp}
                disabled={submitting}
                className="h-12 flex-1 rounded-xl text-base font-semibold hover:bg-brand-hover"
              >
                {submitting && <Loader2 className="animate-spin" />}
                {submitting ? "Creating account…" : "Create Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
