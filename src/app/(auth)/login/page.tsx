"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import { signInSchema, type SignInValues } from "@/lib/validations"
import { useAuth } from "@/lib/auth/auth-context"
import { AuthShell } from "@/components/auth/auth-shell"
import {
  AuthDivider,
  AuthField,
  AuthHeader,
  MicrosoftButton,
  PasswordField,
} from "@/components/auth/auth-ui"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form

  async function onSubmit(values: SignInValues) {
    try {
      const user = await signIn(values)
      toast.success("Welcome back to Theraptly")
      router.replace(user.onboarded ? "/dashboard" : "/onboarding")
    } catch {
      toast.error("Could not sign you in. Please try again.")
    }
  }

  return (
    <AuthShell>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-10"
        noValidate
      >
        <AuthHeader
          title="Log in to your account"
          subtitle="Log in to your workspace and get back to what matters."
        />

        <div className="flex flex-col gap-9">
          <MicrosoftButton>Log In with Microsoft</MicrosoftButton>
          <AuthDivider>or continue with email</AuthDivider>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-end gap-5">
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
                label="Password"
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register("password")}
              />

              <Link
                href="/forgot-password"
                className="px-0.5 py-1.5 text-[15px] font-semibold text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="h-[60px] w-full rounded-xl text-[15px] font-semibold hover:bg-brand-hover disabled:bg-[#e4e7ec] disabled:text-[#98a2b3] disabled:opacity-100"
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1">
          <span className="text-[15px] font-medium text-foreground">
            Don&apos;t have an account?
          </span>
          <Link
            href="/signup"
            className="px-0.5 py-1.5 text-[15px] font-semibold text-primary hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
