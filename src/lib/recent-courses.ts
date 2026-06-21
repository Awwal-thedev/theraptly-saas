const KEY = "theraptly:recent-courses"

// Records when a course was last opened or modified, so the Courses list can
// surface recently-touched courses at the top.
export function recordCourseActivity(id: string) {
  if (typeof window === "undefined") return
  try {
    const map = JSON.parse(localStorage.getItem(KEY) || "{}")
    map[id] = Date.now()
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}

export function getRecentMap(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}
