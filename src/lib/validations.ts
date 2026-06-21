import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

/** Live password requirements, mirrored in the signup checklist UI. */
export const passwordRules: { id: string; label: string; test: (v: string) => boolean }[] = [
  { id: "length", label: "At least 12 characters", test: (v) => v.length >= 12 },
  { id: "upper", label: "At least one uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "At least one lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "At least one number", test: (v) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "At least one special character (!@#$...)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
]

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .refine(
        (v) => passwordRules.every((r) => r.test(v)),
        "Password does not meet all requirements"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the Terms of Service",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
})

export const orgProfileSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  type: z.enum([
    "hospital",
    "clinic",
    "long_term_care",
    "home_health",
    "behavioral_health",
    "other",
  ]),
})

export const orgScaleSchema = z.object({
  teamSize: z.string().min(1, "Select your team size"),
  frameworks: z.array(z.string()).min(1, "Select at least one framework"),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type OrgProfileValues = z.infer<typeof orgProfileSchema>
export type OrgScaleValues = z.infer<typeof orgScaleSchema>
