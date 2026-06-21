import { LogoMark } from "@/components/brand/logo"

/** Full-screen branded loading state used while resolving the session. */
export function Splash({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <LogoMark className="size-12 rounded-2xl" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
