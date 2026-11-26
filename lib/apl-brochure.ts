/** Printable brochure / prospectus content for A Plus Institute. */

import { APL_CATEGORIES, type AplAdmissionCategory } from "@/lib/apl-admission";

export type AplBrochureSheet = {
  id: string;
  category: AplAdmissionCategory;
  title: string;
  kind: "form" | "overview" | "admission" | "course";
  subtitle: string;
  duration?: string;
  eligibility: string[];
  highlights: string[];
  modules: string[];
  careers: string[];
  documents: string[];
  notes: string[];
};

function sheet(
  partial: Omit<AplBrochureSheet, "documents"> & { documents?: string[] },
): AplBrochureSheet {
  const categoryDocs = APL_CATEGORIES.find((c) => c.id === partial.category)?.documents || [];
  return {
    ...partial,
    documents: partial.documents || categoryDocs.filter((d) => d !== "Other"),
  };
}

export const APL_BROCHURE_SHEETS: AplBrochureSheet[] = [
  sheet({
    id: "law-form",
    category: "law",
    kind: "form",
    title: "Law Admission Form",
    subtitle: "Blank printable LLB admission form for the student to fill by hand.",
    eligibility: [],
    highlights: [],
    modules: [],
    careers: [],
    notes: ["Print and give this form to the student / parent at counselling."],
  }),
  sheet({
    id: "law-overview",
    category: "law",
    kind: "overview",
    title: "Law Department",
    subtitle: "Professional LLB pathways for Intermediate and graduate students.",
    eligibility: [
      "Pakistani / foreign nationals with required academic background",
      "LAT (Law Admission Test) required for LLB admission",
      "Intermediate / HSSC for the 5-year program",
      "Bachelor's degree for the 4-year program",
    ],
    highlights: [
      "Focused legal education with practical orientation",
      "Guidance for LAT preparation and admission paperwork",
      "Structured pathways for courtroom, corporate and public-service careers",
      "Document checklist and counselling before enrolment",
    ],
    modules: [
      "Constitutional Law",
      "Criminal Law & Procedure",
      "Civil Law & Procedure",
      "Contract & Commercial Law",
      "Islamic Jurisprudence",
      "Legal Drafting & Advocacy Skills",
    ],
    careers: ["Advocate", "Legal Advisor", "Corporate Counsel pathway", "Judicial / public service prep", "NGO & human-rights roles"],
    notes: [
      "Ask reception for current session fee schedule and seat availability.",
      "Carry original documents for verification at the time of admission.",
    ],
  }),
  sheet({
    id: "law-admission",
    category: "law",
    kind: "admission",
    title: "Law Admission Guide",
    subtitle: "What to bring and how to apply for LLB at A Plus Institute.",
    eligibility: [
      "LLB (5 Years): Intermediate / HSSC or equivalent",
      "LLB (4 Years): Bachelor's degree or equivalent",
      "Valid LAT score / LAT result card",
      "Completed admission form with guardian details",
    ],
    highlights: [
      "Choose LLB 5 Years or LLB 4 Years according to your last qualification",
      "Submit LAT roll number, score and year on the admission form",
      "Attach photocopies of academic and identity documents",
      "Pay admission / first fee installment as advised by accounts",
    ],
    modules: [
      "Step 1 — Collect brochure & discuss pathway with counsellor",
      "Step 2 — Appear / submit LAT result",
      "Step 3 — Fill Law Admission Form",
      "Step 4 — Document verification",
      "Step 5 — Fee deposit & enrolment confirmation",
    ],
    careers: ["Full-time LLB student pathway", "Evening / flexible options where announced by campus"],
    notes: [
      "Incomplete forms delay enrolment.",
      "Keep one extra set of photocopies for campus file.",
    ],
  }),
  sheet({
    id: "llb-5",
    category: "law",
    kind: "course",
    title: "LLB (5 Years)",
    subtitle: "After Intermediate / HSSC — complete professional law pathway.",
    duration: "5 years",
    eligibility: [
      "Intermediate / HSSC (or equivalent) passed",
      "LAT required",
      "Age and domicile as per institute / regulator policy",
    ],
    highlights: [
      "Designed for students entering law after college (FA / FSc / ICS / ICom)",
      "Builds foundation from introductory legal studies to advanced practice",
      "Suitable for students targeting advocacy and competitive legal careers",
    ],
    modules: [
      "English / Legal Language foundations",
      "Introduction to Law & Legal System",
      "Constitutional Law",
      "Law of Contract & Torts",
      "Criminal Law",
      "Civil Procedure & Evidence",
      "Islamic Personal Law",
      "Moot court / advocacy practice (as scheduled)",
    ],
    careers: ["Advocate", "Legal associate", "Litigation support", "Further LLM / specialized diplomas"],
    notes: ["Duration may follow the academic calendar issued each session."],
  }),
  sheet({
    id: "llb-4",
    category: "law",
    kind: "course",
    title: "LLB (4 Years)",
    subtitle: "After bachelor's degree — graduate-entry LLB pathway.",
    duration: "4 years",
    eligibility: [
      "Bachelor's degree (or equivalent) completed",
      "LAT required",
      "Academic transcripts for previous degree",
    ],
    highlights: [
      "Shorter pathway for graduates shifting into law",
      "Emphasis on professional subjects and legal skills",
      "Ideal for career changers and working graduates (as campus timings allow)",
    ],
    modules: [
      "Legal System & Jurisprudence",
      "Constitutional & Administrative Law",
      "Criminal Law & Procedure",
      "Civil Law & Procedure",
      "Commercial / Company Law essentials",
      "Legal drafting, pleading and professional ethics",
    ],
    careers: ["Advocate", "In-house legal support", "Compliance roles", "Public / private sector legal work"],
    notes: ["Bring bachelor's degree / transcript with LAT card at admission."],
  }),

  sheet({
    id: "it-form",
    category: "it",
    kind: "form",
    title: "IT Admission Form",
    subtitle: "Blank printable IT courses admission form for the student to fill by hand.",
    eligibility: [],
    highlights: [],
    modules: [],
    careers: [],
    notes: ["Print and give this form to the student / parent at counselling."],
  }),
  sheet({
    id: "it-overview",
    category: "it",
    kind: "overview",
    title: "IT & Digital Skills",
    subtitle: "Short professional courses for freelancing, e-commerce and computer careers.",
    eligibility: [
      "Basic computer familiarity preferred",
      "Matric / Intermediate useful for some office tracks",
      "CNIC / B-Form for registration",
    ],
    highlights: [
      "Marketplace, freelancing and design courses under one campus",
      "Practical, skill-first teaching",
      "Course can be selected or created during admission",
      "Suitable for beginners and upskilling students",
    ],
    modules: [
      "Computer fundamentals where needed",
      "Platform / tool training for the chosen course",
      "Project or practice tasks",
      "Career / freelancing orientation",
    ],
    careers: ["Freelancer", "Online seller", "Junior designer / marketer", "Front desk / hardware support"],
    notes: ["Exact fee and batch timing are confirmed at admission."],
  }),
  sheet({
    id: "it-admission",
    category: "it",
    kind: "admission",
    title: "IT Admission Guide",
    subtitle: "How to enrol in an IT or marketplace course.",
    eligibility: [
      "Select one primary course at admission",
      "Provide identity and basic academic copies",
      "Guardian / contact details for campus communication",
    ],
    highlights: [
      "Pick from Web Design, marketplaces, programming, graphics and more",
      "You can also create a new course from the admission desk if needed",
      "Course name appears on student record, ID card and admission letter",
    ],
    modules: [
      "Step 1 — Choose course from brochure",
      "Step 2 — Fill IT admission form",
      "Step 3 — Attach CNIC / photos / result cards",
      "Step 4 — Fee deposit & batch assignment",
    ],
    careers: ["Skill certificate pathway for freelancing and jobs"],
    notes: ["Ask counsellor which course fits your target income / job goal."],
  }),
  ...([
    {
      id: "web-design",
      title: "Web Design",
      subtitle: "Build modern websites and landing pages.",
      modules: ["HTML / CSS basics", "Responsive layouts", "UI structure", "Simple site projects"],
      careers: ["Freelance web designer", "Website fixer", "Agency junior"],
    },
    {
      id: "digital-marketing",
      title: "Digital Marketing",
      subtitle: "Online promotion, ads and social growth skills.",
      modules: ["Social media marketing", "Content planning", "Ads basics", "Analytics overview"],
      careers: ["Social media executive", "Ads assistant", "Freelance marketer"],
    },
    {
      id: "youtube-learning",
      title: "YouTube Learning",
      subtitle: "Create, grow and monetize YouTube channels.",
      modules: ["Channel setup", "Content ideas", "Thumbnails & titles", "Growth & monetization basics"],
      careers: ["YouTuber", "Content creator", "Channel manager"],
    },
    {
      id: "google-adsense",
      title: "Google AdSense",
      subtitle: "Website / content monetization with AdSense.",
      modules: ["Eligible content setup", "AdSense application flow", "Placement basics", "Policy awareness"],
      careers: ["Content publisher", "Blog / niche site owner"],
    },
    {
      id: "shopify",
      title: "Shopify",
      subtitle: "Launch and manage a Shopify store.",
      modules: ["Store setup", "Theme basics", "Products & payments", "Order handling"],
      careers: ["Shopify store owner", "E-commerce assistant"],
    },
    {
      id: "amazon",
      title: "Amazon",
      subtitle: "Amazon selling fundamentals for online retail.",
      modules: ["Seller account basics", "Listing products", "Pricing & shipping concepts", "Account health awareness"],
      careers: ["Amazon seller", "Marketplace assistant"],
    },
    {
      id: "ebay",
      title: "eBay",
      subtitle: "Sell products on eBay with practical listing skills.",
      modules: ["Account setup", "Listings", "Customer communication", "Shipping basics"],
      careers: ["eBay seller", "Dropship / retail helper"],
    },
    {
      id: "etsy",
      title: "Etsy",
      subtitle: "Handmade and niche product selling on Etsy.",
      modules: ["Shop setup", "Product photos & titles", "SEO basics", "Order fulfilment"],
      careers: ["Etsy seller", "Creative product seller"],
    },
    {
      id: "walmart",
      title: "Walmart",
      subtitle: "Walmart marketplace selling overview.",
      modules: ["Marketplace setup concepts", "Catalog listings", "Pricing", "Order workflow"],
      careers: ["Marketplace seller", "E-commerce ops"],
    },
    {
      id: "onbuy",
      title: "OnBuy",
      subtitle: "Sell through the OnBuy marketplace.",
      modules: ["Seller onboarding", "Listings", "Offers & orders", "Store maintenance"],
      careers: ["OnBuy seller", "Multi-marketplace seller"],
    },
    {
      id: "smc",
      title: "SMC",
      subtitle: "Social media content and community skills.",
      modules: ["Profile branding", "Post planning", "Engagement", "Basic reporting"],
      careers: ["SMC executive", "Page manager"],
    },
    {
      id: "c-cpp",
      title: "C and C++",
      subtitle: "Programming foundations with C / C++.",
      modules: ["Syntax & logic", "Loops & functions", "Pointers overview", "Practice problems"],
      careers: ["Programming beginner track", "CS foundation for further study"],
    },
    {
      id: "tiktok-seller",
      title: "TikTok Seller",
      subtitle: "Sell and promote products using TikTok.",
      modules: ["Seller / shop concepts", "Short video selling", "Product hooks", "Basic analytics"],
      careers: ["TikTok seller", "Short-video marketer"],
    },
    {
      id: "graphic-design",
      title: "Graphic Design",
      subtitle: "Design posters, posts and brand visuals.",
      modules: ["Design tools basics", "Typography & colour", "Social creatives", "Print-ready layouts"],
      careers: ["Graphic designer", "Freelance designer"],
    },
    {
      id: "front-desk",
      title: "Front Desk Operator",
      subtitle: "Office reception, calls and visitor handling.",
      modules: ["Professional communication", "Call handling", "Visitor logs", "Office software basics"],
      careers: ["Receptionist", "Front office assistant"],
    },
    {
      id: "computer-hardware",
      title: "Computer Hardware",
      subtitle: "Assemble, diagnose and maintain PCs.",
      modules: ["PC components", "Assembly", "Troubleshooting", "Basic networking awareness"],
      careers: ["Hardware technician", "IT support helper"],
    },
  ] as const).map((course) =>
    sheet({
      id: course.id,
      category: "it",
      kind: "course",
      title: course.title,
      subtitle: course.subtitle,
      duration: "Short professional course (batch-based)",
      eligibility: ["Basic literacy / computer interest", "CNIC or B-Form for admission"],
      highlights: [
        "Hands-on practice focused on the selected skill",
        "Suitable for freelancing or junior job entry",
        "Counsellor can map this course to your goal",
      ],
      modules: [...course.modules],
      careers: [...course.careers],
      notes: ["Batch timing and fee are confirmed at the admission desk."],
    }),
  ),

  sheet({
    id: "nursing-form",
    category: "nursing",
    kind: "form",
    title: "Nursing Admission Form",
    subtitle: "Blank printable nursing admission form for the student to fill by hand.",
    eligibility: [],
    highlights: [],
    modules: [],
    careers: [],
    notes: ["Print and give this form to the student / parent at counselling."],
  }),
  sheet({
    id: "nursing-overview",
    category: "nursing",
    kind: "overview",
    title: "Nursing Programs",
    subtitle: "BS Nursing and B Category pathways for healthcare careers.",
    eligibility: [
      "Matric / Intermediate (FSc preferred for nursing tracks)",
      "Medical fitness certificate",
      "CNIC / B-Form and academic result cards",
    ],
    highlights: [
      "Two clear tracks: BS Nursing (3 years) and B Category (2 years)",
      "Patient-care oriented learning",
      "Document and medical checks before admission",
    ],
    modules: [
      "Fundamentals of nursing",
      "Anatomy & physiology basics",
      "Patient care & ethics",
      "Clinical orientation as per track",
    ],
    careers: ["Staff nurse pathway", "Clinic / hospital support roles", "Further nursing studies"],
    notes: ["Confirm hospital / clinical attachments with campus administration."],
  }),
  sheet({
    id: "nursing-admission",
    category: "nursing",
    kind: "admission",
    title: "Nursing Admission Guide",
    subtitle: "How to apply for BS Nursing or B Category.",
    eligibility: [
      "Select BS Nursing (3 years) or B Category (2 years)",
      "Attach FSc / Intermediate result where required",
      "Submit medical fitness certificate",
    ],
    highlights: [
      "Track selection happens before the nursing form",
      "Campus verifies documents and medical fitness",
      "Fee and uniform / kit guidance given at enrolment",
    ],
    modules: [
      "Step 1 — Choose nursing track",
      "Step 2 — Fill nursing admission form",
      "Step 3 — Medical & document verification",
      "Step 4 — Fee deposit & joining instructions",
    ],
    careers: ["Nursing student → clinical practice pathway"],
    notes: ["Bring originals for verification; photocopies stay in student file."],
  }),
  sheet({
    id: "bs-nursing",
    category: "nursing",
    kind: "course",
    title: "BS Nursing (3 years)",
    subtitle: "Three-year nursing program with broader clinical foundation.",
    duration: "3 years",
    eligibility: [
      "Intermediate / FSc (or equivalent) as required by campus policy",
      "Medical fitness certificate",
      "CNIC / B-Form",
    ],
    highlights: [
      "Longer professional nursing track",
      "Stronger foundation for hospital and clinical roles",
      "Structured over three academic years",
    ],
    modules: [
      "Nursing fundamentals",
      "Anatomy & physiology",
      "Pharmacology basics",
      "Medical-surgical nursing introduction",
      "Community / clinical practice orientation",
    ],
    careers: ["Registered nursing pathway", "Hospital / clinic nursing roles", "Further specialization"],
    notes: ["Exact clinical schedule is issued by the department each session."],
  }),
  sheet({
    id: "b-category",
    category: "nursing",
    kind: "course",
    title: "B Category (2 years)",
    subtitle: "Two-year nursing track for faster entry into care roles.",
    duration: "2 years",
    eligibility: [
      "Matric / Intermediate as required by campus policy",
      "Medical fitness certificate",
      "CNIC / B-Form",
    ],
    highlights: [
      "Shorter duration than BS Nursing",
      "Practical care focus",
      "Useful for students seeking quicker workforce entry",
    ],
    modules: [
      "Basic nursing care",
      "Patient handling & hygiene",
      "First aid awareness",
      "Ward / clinic support skills",
    ],
    careers: ["Nursing assistant / B-category pathway", "Clinic support roles"],
    notes: ["Ask admission desk for current session fee and uniform list."],
  }),
];

const KIND_ORDER: Record<AplBrochureSheet["kind"], number> = {
  form: 0,
  overview: 1,
  admission: 2,
  course: 3,
};

export function brochureSheetsFor(category: AplAdmissionCategory): AplBrochureSheet[] {
  return APL_BROCHURE_SHEETS
    .filter((sheet) => sheet.category === category)
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title));
}

export function brochureSheetById(id?: string | null): AplBrochureSheet | null {
  return APL_BROCHURE_SHEETS.find((sheet) => sheet.id === id) || null;
}

export function brochureKindLabel(kind: AplBrochureSheet["kind"]): string {
  if (kind === "form") return "Admission form";
  if (kind === "overview") return "Department info";
  if (kind === "admission") return "Admission guide";
  return "Course brochure";
}
