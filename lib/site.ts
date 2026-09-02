/**
 * Brand + platform constants.
 *
 * "Northline Dermatology" is a PLACEHOLDER brand. To rebrand, change the values
 * here (and NEXT_PUBLIC_BRAND_NAME in the environment) — nothing else hard-codes
 * the name.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Northline Dermatology",
  shortName: "Northline",
  tagline: "Evidence-led skin, hair and nail care — online and in clinic.",
  description:
    "Book an online or in-person dermatology consultation with a verified specialist. Real-time availability, instant confirmation, secure video link.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  city: "Karachi",
  country: "Pakistan",
  supportEmail: "care@northline.example",
  nav: [
    { label: "Find a specialist", href: "/doctors" },
    { label: "How it works", href: "/consultation" },
    { label: "Conditions", href: "/conditions" },
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
  "Aga Khan University Hospital",
  "Liaquat National Hospital",
  "Dr. Plaza",
  "National Medical Centre",
  "Tabba Heart Institute",
  "Ziauddin Hospital",
  "South City Hospital",
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
