 import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
// =========================================================
// API
// =========================================================
const API_URL = "https://ai-career-assistant-5pqr.onrender.com";
// =========================================================
// STORAGE
// =========================================================
const SAVED_RESUME_ANALYSIS_KEY =
  "saved_resume_analysis_v2";
const OLD_SAVED_RESUME_ANALYSIS_KEY =
  "saved_resume_analysis";
// =========================================================
// TYPES
// =========================================================
type Skills = {
  programming_languages: string[];
  web_technologies: string[];
  databases: string[];
  tools_platforms: string[];
  other: string[];
};
type LearnNextItem = {
  skill: string;
  fresher_topics: string[];
  goal: string;
  advanced_topics: string[];
};
type ProjectIdea = {
  project_name: string;
  description: string;
  technologies: string[];
  actual_output: string[];
};
type CareerAnalysis = {
  what_you_already_have: string[];
  learn_next: LearnNextItem[];
  jobs_you_can_apply_for: string[];
  what_you_should_improve: string[];
  your_next_step: string[];
  project_ideas: ProjectIdea[];
};
type ResumeAnalysis = {
  summary: string;
  education: string[];
  education_details?: string[];
  specialization?: string;
  skills: Skills;
  skill_details?: string[];
  projects: string[];
  certifications: string[];
  internships_experience: string[];
  languages?: string[];
  achievements?: string[];
  personal_information?: string[];
  profile_found?: boolean;
  career_analysis: CareerAnalysis;
};
// =========================================================
// HELPERS
// =========================================================
function cleanText(value: any): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    return value
      .replace(/\*\*\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .replace(/^[-•]\s*/, "")
      .trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, any>;

    if (obj.value !== undefined) {
      return cleanText(obj.value);
    }

    if (obj.name !== undefined && obj.issuer !== undefined) {
      const name = cleanText(obj.name);
      const issuer = cleanText(obj.issuer);
      return issuer ? `${name} — ${issuer}` : name;
    }

    if (obj.role !== undefined) {
      const role = cleanText(obj.role);
      const reason = cleanText(obj.reason);
      return reason ? `${role} — ${reason}` : role;
    }

    if (obj.title !== undefined) {
      const title = cleanText(obj.title);
      const description = cleanText(obj.description);
      return description ? `${title} — ${description}` : title;
    }

    if (obj.category !== undefined && obj.value !== undefined) {
      return `${cleanText(obj.category)}: ${cleanText(obj.value)}`;
    }

    const preferred = ["text", "display", "label", "course_name", "project_name"];
    for (const key of preferred) {
      if (obj[key] !== undefined) {
        const text = cleanText(obj[key]);
        if (text) return text;
      }
    }

    return "";
  }

  return "";
}

function safeArray(value: any): string[] {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const text = cleanText(item);
    if (!text || text === "[object Object]") continue;

    const key = text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  }

  return result;
}

function formatEducationRecord(record: any): string {
  if (typeof record === "string") {
    return cleanText(record);
  }

  if (!record || typeof record !== "object") {
    return "";
  }

  const degree = cleanText(record.degree || record.qualification);
  const specialization = cleanText(record.specialization);
  const college = cleanText(record.college);
  const cgpa = cleanText(record.cgpa || record.gpa);
  const percentage = cleanText(record.percentage);
  const duration = cleanText(record.duration);

  let qualification = degree;

  if (degree.toUpperCase() === "MBA") {
    qualification = specialization
      ? `MBA — ${specialization}`
      : "MBA";
  } else if (
    degree.toUpperCase().replace(/\s/g, "") === "B.SC." ||
    degree.toUpperCase().replace(/\s/g, "") === "B.SC"
  ) {
    qualification = specialization
      ? `B.Sc. (${specialization})`
      : "B.Sc.";
  }

  const details = [
    qualification,
    duration,
    cgpa ? `CGPA: ${cgpa}` : "",
    percentage ? `${percentage.replace(/%$/, "")}%` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  if (college && details) {
    return `${college} — ${details}`;
  }

  return college || details;
}

function normalizeEducation(raw: any): { education: string[]; details: string[] } {
  // Prefer the backend's already-formatted education strings.
  // They contain the exact college + degree + year + CGPA.
  const direct = safeArray(raw?.education);
  if (direct.length > 0) {
    return {
      education: direct,
      details: [],
    };
  }

  const source = Array.isArray(raw?.education_details)
    ? raw.education_details
    : [];

  const formatted: string[] = [];
  const seen = new Set<string>();

  for (const record of source) {
    const value = formatEducationRecord(record);
    if (!value) continue;

    const key = value.toLowerCase().replace(/\s+/g, " ").trim();
    if (!seen.has(key)) {
      seen.add(key);
      formatted.push(value);
    }
  }

  return {
    education: formatted,
    details: [],
  };
}

const PROGRAMMING_LANGUAGE_NAMES = [
  "c", "c++", "c#", "java", "python", "javascript", "typescript",
  "kotlin", "swift", "php", "ruby", "go", "rust", "scala",
];

const HUMAN_LANGUAGE_NAMES = [
  "english", "telugu", "hindi", "kannada", "tamil", "malayalam",
  "marathi", "bengali", "gujarati", "punjabi", "urdu", "odia", "odisha",
];

function normalizeLanguages(value: any): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/,|;|\||\s+&\s+/)
      : [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const text = cleanText(item);
    if (!text) continue;

    const lower = text.toLowerCase();
    if (PROGRAMMING_LANGUAGE_NAMES.some((name) => lower === name || lower.startsWith(`${name} `))) {
      continue;
    }

    if (HUMAN_LANGUAGE_NAMES.some((name) => lower.includes(name))) {
      const parts = text.split(/,|;|\||\s+&\s+/).map(cleanText).filter(Boolean);
      for (const part of parts) {
        if (HUMAN_LANGUAGE_NAMES.some((name) => part.toLowerCase().includes(name))) {
          const key = part.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            result.push(part);
          }
        }
      }
    }
  }

  return result;
}

function profileItemsFromObject(profile: any): string[] {
  if (!profile || typeof profile !== "object") return [];

  const result: string[] = [];
  const addGroup = (label: string, value: any) => {
    const items = Array.isArray(value) ? safeArray(value) : [];
    for (const item of items) {
      result.push(`${label}: ${item}`);
    }
  };

  addGroup("Education", profile.education);
  addGroup("Skill", profile.skills);
  addGroup("Project", profile.projects);
  addGroup("Certification", profile.certifications);
  addGroup("Experience", profile.internships_experience);
  addGroup("Language", profile.languages);
  addGroup("Achievement", profile.achievements);

  return result;
}

