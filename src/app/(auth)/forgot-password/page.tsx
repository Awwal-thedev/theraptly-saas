"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"

import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthHeader } from "@/components/auth/auth-ui"
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

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    await new Promise((r) => setTimeout(r, 700))
    setSentTo(values.email)
  }

  if (sentTo) {
    return (
      <AuthShell>
        <div className="space-y-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
            <MailCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-[28px] font-semibold leading-9 text-[#202020] sm:text-[32px] sm:leading-[40px]">
              Check your inbox
            </h1>
            <p className="text-base text-muted-foreground sm:text-[17px]">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{sentTo}</span>,
              we&apos;ve sent a link to reset your password.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-[60px] w-full rounded-xl text-[15px]"
            render={
              <Link href="/login">
                <ArrowLeft /> Back to sign in
              </Link>
            }
          />
        </div>
      </AuthShell>
    )
  }

  const loading = form.formState.isSubmitting

  return (
    <AuthShell>
      <div className="space-y-8">
        <AuthHeader
          title="Reset your password"
          subtitle="Enter your work email and we'll send you a reset link."
        />

        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[15px]">Work email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourclinic.com"
                    className="h-[60px] rounded-xl px-4 text-[15px] md:text-[15px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="h-[60px] w-full rounded-xl text-[15px] font-semibold hover:bg-brand-hover"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-[15px] text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Back to sign in
        </Link>
      </p>
      </div>
    </AuthShell>
  )
}
