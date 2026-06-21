"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"

import { cn } from "@/lib/utils"

export interface AuthSlide {
  image: string
  title: string
  description: string
}

/** The four Theraptly onboarding slides (from Figma). */
export const defaultAuthSlides: AuthSlide[] = [
  {
    image: "/auth/showcase-1.jpg",
    title: "Audit-ready training, built from your policies",
    description:
      "Turn compliance policies into structured training, track completion automatically, and keep clear records that stand up during audits.",
  },
  {
    image: "/auth/showcase-2.jpg",
    title: "Track learning progress with full visibility",
    description:
      "Monitor course completion, quiz performance, and deadlines across your team in one place, with clear insights into who needs attention.",
  },
  {
    image: "/auth/showcase-3.png",
    title: "Stay ready for audits at all times",
    description:
      "Automatically generate structured records of training, performance, and compliance that are ready to present whenever audits arise.",
  },
  {
    image: "/auth/showcase-4.jpg",
    title: "Validate understanding, not just completion",
    description:
      "Use quizzes and certificates to confirm that staff don’t just finish training, but truly understand and acknowledge their responsibilities.",
  },
]

function ProgressDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex items-center gap-[5px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full bg-white transition-all duration-500",
            i === active ? "w-10" : "w-4 opacity-40"
          )}
        />
      ))}
    </div>
  )
}

export function AuthShowcase({
  slides = defaultAuthSlides,
  className,
}: {
  slides?: AuthSlide[]
  className?: string
}) {
  const [active, setActive] = useState(0)
  const [scrollable, setScrollable] = useState(false)
  const n = slides.length

  // Scroll-linked: map whole-page scroll progress (0→1) onto the slide index.
  const { scrollYProgress } = useScroll()

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!scrollable || n <= 1) return
    setActive(Math.min(n - 1, Math.max(0, Math.round(p * (n - 1)))))
  })

  // Detect whether the page actually scrolls; if not (short pages like login),
  // fall back to a timed auto-advance so the showcase still animates.
  useEffect(() => {
    const root = document.scrollingElement || document.documentElement
    const check = () => setScrollable(root.scrollHeight - root.clientHeight > 80)
    check()
    window.addEventListener("resize", check)
    const t = setTimeout(check, 600) // re-check after images/layout settle
    return () => {
      window.removeEventListener("resize", check)
      clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (scrollable || n <= 1) return
    const interval = setInterval(() => setActive((a) => (a + 1) % n), 4000)
    return () => clearInterval(interval)
  }, [scrollable, n])

  return (
    <div className={cn("overflow-hidden rounded-[20px]", className)}>
      <div className="relative h-full w-full bg-black">
      {slides.map((s, i) => (
        <Image
          key={s.image}
          src={s.image}
          alt=""
          fill
          priority={i === 0}
          sizes="(max-width: 1024px) 0px, 50vw"
          className={cn(
            "object-cover transition-opacity duration-1000 ease-out",
            i === active ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      {/* bottom-anchored dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[45%] to-[#101010]" />

      <div className="absolute inset-x-0 bottom-0 p-[61px] pb-[69px]">
        <div className="flex max-w-[583px] flex-col gap-9 text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              <h2 className="font-display text-[36px] font-semibold leading-[40px]">
                {slides[active].title}
              </h2>
              <p className="font-display text-xl font-normal leading-[26px] text-white/90">
                {slides[active].description}
              </p>
            </motion.div>
          </AnimatePresence>
          <ProgressDots active={active} total={n} />
        </div>
      </div>
      </div>
    </div>
  )
}

interface AuthShellProps {
  children: React.ReactNode
  slides?: AuthSlide[]
}

/** Two-column auth layout: equal-width form card (left) and image showcase (right). */
export function AuthShell({ children, slides }: AuthShellProps) {
  return (
    <div className="grid min-h-svh grid-cols-1 gap-4 bg-background p-3 sm:p-4 lg:grid-cols-2">
      <div className="flex flex-col justify-center rounded-[20px] bg-card px-5 py-10 sm:px-10 sm:py-12 lg:px-16 xl:px-20 2xl:px-24">
        <div className="mx-auto w-full max-w-[620px]">{children}</div>
      </div>
      <div className="hidden lg:block">
        <AuthShowcase
          slides={slides}
          className="sticky top-4 h-[calc(100svh_-_2rem)]"
        />
      </div>
    </div>
  )
}