function normalizeJobRoles(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function normalizeProjectIdeas(value: any): ProjectIdea[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => {
      if (typeof item === "string") {
        return {
          project_name: cleanText(item),
          description: "",
          technologies: [],
          actual_output: [],
        };
      }

      if (!item || typeof item !== "object") return null;

      return {
        project_name: cleanText(
          item.project_name || item.title || item.name
        ),
        description: cleanText(item.description),
        technologies: safeArray(item.technologies),
        actual_output: safeArray(
          item.actual_output || item.output || item.outputs
        ),
      };
    })
    .filter((item): item is ProjectIdea => Boolean(item?.project_name));
}

function fallbackProjectIdeas(specialization: string): ProjectIdea[] {
  const value = specialization.toLowerCase();

  if (value.includes("finance") && value.includes("hr")) {
    return [
      {
        project_name: "HR & Payroll Analytics Dashboard",
        description: "Analyze employee salary, payroll, attendance and HR metrics.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Payroll dashboard", "HR KPI charts", "Employee cost analysis"],
      },
      {
        project_name: "Recruitment Cost & Hiring Analytics",
        description: "Track hiring cost, time-to-hire and recruitment performance.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Recruitment KPI dashboard", "Hiring funnel", "Cost analysis"],
      },
      {
        project_name: "Employee Compensation Analysis",
        description: "Compare salaries, departments, benefits and compensation trends.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Salary comparison", "Department analysis", "Compensation dashboard"],
      },
      {
        project_name: "Finance & HR Management Dashboard",
        description: "Combine department budgets, employee costs and workforce metrics.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Budget dashboard", "Employee cost metrics", "Management KPI report"],
      },
    ];
  }

  if (value.includes("finance")) {
    return [
      {
        project_name: "Personal Expense & Budget Analyzer",
        description: "Track income, expenses, budgets and spending patterns.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Expense dashboard", "Budget summary", "Monthly spending charts"],
      },
      {
        project_name: "Financial Statement Analysis Dashboard",
        description: "Analyze revenue, expenses, profit and financial ratios.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Financial KPI dashboard", "Ratio analysis", "Trend charts"],
      },
      {
        project_name: "Investment Analysis Dashboard",
        description: "Compare investment returns, risk and performance.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Return comparison", "Risk analysis", "Investment dashboard"],
      },
      {
        project_name: "Sales & Revenue Analysis",
        description: "Analyze sales performance, revenue trends and product contribution.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Sales dashboard", "Revenue trends", "Product analysis"],
      },
    ];
  }

  if (value.includes("hr") || value.includes("human resource")) {
    return [
      {
        project_name: "Recruitment Analytics Dashboard",
        description: "Analyze applications, interview stages, hiring time and recruitment sources.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Recruitment funnel", "Time-to-hire report", "Hiring KPI dashboard"],
      },
      {
        project_name: "Employee Management System",
        description: "Maintain employee records, departments and employment information.",
        technologies: ["Python", "SQL"],
        actual_output: ["Employee records", "Search and update functions", "Employee report"],
      },
      {
        project_name: "Employee Attendance & Leave System",
        description: "Track attendance, leave requests and monthly attendance summaries.",
        technologies: ["Python", "SQL"],
        actual_output: ["Attendance report", "Leave summary", "Monthly dashboard"],
      },
      {
        project_name: "Employee Performance Dashboard",
        description: "Track performance ratings, goals and department-level metrics.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Performance KPIs", "Department comparison", "Employee performance report"],
      },
    ];
  }

  if (value.includes("marketing")) {
    return [
      {
        project_name: "Sales & Marketing Analytics Dashboard",
        description: "Analyze sales, campaigns, customers and marketing performance.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Campaign KPIs", "Sales trends", "Marketing dashboard"],
      },
      {
        project_name: "Customer Segmentation System",
        description: "Group customers using purchase and engagement information.",
        technologies: ["Python", "Excel"],
        actual_output: ["Customer segments", "Segment summary", "Customer insights"],
      },
      {
        project_name: "Marketing Campaign Analyzer",
        description: "Compare campaign reach, engagement and conversion performance.",
        technologies: ["Excel", "Power BI"],
        actual_output: ["Campaign comparison", "Conversion report", "Performance dashboard"],
      },
    ];
  }

  return [
    {
      project_name: "Job & Skill Gap Analyzer",
      description: "Compare a student's resume skills with job requirements and identify missing skills.",
      technologies: ["Python", "FastAPI", "React Native", "PostgreSQL"],
      actual_output: ["Skill comparison", "Missing skills list", "Learning recommendations"],
    },
    {
      project_name: "Student Placement Preparation App",
      description: "Help students prepare for aptitude, coding, interview and placement activities.",
      technologies: ["Python", "React Native", "PostgreSQL"],
      actual_output: ["Practice modules", "Progress tracking", "Interview preparation"],
    },
    {
      project_name: "AI Resume Analyzer",
      description: "Analyze resumes and generate structured career recommendations.",
      technologies: ["Python", "FastAPI", "Gemini API", "React Native"],
      actual_output: ["Resume analysis", "Skill recommendations", "Career guidance"],
    },
    {
      project_name: "Full Stack Job Portal",
      description: "Create a job portal where users can search, save and apply for jobs.",
      technologies: ["React", "Node.js", "PostgreSQL"],
      actual_output: ["Job search", "User accounts", "Application tracking"],
    },
  ];
}

function createEmptyAnalysis(): ResumeAnalysis {
  return {
    summary: "",
    education: [],
    education_details: [],
    specialization: "",
    skills: {
      programming_languages: [],
      web_technologies: [],
      databases: [],
      tools_platforms: [],
      other: [],
    },
    skill_details: [],
    projects: [],
    certifications: [],
    internships_experience: [],
    languages: [],
    achievements: [],
    personal_information: [],
    profile_found: false,
    career_analysis: {
      what_you_already_have: [],
      learn_next: [],
      jobs_you_can_apply_for: [],
      what_you_should_improve: [],
      your_next_step: [],
      project_ideas: [],
    },
  };
}

