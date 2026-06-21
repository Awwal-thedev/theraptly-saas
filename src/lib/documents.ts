export type DocStatus = "In progress" | "Completed" | "Failed"

export type DocItem = {
  id: string
  name: string
  type: "pdf" | "docx"
  size: string
  date: string
  status: DocStatus
  // The course AI generated from this document (set once processing completes).
  courseId?: string
}

/**
 * Uploaded source documents. Empty until backend wiring is in place — users
 * upload via the documents hub and the list populates from there.
 */
export const documents: DocItem[] = []
