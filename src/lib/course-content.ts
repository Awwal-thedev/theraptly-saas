/**
 * Shared content for a course. Step 7 of the creation wizard (review)
 * and the learn page (delivery) both read from this module so they stay
 * in sync — when AI generation lands, this becomes the per-course payload
 * returned from the backend.
 */

export const COURSE_MODULES = [
  "Module 1 - Understanding Health & Safety Practices",
  "Module 2 - Core Concepts of Health & Safety",
]

export interface Lecture {
  mod: number
  title: string
  duration: string
}

export const COURSE_LECTURES: Lecture[] = [
  { mod: 0, title: "Introduction to Health & Safety Protocols", duration: "1:30" },
  { mod: 0, title: "Key Principles of Health & Safety", duration: "2:15" },
  { mod: 0, title: "In-Depth Case Study on Safety Practices", duration: "3:00" },
  { mod: 1, title: "User Experience in Health & Safety", duration: "4:15" },
  { mod: 1, title: "Summary of Market Research on Safety", duration: "2:45" },
  { mod: 1, title: "Results from Prototype Safety Testing", duration: "3:30" },
]

export const COURSE_SLIDES = Array.from(
  { length: 10 },
  (_, i) => `/slides/slide-${i + 1}.png`
)

export const NOTE_TAKEAWAYS = [
  "Put the people served at the center of every decision.",
  "Keep records clear, accurate, and confidential.",
  "Follow defined safety and emergency procedures.",
  "Report incidents promptly and transparently.",
]

/**
 * Citation index per takeaway → COURSE_SOURCE_DOC paragraph with the matching
 * `highlight.id`. Used by the review screen so authors can validate each
 * generated point against the source document (NotebookLM-style grounding).
 */
export const NOTE_CITATIONS = [3, 2, 1, 4]

export interface SourceParagraph {
  text: string
  /** When present, indicates a highlighted clause inside this paragraph. */
  highlight?: { id: number; text: string }
}

export const COURSE_SOURCE_DOC: {
  name: string
  paragraphs: SourceParagraph[]
} = {
  name: "Source document.pdf",
  paragraphs: [
    {
      text:
        "The content on the Compliance and Regulatory Framework (CARF) was developed through a synthesis of established regulatory compliance principles and governance best practices. It draws on widely recognized approaches to regulatory oversight that emphasize structured controls, accountability, and continuous monitoring across regulated organizations.",
      highlight: {
        id: 1,
        text:
          "These foundational concepts form the basis for understanding how CARF operates as a practical compliance model.",
      },
    },
    {
      text:
        "In addition, the draft reflects general risk management and audit frameworks commonly used in highly regulated sectors. These frameworks focus on identifying regulatory obligations, assessing compliance gaps, documenting controls, and maintaining traceability for audit purposes.",
      highlight: {
        id: 2,
        text:
          "Such approaches are widely adopted by organizations to ensure consistency, transparency, and regulatory readiness.",
      },
    },
    {
      text:
        "The healthcare-specific applications of CARF were informed by standard healthcare compliance practices, including patient safety requirements, data protection regulations, ethical standards, and operational governance guidelines.",
      highlight: {
        id: 3,
        text:
          "These principles are routinely applied across healthcare institutions to reduce legal exposure, improve service quality, and maintain public and regulatory trust.",
      },
    },
    {
      text:
        "Incident reporting and post-event review are emphasized throughout the document. Staff are expected to record events promptly, route them through the defined escalation chain, and contribute to corrective-action analysis.",
      highlight: {
        id: 4,
        text:
          "Transparent reporting protects the people served and creates the data trail auditors rely on to verify compliance.",
      },
    },
    {
      text:
        "Overall, the material represents a consolidated view of how CARF principles connect day-to-day operations to broader regulatory expectations — giving staff a practical framework for safe, accountable, and person-centered service delivery.",
    },
  ],
}

export interface QuizQuestion {
  question: string
  options: string[]
  /** Index into options[] for the correct answer. */
  correctIndex: number
  /** Short rationale shown after the learner answers (and on the review page). */
  explanation: string
}

export const COURSE_QUIZ: QuizQuestion[] = [
  {
    question:
      "Which of the following best describes the organization’s mission as stated in the policy document?",
    options: [
      "Maximize quarterly revenue across all service lines.",
      "Provide person-centered care that protects rights, safety, and dignity.",
      "Reduce staff headcount through process automation.",
      "Lobby for expanded reimbursement from insurers.",
    ],
    correctIndex: 1,
    explanation:
      "The mission centers on person-centered care — every service decision starts from the rights, safety, and dignity of the people served, not financial or operational goals.",
  },
  {
    question:
      "According to the policy, how are individuals involved in their service planning?",
    options: [
      "They are kept informed but not consulted on goals.",
      "They are invited to co-create goals and consent to the plan.",
      "Family members alone decide service direction.",
      "Clinicians draft the plan and email a copy to the client.",
    ],
    correctIndex: 1,
    explanation:
      "Service planning is collaborative — the policy requires that goals are co-created with the individual and documented consent is obtained before the plan is finalized.",
  },
  {
    question: "Which right is explicitly protected in the policy document?",
    options: [
      "Right to free transportation.",
      "Right to refuse any documentation requirement.",
      "Right to confidentiality of personal health information.",
      "Right to bypass intake screening.",
    ],
    correctIndex: 2,
    explanation:
      "Confidentiality of personal health information is a core protected right under both this policy and the broader HIPAA framework it aligns with.",
  },
  {
    question:
      "How does the organization ensure confidentiality of personal information?",
    options: [
      "All staff have unrestricted access for convenience.",
      "Records are stored in shared, unsecured cloud folders.",
      "Access is role-based, audited, and aligned with HIPAA controls.",
      "Confidentiality is verbally promised at intake only.",
    ],
    correctIndex: 2,
    explanation:
      "Confidentiality is enforced technically — role-based access, audit logging, and HIPAA-aligned safeguards prevent inappropriate disclosure.",
  },
  {
    question:
      "What approach does the policy outline for managing risks to persons served?",
    options: [
      "Wait for incidents and respond reactively.",
      "Proactive identification, mitigation plans, and incident reporting.",
      "Escalate every interaction to legal counsel.",
      "Outsource all risk decisions to external auditors.",
    ],
    correctIndex: 1,
    explanation:
      "Risks are surfaced before harm occurs — staff document identified risks, attach a mitigation plan, and report any incidents promptly so patterns can be addressed.",
  },
]

/** Kept as a flat list of question strings for surfaces that only need the prompt. */
export const COURSE_QUIZ_QUESTIONS = COURSE_QUIZ.map((q) => q.question)
