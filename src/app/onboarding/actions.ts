"use server"

import { createClient } from "@/lib/supabase/server"
import type { Organization } from "@/lib/auth/types"

/**
 * Marks a worker as onboarded without creating an organisation.
 * Workers belong to an org managed by an admin; they don't set one up themselves.
 */
export async function completeWorkerOnboardingAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("profiles")
    .update({ role: "staff", onboarded: true })
    .eq("id", user.id)
  if (error) throw new Error(error.message)
}

/**
 * Persists the onboarding result for the authenticated user:
 *  - creates the organization (owned by the user)
 *  - links it on the user's profile and marks them onboarded
 *  - records any pending team invites
 *
 * RLS guarantees a user can only write their own rows.
 */
export async function completeOnboardingAction(input: {
  organization: Organization
  invites: string[]
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: input.organization.name,
      type: input.organization.type,
      team_size: input.organization.teamSize,
      frameworks: input.organization.frameworks,
      owner_id: user.id,
    })
    .select("id")
    .single()
  if (orgError) throw new Error(orgError.message)

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: org.id, onboarded: true })
    .eq("id", user.id)
  if (profileError) throw new Error(profileError.message)

  const invites = input.invites
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (invites.length > 0) {
    const { error: inviteError } = await supabase
      .from("organization_invites")
      .insert(
        invites.map((email) => ({
          organization_id: org.id,
          email,
          invited_by: user.id,
        }))
      )
    if (inviteError) throw new Error(inviteError.message)
  }
}
