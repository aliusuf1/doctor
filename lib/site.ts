/**
 * Brand + site constants. This site is exclusively for Dr. Sana Siddiqui.
 * `doctorSlug` is the seeded doctor record her booking page + calendar use.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Dr. Sana Siddiqui",
  shortName: "Dr. Sana Siddiqui",
  doctorSlug: "sana-siddiqui",
  doctorCredentials: "MBBS, FCPS, SCE",
  doctorTitle: "Consultant Dermatologist",
  tagline: "Evidence-led skin, hair and nail care — online and in Karachi.",
  description:
    "Book an online dermatology consultation with Dr. Sana Siddiqui. Real-time availability, instant confirmation, secure video link.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  city: "Karachi",
  country: "Pakistan",
  timezone: "Asia/Karachi",
  supportEmail: "care@example.com",
  bookHref: "/doctors/sana-siddiqui",
  nav: [
    { label: "About", href: "/#about" },
    { label: "Conditions", href: "/conditions" },
    { label: "Online consultation", href: "/consultation" },
    { label: "Insights", href: "/insights" },
  ],
  legal: {
    notEmergency:
      "Not an emergency service. For urgent symptoms, contact your nearest emergency department.",
    infoOnly:
      "Information on this site supports, but does not replace, an individual medical consultation.",
  },
} as const;

/**
 * Institutions shown in the "Trusted clinical network" marquee. Edit freely —
 * this is site content, not a verified claim by the platform.
 */
export const CLINICAL_NETWORK = [
  "Memon Medical Institute",
  "Abbasi Shaheed Hospital",
  "Karachi Medical & Dental College",
] as const;

export const CARE_AREAS = [
  {
    n: "01",
    title: "Acne & acne marks",
    body: "Assessment for active acne, post-inflammatory pigmentation and scarring, with a plan matched to skin type and history.",
  },
  {
    n: "02",
    title: "Pigmentation & melasma",
    body: "Diagnosis-led care that accounts for triggers, depth of pigment and how your skin tolerates treatment.",
  },
  {
    n: "03",
    title: "Hair & scalp concerns",
    body: "Evaluation of shedding, thinning and scalp conditions, including which investigations are actually worthwhile.",
  },
  {
    n: "04",
    title: "Eczema & psoriasis",
    body: "Longer-term support for recurring inflammatory skin conditions, with flare plans you can follow at home.",
  },
  {
    n: "05",
    title: "Skin infections",
    body: "Assessment of fungal, bacterial and viral skin presentations, and when a swab or culture changes the plan.",
  },
  {
    n: "06",
    title: "Nail disorders",
    body: "Diagnosis-led care for changes in nail colour, texture, separation and growth.",
  },
] as const;

/** Expandable detail for each care area (keyed by CARE_AREAS `n`). */
export const CARE_AREA_DETAIL: Record<string, string[]> = {
  "01": [
    "Active inflammatory acne, comedonal acne and hormonal patterns.",
    "Post-inflammatory pigmentation and early scarring.",
    "Review of current products and prescription tolerance.",
  ],
  "02": [
    "Distinguishing melasma from post-inflammatory and other pigmentation.",
    "Identifying triggers: sun, heat, hormones and irritation.",
    "Staged plans that respect how your skin tolerates actives.",
  ],
  "03": [
    "Telogen effluvium, pattern hair loss and scalp inflammation.",
    "Which blood tests and scalp assessments are actually useful.",
    "Realistic timelines for regrowth and maintenance.",
  ],
  "04": [
    "Flare plans for eczema and psoriasis you can follow at home.",
    "Trigger identification and skin-barrier care.",
    "When to step up to systemic treatment and referral.",
  ],
  "05": [
    "Fungal, bacterial and viral skin presentations.",
    "When a swab, scraping or culture changes management.",
    "Clear guidance on contagion and household measures.",
  ],
  "06": [
    "Changes in nail colour, thickness, separation and shape.",
    "Fungal versus non-fungal causes.",
    "When a nail sample or imaging is warranted.",
  ],
};

/** Homepage FAQ — grounded in what the booking flow actually does. */
export const FAQ = [
  {
    q: "How much does a consultation cost?",
    a: "Dr. Sana's fee is shown on her booking page before you choose a time, and again at checkout. There are no hidden charges — the amount you see is what you pay.",
  },
  {
    q: "Should I book online or in person?",
    a: "Online video works well for most visible skin, hair and nail concerns and for follow-ups. Some conditions need an in-person examination, a procedure or an investigation; Dr. Sana will tell you clearly if that applies and arrange it.",
  },
  {
    q: "How do I pay?",
    a: "Pay online by card or wallet, or by bank transfer — after booking you'll see the account details and can upload a payment screenshot. Your slot is held until the payment is confirmed, then the appointment is locked in.",
  },
  {
    q: "What happens right after I book?",
    a: "You get an instant confirmation by email. For online consultations a Google Meet link is generated automatically and sent to you. You'll also get reminders before the appointment.",
  },
  {
    q: "Can I reschedule or cancel?",
    a: "Yes. Use the link in your confirmation email to open your booking and reschedule to any open slot, or cancel — up to the notice window shown on the page.",
  },
  {
    q: "Will I get a prescription?",
    a: "Where a prescription is appropriate, Dr. Sana issues one as part of your written plan after the consultation, along with the diagnosis, what to do and when to follow up.",
  },
  {
    q: "Is my information private?",
    a: "Your details and any payment evidence you upload are visible only to the clinic. Video calls are on Google Meet and are not recorded. See the privacy notice for more.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Choose a specialist and time",
    body: "Browse verified dermatologists, see live availability and pick a slot that suits you.",
  },
  {
    n: "2",
    title: "Confirm and pay the fee",
    body: "Pay online, or by bank transfer with a receipt upload. The consultation fee is shown before you book.",
  },
  {
    n: "3",
    title: "Join the video consultation",
    body: "A Google Meet link is generated automatically and sent to you, along with your agreed plan afterwards.",
  },
] as const;
