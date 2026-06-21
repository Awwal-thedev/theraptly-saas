// Auth pages render their own full-bleed layout via <AuthShell>.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
