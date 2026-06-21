"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { signUpSchema, type SignUpValues } from "@/lib/validations"
import type { UserRole } from "@/lib/auth/types"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const roles: { value: UserRole; label: string; hint: string }[] = [
  { value: "admin", label: "Admin", hint: "Set up the org & programs" },
  { value: "manager", label: "Manager", hint: "Assign & track a team" },
  { value: "staff", label: "Staff", hint: "Complete assigned training" },
]

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "admin" },
  })

  async function onSubmit(values: SignUpValues) {
    try {
      const user = await signUp(values)
      toast.success("Account created — let's set up your organization")
      // Admins go through org onboarding; staff land straight in the app.
      router.replace(user.role === "staff" ? "/dashboard" : "/onboarding")
    } catch {
      toast.error("Could not create your account. Please try again.")
    }
  }

  const loading = form.formState.isSubmitting
  const selectedRole = form.watch("role")

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start training and tracking your healthcare team in minutes.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Jordan Avery"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourclinic.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>I&apos;m joining as</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => {
                    const active = selectedRole === role.value
                    return (
                      <button
                        type="button"
                        key={role.value}
                        onClick={() => field.onChange(role.value)}
                        className={cn(
                          "relative rounded-lg border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-accent/60 ring-1 ring-primary"
                            : "border-input hover:bg-accent/40"
                        )}
                      >
                        {active && (
                          <Check className="absolute right-2 top-2 size-3.5 text-primary" />
                        )}
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {role.hint}
                        </p>
                      </button>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
