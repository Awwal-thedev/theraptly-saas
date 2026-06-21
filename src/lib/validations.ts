import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export const signUpSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  role: z.enum(["admin", "manager", "staff"]),
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
