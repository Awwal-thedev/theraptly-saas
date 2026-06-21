export type PrebuiltCourse = {
  tag: string
  title: string
  desc: string
  duration: string
  format: string
  img: string
}

/**
 * Curated library of pre-built courses. Empty until a real catalogue is
 * wired in; consumers fall through to their empty states.
 */
export const prebuiltCourses: PrebuiltCourse[] = []
