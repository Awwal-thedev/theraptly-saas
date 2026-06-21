"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

export function VideoPlayer({
  src,
  poster,
  className,
}: {
  src: string
  poster: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function start() {
    setPlaying(true)
    // play after the controls render
    requestAnimationFrame(() => ref.current?.play())
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        src={src}
        poster={poster}
        controls={playing}
        preload="metadata"
        className="size-full object-cover"
        onPlay={() => setPlaying(true)}
      />
      {!playing && (
        <button
          type="button"
          onClick={start}
          aria-label="Play preview"
          className="absolute inset-0 grid place-items-center"
        >
          <Image
            src={poster}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 760px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          <span className="relative grid size-16 place-items-center rounded-full bg-white/90 text-[#101828] shadow-lg transition-transform hover:scale-105">
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  )
}