// =========================================================
// ANALYSIS NORMALIZER
// =========================================================
function normalizeAnalysis(value: any): ResumeAnalysis {
  let raw = value;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      throw new Error("Backend returned invalid resume analysis.");
    }
  }

  if (raw?.analysis && typeof raw.analysis === "object") {
    raw = raw.analysis;
  }

  if (raw?.data?.analysis && typeof raw.data.analysis === "object") {
    raw = raw.data.analysis;
  }

  const education = normalizeEducation(raw);
  const careerRaw = raw?.career_analysis || {};

  const learnNext: LearnNextItem[] = Array.isArray(careerRaw.learn_next)
    ? careerRaw.learn_next.map((item: any) => ({
        skill: cleanText(item?.skill || item?.course_name || item?.name),
        fresher_topics: safeArray(item?.fresher_topics),
        goal: cleanText(item?.goal),
        advanced_topics: safeArray(item?.advanced_topics),
      })).filter((item: LearnNextItem) => Boolean(item.skill))
    : [];

  const existingProfile =
    safeArray(careerRaw.what_you_already_have).length > 0
      ? safeArray(careerRaw.what_you_already_have)
      : profileItemsFromObject(careerRaw.current_profile || raw?.current_profile);

  const jobs = normalizeJobRoles(
    careerRaw.jobs_you_can_apply_for ||
      careerRaw.suitable_roles ||
      raw?.jobs_you_can_apply_for
  );

  const improvements = safeArray(
    careerRaw.what_you_should_improve || careerRaw.improve
  );

  const nextSteps = safeArray(
    careerRaw.your_next_step || careerRaw.next_steps || raw?.your_next_step
  );

  const projectIdeas = normalizeProjectIdeas(
    careerRaw.project_ideas || raw?.project_ideas
  );

  const specialization = cleanText(
    raw?.specialization || careerRaw.current_profile?.specialization || ""
  );

  const fallbackJobs = jobs.length > 0
    ? jobs
    : specialization.toLowerCase().includes("computer")
      ? ["Software Developer Trainee", "Frontend Developer Trainee"]
      : specialization.toLowerCase().includes("finance")
        ? ["Finance Executive / Finance Trainee", "Financial Analyst Trainee"]
        : specialization.toLowerCase().includes("hr")
          ? ["HR Executive / HR Trainee", "Recruitment / Talent Acquisition Trainee"]
          : [];

  const fallbackImprove = improvements.length > 0
    ? improvements
    : [
        "Strengthen the skills marked Basic or Beginner through practical projects.",
        "Build and document at least one project directly related to your target role.",
        "Practice interview questions based on your target job.",
      ];

  const fallbackNextSteps = nextSteps.length > 0
    ? nextSteps
    : [
        "Follow the recommended learning path from fresher level.",
        "Build one practical project related to your target role.",
        "Prepare to explain your resume projects in interviews.",
        "Practice role-specific interview questions.",
      ];

  const finalProjectIdeas = projectIdeas.length > 0
    ? projectIdeas
    : fallbackProjectIdeas(specialization);

  const rawLanguages = raw?.languages ?? careerRaw.current_profile?.languages;
  const languages = normalizeLanguages(rawLanguages);

  const profileFallback = existingProfile.length > 0
    ? existingProfile
    : [
        ...education.education.map((item) => `Education: ${item}`),
        ...safeArray(raw?.skills?.programming_languages).map((item) => `Skill: ${item}`),
        ...safeArray(raw?.skills?.web_technologies).map((item) => `Skill: ${item}`),
        ...safeArray(raw?.skills?.databases).map((item) => `Skill: ${item}`),
        ...safeArray(raw?.skills?.tools_platforms).map((item) => `Skill: ${item}`),
        ...safeArray(raw?.projects).map((item) => `Project: ${item}`),
        ...safeArray(raw?.certifications).map((item) => `Certification: ${item}`),
      ];

  return {
    summary: cleanText(raw?.summary || ""),
    education: education.education,
    education_details: education.details,
    specialization,
    skills: {
      programming_languages: safeArray(raw?.skills?.programming_languages),
      web_technologies: safeArray(raw?.skills?.web_technologies),
      databases: safeArray(raw?.skills?.databases),
      tools_platforms: safeArray(raw?.skills?.tools_platforms),
      other: safeArray(raw?.skills?.other),
    },
    skill_details: safeArray(raw?.skill_details || raw?.skills?.details),
    projects: safeArray(raw?.projects),
    certifications: safeArray(raw?.certifications),
    internships_experience: safeArray(raw?.internships_experience || raw?.experience),
    languages,
    achievements: safeArray(raw?.achievements),
    personal_information: safeArray(raw?.personal_information),
    profile_found: Boolean(raw?.profile_found) || profileFallback.length > 0,
    career_analysis: {
      what_you_already_have: profileFallback,
      learn_next: learnNext,
      jobs_you_can_apply_for: fallbackJobs,
      what_you_should_improve: fallbackImprove,
      your_next_step: fallbackNextSteps,
      project_ideas: finalProjectIdeas,
    },
  };
}
// =========================================================
// STORAGE HELPERS
// =========================================================
async function saveResumeAnalysis(
  analysis: ResumeAnalysis
) {
  try {
    const value =
      JSON.stringify(analysis);
    if (Platform.OS === "web") {
      window.localStorage.setItem(
        SAVED_RESUME_ANALYSIS_KEY,
        value
      );
      return;
    }
    const AsyncStorage =
      require(
        "@react-native-async-storage/async-storage"
      ).default;
    await AsyncStorage.setItem(
      SAVED_RESUME_ANALYSIS_KEY,
      value
    );
  } catch (error) {
    console.log(
      "Error saving resume analysis:",
      error
    );
  }
}
// =========================================================
// CLEAR OLD STORAGE
// =========================================================
async function clearSavedResumeAnalysis() {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(
        SAVED_RESUME_ANALYSIS_KEY
      );
      window.localStorage.removeItem(
        OLD_SAVED_RESUME_ANALYSIS_KEY
      );
      return;
    }
    const AsyncStorage =
      require(
        "@react-native-async-storage/async-storage"
      ).default;
    await AsyncStorage.multiRemove([
      SAVED_RESUME_ANALYSIS_KEY,
      OLD_SAVED_RESUME_ANALYSIS_KEY,
    ]);
  } catch (error) {
    console.log(
      "Error clearing old resume:",
      error
    );
  }
}
// =========================================================
// LOAD SAVED RESUME
// =========================================================
async function loadResumeAnalysis(): Promise<
  ResumeAnalysis | null
