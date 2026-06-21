export type Course = {
  id: string
  name: string
  type: string
  assigned: number
  completion: string
  date: string
  status: "Active" | "Draft"
}

/**
 * Created courses for the current organization. Empty until backend wiring is
 * in place — the UI shows the empty state automatically.
 */
export const courses: Course[] = []

export function getCourse(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}