> {
  try {
    let savedValue = "";
    if (Platform.OS === "web") {
      savedValue =
        window.localStorage.getItem(
          SAVED_RESUME_ANALYSIS_KEY
        ) || "";
    } else {
      const AsyncStorage =
        require(
          "@react-native-async-storage/async-storage"
        ).default;
      savedValue =
        (await AsyncStorage.getItem(
          SAVED_RESUME_ANALYSIS_KEY
        )) || "";
    }
    if (!savedValue) {
      return null;
    }
    return normalizeAnalysis(
      JSON.parse(savedValue)
    );
  } catch (error) {
    console.log(
      "Error loading resume analysis:",
      error
    );
    return null;
  }
}
// =========================================================
// BULLET LIST
// =========================================================
function BulletList({
  items,
  emptyText = "No information found.",
}: {
  items?: string[];
  emptyText?: string;
}) {
  const safeItems = safeArray(items);
  if (safeItems.length === 0) {
    return (
      <Text style={styles.emptyText}>
        {emptyText}
      </Text>
    );
  }
  return (
    <View>
      {safeItems.map(
        (item, index) => (
          <View
            key={`${item}-${index}`}
            style={styles.bulletRow}
          >
            <Text style={styles.bullet}>
              •
            </Text>
            <Text
              style={styles.bulletText}
            >
              {item}
            </Text>
          </View>
        )
      )}
    </View>
  );
}
// =========================================================
// MAIN ACCORDION
// =========================================================
function MainAccordion({
  title,
  open,
  onPress,
  children,
}: {
  title: string;
  open: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={styles.mainAccordion}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.mainAccordionHeader,
          pressed &&
            styles.pressed,
        ]}
      >
        <Text
          style={
            styles.mainAccordionTitle
          }
        >
          {title}
        </Text>
        <Text style={styles.arrow}>
          {open ? "⌃" : "›"}
        </Text>
      </Pressable>
      {open && (
        <View
          style={
            styles.mainAccordionBody
          }
        >
          {children}
        </View>
      )}
    </View>
  );
}
// =========================================================
// INNER ACCORDION
// =========================================================
function InnerAccordion({
  title,
  open,
  onPress,
  children,
}: {
  title: string;
  open: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={styles.innerAccordion}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.innerAccordionHeader,
          pressed &&
            styles.pressed,
        ]}
      >
        <Text
          style={
            styles.innerAccordionTitle
          }
        >
          {title}
        </Text>
        <Text
          style={
            styles.smallArrow
          }
        >
          {open ? "⌃" : "›"}
        </Text>
      </Pressable>
      {open && (
        <View
          style={
            styles.innerAccordionBody
          }
        >
          {children}
        </View>
      )}
    </View>
  );
}
// =========================================================
// SECTION CARD
// =========================================================
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={styles.sectionCard}
    >
      <Text style={styles.cardTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}
// =========================================================
// SKILL GROUP
// =========================================================
function SkillGroup({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  const safeItems =
    safeArray(items);
  if (safeItems.length === 0) {
    return null;
  }
  return (
    <View style={styles.skillGroup}>
      <Text
        style={
          styles.skillGroupTitle
        }
      >
        {title}
      </Text>
      <View
        style={
          styles.skillTagsContainer
        }
      >
        {safeItems.map(
          (item, index) => (
            <View
              key={`${item}-${index}`}
              style={styles.skillTag}
            >
              <Text
                style={
                  styles.skillTagText
                }
              >
                {item}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}
// =========================================================
// YOUR RESUME
// =========================================================
function YourResumeSection({
  analysis,
}: {
  analysis: ResumeAnalysis;
}) {
  const skills =
    analysis.skills ||
    createEmptyAnalysis().skills;
  return (
    <View>
      <SectionCard
        title="👤 Resume Summary"
      >
        {analysis.summary ? (
          <Text
            style={styles.normalText}
          >
            {cleanText(
              analysis.summary
            )}
          </Text>
        ) : (
          <Text
            style={styles.emptyText}
          >
            No summary found.
          </Text>
        )}
      </SectionCard>
      <SectionCard title="🎓 Education">
        <BulletList
          items={analysis.education}
          emptyText="No education information found."
        />

      </SectionCard>
      <SectionCard title="🛠️ Skills">
        <SkillGroup
          title="Programming Languages"
          items={
            skills.programming_languages
          }
        />
        <SkillGroup
          title="Web Technologies"
          items={
            skills.web_technologies
          }
        />
        <SkillGroup
          title="Databases"
          items={
            skills.databases
          }
        />
        <SkillGroup
          title="Tools & Platforms"
          items={
            skills.tools_platforms
          }
        />
        <SkillGroup
          title="Other"
          items={skills.other}
        />
        {[
          ...skills.programming_languages,
          ...skills.web_technologies,
          ...skills.databases,
          ...skills.tools_platforms,
          ...skills.other,
        ].length === 0 && (
          <Text
            style={styles.emptyText}
          >
            No skills found.
          </Text>
        )}
      </SectionCard>
      <SectionCard title="🚀 Projects">
        <BulletList
          items={analysis.projects}
          emptyText="No projects found."
        />
      </SectionCard>
      <SectionCard
        title="📜 Certifications"
      >
        <BulletList
          items={
            analysis.certifications
          }
          emptyText="No certifications found."
        />
      </SectionCard>
      <SectionCard
        title="💼 Internship / Experience"
      >
        <BulletList
          items={
            analysis.internships_experience
          }
          emptyText="No internship or experience found."
        />
      </SectionCard>
      {safeArray(
        analysis.languages
      ).length > 0 && (
        <SectionCard title="🌐 Languages">
          <BulletList
            items={
              analysis.languages
            }
          />
        </SectionCard>
      )}
      {safeArray(
        analysis.achievements
      ).length > 0 && (
        <SectionCard title="🏆 Achievements">
          <BulletList
            items={
              analysis.achievements
            }
          />
        </SectionCard>
      )}
    </View>
  );
}
// =========================================================
// LEARN NEXT CARD
// =========================================================
function LearnNextCard({
  item,
  index,
}: {
  item: LearnNextItem;
  index: number;
}) {
  const [
    openLevel,
    setOpenLevel,
  ] = useState<
    "fresher" | "advanced" | null
  >(null);
  return (
    <View style={styles.learnCard}>
      <View
        style={styles.learnHeader}
      >
        <View
          style={
            styles.numberCircle
          }
        >
          <Text
            style={styles.numberText}
          >
            {index + 1}
          </Text>
        </View>
        <View
          style={
            styles.learnTitleArea
          }
        >
          <Text
            style={
              styles.learnSkill
            }
          >
            {cleanText(item.skill)}
          </Text>
          <Text
            style={
              styles.learnSubText
            }
          >
            Practical learning path
            for your career.
          </Text>
        </View>
      </View>
      <InnerAccordion
        title="🌱 Fresher Level"
        open={
          openLevel ===
          "fresher"
        }
        onPress={() =>
          setOpenLevel(
            openLevel ===
              "fresher"
              ? null
              : "fresher"
          )
        }
      >
        <Text
          style={
            styles.levelDescription
          }
        >
          Learn these topics for
          entry-level software jobs.
        </Text>
        <BulletList
          items={
            item.fresher_topics
          }
          emptyText="No fresher-level topics found."
        />
        {item.goal ? (
          <View
            style={styles.goalBox}
          >
            <Text
              style={styles.goalLabel}
            >
              🎯 Fresher Goal
            </Text>
            <Text
              style={styles.goalText}
            >
              {cleanText(
                item.goal
              )}
            </Text>
          </View>
        ) : null}
      </InnerAccordion>
      <InnerAccordion
        title="🚀 After Getting a Job — Optional Advanced Topics"
        open={
          openLevel ===
          "advanced"
        }
        onPress={() =>
          setOpenLevel(
            openLevel ===
              "advanced"
              ? null
              : "advanced"
          )
        }
      >
        <Text
          style={
            styles.levelDescription
          }
        >
          These topics are optional.
          Learn them after becoming
          comfortable with fresher-level
          skills.
        </Text>
        <BulletList
          items={
            item.advanced_topics
          }
          emptyText="No advanced topics found."
        />
      </InnerAccordion>
    </View>
  );
}
// =========================================================
// LEARN NEXT
// =========================================================
function LearnNextSection({
  items,
}: {
  items: LearnNextItem[];
}) {
  const [
    openSkill,
    setOpenSkill,
  ] = useState<number | null>(
    null
  );
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return (
      <Text
        style={styles.emptyText}
      >
        No learning recommendations
        found.
      </Text>
    );
  }
  return (
    <View>
      <Text
        style={
          styles.explanationText
        }
      >
        These are the practical
        skills and courses recommended
        based on your current resume
        and entry-level job
        requirements.
      </Text>
      {items.map(
        (item, index) => (
          <View
            key={`${item.skill}-${index}`}
            style={
              styles.courseAccordion
            }
          >
            <Pressable
              onPress={() =>
                setOpenSkill(
                  openSkill === index
                    ? null
                    : index
                )
              }
              style={({
                pressed,
              }) => [
                styles.courseHeader,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.courseNumber
                }
              >
                <Text
                  style={
                    styles.courseNumberText
                  }
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={
                  styles.courseTitle
                }
              >
                {cleanText(
                  item.skill
                )}
              </Text>
              <Text
                style={
                  styles.smallArrow
                }
              >
                {openSkill ===
                index
                  ? "⌃"
                  : "›"}
              </Text>
            </Pressable>
            {openSkill ===
              index && (
              <View
                style={
                  styles.courseBody
                }
              >
                <LearnNextCard
                  item={item}
                  index={index}
                />
              </View>
            )}
          </View>
        )
      )}
    </View>
  );
}
// =========================================================
// PROJECT IDEA
// =========================================================
function ProjectIdeaCard({
  project,
  index,
}: {
  project: ProjectIdea;
  index: number;
}) {
  const [open, setOpen] =
    useState(false);
  return (
    <View
      style={
        styles.projectAccordion
      }
    >
      <Pressable
        onPress={() =>
          setOpen(!open)
        }
        style={({ pressed }) => [
          styles.projectHeader,
          pressed &&
            styles.pressed,
        ]}
      >
        <View
          style={
            styles.projectNumber
          }
        >
          <Text
            style={
              styles.projectNumberText
            }
          >
            {index + 1}
          </Text>
        </View>
        <Text
          style={
            styles.projectTitle
          }
        >
          {cleanText(
            project.project_name
          )}
        </Text>
        <Text
          style={
            styles.smallArrow
          }
        >
          {open ? "⌃" : "›"}
        </Text>
      </Pressable>
      {open && (
        <View
          style={
            styles.projectBody
          }
        >
          <View
            style={styles.projectPart}
          >
            <Text
              style={
                styles.projectPartTitle
              }
            >
              📝 About the Project
            </Text>
            <Text
              style={
                styles.normalText
              }
            >
              {cleanText(
                project.description
              ) ||
                "No project description available."}
            </Text>
          </View>
          <View
            style={styles.projectPart}
          >
            <Text
              style={
                styles.projectPartTitle
              }
            >
              🛠️ Technologies Used
            </Text>
            <View
              style={
                styles.technologyContainer
              }
            >
              {safeArray(
                project.technologies
              ).map(
                (
                  technology,
                  techIndex
                ) => (
                  <View
                    key={`${technology}-${techIndex}`}
                    style={
                      styles.technologyTag
                    }
                  >
                    <Text
                      style={
                        styles.technologyText
                      }
                    >
                      {technology}
                    </Text>
                  </View>
                )
              )}
            </View>
            {safeArray(
              project.technologies
            ).length === 0 && (
              <Text
                style={
                  styles.emptyText
                }
              >
                No technologies
                listed.
              </Text>
            )}
          </View>
          <View
            style={styles.projectPart}
          >
            <Text
              style={
                styles.projectPartTitle
              }
            >
              🖥️ Actual Output
            </Text>
            <BulletList
              items={
                project.actual_output
              }
              emptyText="No output details available."
            />
          </View>
        </View>
      )}
    </View>
  );
}
// =========================================================
// PROJECT IDEAS
// =========================================================
function ProjectIdeasSection({
  projects,
}: {
  projects: ProjectIdea[];
}) {
  if (
    !Array.isArray(projects) ||
    projects.length === 0
  ) {
    return (
      <Text
        style={styles.emptyText}
      >
        No project ideas found.
      </Text>
    );
  }
  return (
    <View>
      <Text
        style={
          styles.explanationText
        }
      >
        These project ideas are selected
        based on your current skills,
        recommended learning, existing
        projects, and fresher-level
        software roles.
      </Text>
      {projects.map(
        (project, index) => (
          <ProjectIdeaCard
            key={`${project.project_name}-${index}`}
            project={project}
            index={index}
          />
        )
      )}
    </View>
  );
}
// =========================================================
// CAREER ANALYSIS
// =========================================================
function CareerAnalysisSection({
  analysis,
}: {
  analysis: ResumeAnalysis;
}) {
  const career =
    analysis.career_analysis ||
    createEmptyAnalysis()
      .career_analysis;
  const [
    openSection,
    setOpenSection,
  ] = useState<
    | "have"
    | "learn"
    | "jobs"
    | "improve"
    | "next"
    | "projects"
    | null
  >(null);
  const toggleSection = (
    section:
      | "have"
      | "learn"
      | "jobs"
      | "improve"
      | "next"
      | "projects"
  ) => {
    setOpenSection(
      openSection === section
        ? null
        : section
    );
  };
  return (
    <View
      style={
        styles.careerContainer
      }
    >
      <InnerAccordion
        title="💪 What You Already Have"
        open={
          openSection ===
          "have"
        }
        onPress={() =>
          toggleSection("have")
        }
      >
        <Text
          style={
            styles.explanationText
          }
        >
          These are the skills,
          education, projects, and
          other useful information
          already present in your
          resume.
        </Text>

        <Text style={styles.profileGroupTitle}>
          🎓 Education
        </Text>
        <BulletList
          items={analysis.education}
          emptyText="No education information found."
        />

        <Text style={styles.profileGroupTitle}>
          🛠️ Skills
        </Text>
        <Text style={styles.profileGroupText}>
          {[
            ...safeArray(
              analysis.skills?.programming_languages
            ),
            ...safeArray(
              analysis.skills?.web_technologies
            ),
            ...safeArray(
              analysis.skills?.databases
            ),
            ...safeArray(
              analysis.skills?.tools_platforms
            ),
            ...safeArray(
              analysis.skills?.other
            ),
          ].join(", ") || "No skills found."}
        </Text>

        <Text style={styles.profileGroupTitle}>
          🚀 Projects
        </Text>
        <BulletList
          items={analysis.projects}
          emptyText="No projects found."
        />

        <Text style={styles.profileGroupTitle}>
          📜 Certifications
        </Text>
        <BulletList
          items={analysis.certifications}
          emptyText="No certifications found."
        />

        <Text style={styles.profileGroupTitle}>
          🌐 Languages
        </Text>
        <Text style={styles.profileGroupText}>
          {safeArray(analysis.languages).join(", ") ||
            "No languages found."}
        </Text>
      </InnerAccordion>
      <InnerAccordion
        title="📚 What You Should Learn Next"
        open={
          openSection ===
          "learn"
        }
        onPress={() =>
          toggleSection("learn")
        }
      >
        <LearnNextSection
          items={
            career.learn_next
          }
        />
      </InnerAccordion>
      <InnerAccordion
        title="🎯 Jobs You Can Apply For"
        open={
          openSection ===
          "jobs"
        }
        onPress={() =>
          toggleSection("jobs")
        }
      >
        <Text
          style={
            styles.explanationText
          }
        >
          These are entry-level roles
          that match your current
          resume.
        </Text>
        <BulletList
          items={
            career.jobs_you_can_apply_for
          }
          emptyText="No suitable roles found."
        />
      </InnerAccordion>
      <InnerAccordion
        title="🛠️ What You Should Improve"
        open={
          openSection ===
          "improve"
        }
        onPress={() =>
          toggleSection(
            "improve"
          )
        }
      >
        <Text
          style={
            styles.explanationText
          }
        >
          These are the areas you
          should improve based
          specifically on your resume
          and target software roles.
        </Text>
        <BulletList
          items={
            career.what_you_should_improve
          }
          emptyText="No improvement points found."
        />
      </InnerAccordion>
      <InnerAccordion
        title="➡️ Your Next Step"
        open={
          openSection ===
          "next"
        }
        onPress={() =>
          toggleSection("next")
        }
      >
        {career.your_next_step
          .length > 0 ? (
          career.your_next_step.map(
            (step, index) => (
              <View
                key={`${step}-${index}`}
                style={
                  styles.stepRow
                }
              >
                <View
                  style={
                    styles.stepNumber
                  }
                >
                  <Text
                    style={
                      styles.stepNumberText
                    }
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={
                    styles.stepText
                  }
                >
                  {cleanText(step)}
                </Text>
              </View>
            )
          )
        ) : (
          <Text
            style={
              styles.emptyText
            }
          >
            No next steps found.
          </Text>
        )}
      </InnerAccordion>
      <InnerAccordion
        title="💡 Project Ideas"
        open={
          openSection ===
          "projects"
        }
        onPress={() =>
          toggleSection(
            "projects"
          )
        }
      >
        <ProjectIdeasSection
          projects={
            career.project_ideas
          }
        />
      </InnerAccordion>
    </View>
  );
}
// =========================================================
// MAIN SCREEN
// =========================================================
export default function ResumeScreen() {
  const [loading, setLoading] =
    useState(false);
  const [analysis, setAnalysis] =
    useState<ResumeAnalysis | null>(
      null
    );
  const [
    openSection,
    setOpenSection,
  ] = useState<
    "resume" | "career" | null
  >(null);
  const [
    restoring,
    setRestoring,
  ] = useState(true);
  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState("");
  // IMPORTANT:
  // Prevent old saved data from coming back
  // after a new resume is selected.
  const hasUploadedNewResume =
    useRef(false);
  // =======================================================
  // RESTORE SAVED RESUME
  // =======================================================
  useEffect(() => {
    let mounted = true;
    const restoreResume =
      async () => {
        try {
          const savedAnalysis =
            await loadResumeAnalysis();
          if (
            mounted &&
            !hasUploadedNewResume.current &&
            savedAnalysis
          ) {
            setAnalysis(
              savedAnalysis
            );
            setOpenSection(
              "resume"
            );
          }
        } catch (error) {
          console.log(
            "Resume restore error:",
            error
          );
        } finally {
          if (mounted) {
            setRestoring(false);
          }
        }
      };
    restoreResume();
    return () => {
      mounted = false;
    };
  }, []);
  // =======================================================
  // UPLOAD RESUME
  // =======================================================
  const uploadResume =
    async () => {
      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type: [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ],
              copyToCacheDirectory: true,
            }
          );
        if (result.canceled) {
          return;
        }
        const selectedFile =
          result.assets?.[0];
        if (!selectedFile) {
          Alert.alert(
            "File Error",
            "No file was selected."
          );
          return;
        }
        // =================================================
        // NEW FILE SELECTED
        // CLEAR OLD RESUME IMMEDIATELY
        // =================================================
        hasUploadedNewResume.current =
          true;
        setAnalysis(null);
        setOpenSection(null);
        setSelectedFileName(
          selectedFile.name ||
            "Selected resume"
        );
        await clearSavedResumeAnalysis();
        setLoading(true);
        // =================================================
        // GET TOKEN
        // =================================================
        let token = "";
        if (
          Platform.OS === "web"
        ) {
          token =
            window.localStorage.getItem(
              "access_token"
            ) || "";
        } else {
          try {
            const AsyncStorage =
              require(
                "@react-native-async-storage/async-storage"
              ).default;
            token =
              (await AsyncStorage.getItem(
                "access_token"
              )) || "";
          } catch (
            storageError
          ) {
            console.log(
              "AsyncStorage error:",
              storageError
            );
          }
        }
        if (!token) {
          Alert.alert(
            "Login Required",
            "Please login first."
          );
          setLoading(false);
          return;
        }
        // =================================================
        // FORMDATA
        // =================================================
        const formData =
          new FormData();
        if (
          Platform.OS === "web"
        ) {
          const fileResponse =
            await fetch(
              selectedFile.uri
            );
          if (
            !fileResponse.ok
          ) {
            throw new Error(
              "Could not read the selected file."
            );
          }
          const blob =
            await fileResponse.blob();
          const browserFile =
            new File(
              [blob],
              selectedFile.name ||
                "resume.pdf",
              {
                type:
                  selectedFile.mimeType ||
                  blob.type ||
                  "application/pdf",
              }
            );
          formData.append(
            "file",
            browserFile
          );
        } else {
          formData.append(
            "file",
            {
              uri:
                selectedFile.uri,
              name:
                selectedFile.name ||
                "resume.pdf",
              type:
                selectedFile.mimeType ||
                "application/pdf",
            } as any
          );
        }
        // =================================================
        // SEND TO BACKEND
        // =================================================
        const response =
          await fetch(
            `${API_URL}/api/v1/resume/upload?ts=${Date.now()}`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              body: formData,
            }
          );
        // =================================================
        // READ RESPONSE
        // =================================================
        let data: any = null;
        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "Backend returned an invalid response."
          );
        }
        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Resume upload failed."
          );
        }
        // =================================================
        // FIND ANALYSIS
        // =================================================
        let rawAnalysis =
          data?.analysis;
        if (
          rawAnalysis ===
          undefined
        ) {
          rawAnalysis =
            data?.data?.analysis;
        }
        if (
          rawAnalysis ===
          undefined
        ) {
          rawAnalysis =
            data?.ai_analysis;
        }
        if (
          rawAnalysis ===
          undefined
        ) {
          throw new Error(
            "Resume analysis was not received from the backend."
          );
        }
        // =================================================
        // NORMALIZE ANALYSIS
        // =================================================
        const analysisData =
          normalizeAnalysis(
            rawAnalysis
          );
        // =================================================
        // SAVE NEW ANALYSIS
        // =================================================
        await saveResumeAnalysis(
          analysisData
        );
        // =================================================
        // DISPLAY ONLY NEW ANALYSIS
        // =================================================
        setAnalysis(
          analysisData
        );
        setOpenSection(
          "resume"
        );
      } catch (error: any) {
        console.log(
          "Resume upload error:",
          error
        );
        // IMPORTANT:
        // Never restore the previous resume
        // after upload failure.
        setAnalysis(null);
        setOpenSection(null);
        Alert.alert(
          "Upload Failed",
          error?.message ||
            "Something went wrong while uploading the resume."
        );
      } finally {
        setLoading(false);
      }
    };
  // =======================================================
  // UI
  // =======================================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text
          style={styles.pageTitle}
        >
          📄 Resume Analyzer
        </Text>
        <Text
          style={styles.pageSubtitle}
        >
          Upload your resume and get
          personalized career
          guidance.
        </Text>
      </View>
      {/* UPLOAD BUTTON */}
      <Pressable
        onPress={uploadResume}
        disabled={
          loading ||
          restoring
        }
        style={({ pressed }) => [
          styles.uploadButton,
          pressed &&
            styles.pressed,
          (loading ||
            restoring) &&
            styles.disabledButton,
        ]}
      >
        {loading ? (
          <View
            style={
              styles.loadingRow
            }
          >
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
            <Text
              style={
                styles.uploadButtonText
              }
            >
              Analyzing Resume...
            </Text>
          </View>
        ) : restoring ? (
          <View
            style={
              styles.loadingRow
            }
          >
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
            <Text
              style={
                styles.uploadButtonText
              }
            >
              Loading Saved Resume...
            </Text>
          </View>
        ) : (
          <Text
            style={
              styles.uploadButtonText
            }
          >
            📤 Upload Resume
          </Text>
        )}
      </Pressable>
      {/* SELECTED FILE */}
      {selectedFileName &&
        !loading && (
          <View
            style={
              styles.selectedFileBox
            }
          >
            <Text
              style={
                styles.selectedFileLabel
              }
            >
              Selected Resume
            </Text>
            <Text
              style={
                styles.selectedFileName
              }
              numberOfLines={2}
            >
              📎 {selectedFileName}
            </Text>
          </View>
        )}
      {/* ANALYZING MESSAGE */}
      {loading && (
        <View
          style={
            styles.analyzingBox
          }
        >
          <ActivityIndicator
            size="small"
            color="#2563EB"
          />
          <Text
            style={
              styles.analyzingText
            }
          >
            Reading your resume and
            generating personalized
            career analysis...
          </Text>
        </View>
      )}
      {/* RESULTS */}
      {analysis && !loading && (
        <View
          style={
            styles.resultsContainer
          }
        >
          {/* YOUR RESUME */}
          <MainAccordion
            title="📄 Your Resume"
            open={
              openSection ===
              "resume"
            }
            onPress={() =>
              setOpenSection(
                openSection ===
                  "resume"
                  ? null
                  : "resume"
              )
            }
          >
            <YourResumeSection
              analysis={
                analysis
              }
            />
          </MainAccordion>
          {/* CAREER ANALYSIS */}
          <MainAccordion
            title="🚀 Career Analysis"
            open={
              openSection ===
              "career"
            }
            onPress={() =>
              setOpenSection(
                openSection ===
                  "career"
                  ? null
                  : "career"
              )
            }
          >
            <CareerAnalysisSection
              analysis={
                analysis
              }
            />
          </MainAccordion>
        </View>
      )}
      {/* EMPTY STATE */}
      {!analysis &&
        !loading &&
        !restoring && (
          <View
            style={
              styles.emptyState
            }
          >
            <Text
              style={
                styles.emptyStateIcon
              }
            >
              📄
            </Text>
            <Text
              style={
                styles.emptyStateTitle
              }
            >
              No Resume Uploaded
            </Text>
            <Text
              style={
                styles.emptyStateText
            }
            >
              Upload your PDF or DOCX
              resume to see your
              resume details and
              personalized career
              suggestions.
            </Text>
          </View>
        )}
    </ScrollView>
  );
}
// =========================================================
// STYLES
// =========================================================
const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F6F8FC",
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 60,
    },
    header: {
      marginBottom: 20,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: "#172033",
      marginBottom: 7,
    },
    pageSubtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: "#667085",
    },
    uploadButton: {
      backgroundColor:
        "#2563EB",
      borderRadius: 14,
      minHeight: 52,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 12,
    },
    uploadButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    loadingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },
    disabledButton: {
      opacity: 0.7,
    },
    pressed: {
      opacity: 0.75,
    },
    selectedFileBox: {
      backgroundColor:
        "#EEF4FF",
      borderWidth: 1,
      borderColor:
        "#C7D7FE",
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    selectedFileLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: "#475467",
      marginBottom: 4,
      textTransform:
        "uppercase",
    },
    selectedFileName: {
      fontSize: 13,
      lineHeight: 19,
      color: "#175CD3",
      fontWeight: "600",
    },
    analyzingBox: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#D0D5DD",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },
    analyzingText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: "#475467",
    },
    resultsContainer: {
      gap: 14,
    },
    mainAccordion: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },
    mainAccordionHeader: {
      minHeight: 62,
      paddingHorizontal: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },
    mainAccordionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#172033",
      flex: 1,
    },
    arrow: {
      fontSize: 28,
      color: "#475467",
      lineHeight: 30,
      marginLeft: 10,
    },
    mainAccordionBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#EEF0F4",
    },
    innerAccordion: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 12,
      marginTop: 10,
      overflow:
        "hidden",
    },
    innerAccordionHeader: {
      minHeight: 52,
      paddingHorizontal: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },
    innerAccordionTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: "#1D2939",
    },
    smallArrow: {
      fontSize: 24,
      color: "#667085",
      marginLeft: 8,
    },
    innerAccordionBody: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#EEF0F4",
    },
    sectionCard: {
      backgroundColor:
        "#FAFBFD",
      borderRadius: 12,
      padding: 15,
      marginTop: 12,
      borderWidth: 1,
      borderColor:
        "#E9ECF2",
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1D2939",
      marginBottom: 12,
    },
    normalText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#475467",
    },
    emptyText: {
      fontSize: 13,
      lineHeight: 19,
      color: "#98A2B3",
    },
    explanationText: {
      fontSize: 13,
      lineHeight: 20,
      color: "#667085",
      marginBottom: 12,
    },
    bulletRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      marginBottom: 8,
    },
    bullet: {
      width: 18,
      fontSize: 16,
      color: "#2563EB",
      fontWeight: "800",
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: "#475467",
    },
    skillGroup: {
      marginBottom: 15,
    },
    skillGroupTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#667085",
      marginBottom: 8,
    },
    skillTagsContainer: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },
    skillTag: {
      backgroundColor:
        "#EEF4FF",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    skillTagText: {
      color: "#175CD3",
      fontSize: 13,
      fontWeight: "600",
    },
    courseAccordion: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      borderRadius: 12,
      marginBottom: 10,
      overflow:
        "hidden",
    },
    courseHeader: {
      minHeight: 58,
      paddingHorizontal: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
    },
    courseNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#2563EB",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },
    courseNumberText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },
    courseTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "800",
      color: "#172033",
    },
    courseBody: {
      padding: 8,
      paddingTop: 0,
    },
    learnCard: {
      backgroundColor:
        "#F8FAFC",
      borderRadius: 10,
      padding: 8,
    },
    learnHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      padding: 8,
    },
    numberCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#2563EB",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },
    numberText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 13,
    },
    learnTitleArea: {
      flex: 1,
    },
    learnSkill: {
      fontSize: 16,
      fontWeight: "800",
      color: "#172033",
      marginBottom: 4,
    },
    learnSubText: {
      fontSize: 12,
      lineHeight: 18,
      color: "#667085",
    },
    levelDescription: {
      fontSize: 13,
      lineHeight: 20,
      color: "#667085",
      marginBottom: 10,
    },
    goalBox: {
      backgroundColor:
        "#F0FDF4",
      borderRadius: 10,
      padding: 11,
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        "#DCFCE7",
    },
    goalLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: "#166534",
      marginBottom: 5,
    },
    goalText: {
      fontSize: 13,
      lineHeight: 19,
      color: "#475467",
    },
    projectAccordion: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#E4E7EC",
      overflow:
        "hidden",
      marginBottom: 10,
    },
    projectHeader: {
      minHeight: 58,
      paddingHorizontal: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
    },
    projectNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#7F56D9",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },
    projectNumberText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },
    projectTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "800",
      color: "#172033",
    },
    projectBody: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#EEF0F4",
      backgroundColor:
        "#FAFBFD",
    },
    projectPart: {
      marginBottom: 18,
    },
    projectPartTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: "#344054",
      marginBottom: 9,
    },
    technologyContainer: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },
    technologyTag: {
      backgroundColor:
        "#F4EBFF",
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    technologyText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#6941C6",
    },
    stepRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      marginBottom: 11,
    },
    stepNumber: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor:
        "#EEF4FF",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },
    stepNumberText: {
      color: "#175CD3",
      fontSize: 12,
      fontWeight: "800",
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: "#475467",
      paddingTop: 2,
    },
    emptyState: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 28,
      alignItems:
        "center",
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },
    emptyStateIcon: {
      fontSize: 42,
      marginBottom: 12,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#172033",
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#667085",
      textAlign:
        "center",
    },
    profileGroupTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: "#334155",
      marginTop: 10,
      marginBottom: 4,
    },
    profileGroupText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#475569",
      marginBottom: 5,
    },
    careerContainer: {
      paddingTop: 2,
    },
  });
