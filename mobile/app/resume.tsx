import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

// =========================================================
// API
// =========================================================

const API_URL =
  "https://ai-career-assistant-5pqr.onrender.com";

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
// TEXT HELPERS
// =========================================================

function cleanText(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value
      .replace(/\*\*\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .replace(/^[-•]\s*/, "")
      .trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, any>;

    if (obj.value !== undefined) {
      return cleanText(obj.value);
    }

    if (
      obj.name !== undefined &&
      obj.issuer !== undefined
    ) {
      const name = cleanText(obj.name);
      const issuer = cleanText(obj.issuer);

      return issuer
        ? `${name} — ${issuer}`
        : name;
    }

    if (obj.role !== undefined) {
      const role = cleanText(obj.role);
      const reason = cleanText(obj.reason);

      return reason
        ? `${role} — ${reason}`
        : role;
    }

    if (obj.title !== undefined) {
      const title = cleanText(obj.title);
      const description = cleanText(obj.description);

      return description
        ? `${title} — ${description}`
        : title;
    }

    if (
      obj.category !== undefined &&
      obj.value !== undefined
    ) {
      return `${cleanText(obj.category)}: ${cleanText(
        obj.value
      )}`;
    }

    const preferredKeys = [
      "text",
      "display",
      "label",
      "course_name",
      "project_name",
    ];

    for (const key of preferredKeys) {
      if (obj[key] !== undefined) {
        const text = cleanText(obj[key]);

        if (text) {
          return text;
        }
      }
    }
  }

  return "";
}

function safeArray(value: any): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const text = cleanText(item);

    if (!text || text === "[object Object]") {
      continue;
    }

    const key = text.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  }

  return result;
}

// =========================================================
// EDUCATION
// =========================================================

function formatEducationRecord(record: any): string {
  if (typeof record === "string") {
    return cleanText(record);
  }

  if (!record || typeof record !== "object") {
    return "";
  }

  const degree = cleanText(
    record.degree || record.qualification
  );

  const specialization = cleanText(
    record.specialization
  );

  const college = cleanText(record.college);

  const cgpa = cleanText(
    record.cgpa || record.gpa
  );

  const percentage = cleanText(
    record.percentage
  );

  const duration = cleanText(
    record.duration
  );

  let qualification = degree;

  if (degree.toUpperCase() === "MBA") {
    qualification = specialization
      ? `MBA — ${specialization}`
      : "MBA";
  }

  const details = [
    qualification,
    duration,
    cgpa ? `CGPA: ${cgpa}` : "",
    percentage
      ? `${percentage.replace(/%$/, "")}%`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");

  if (college && details) {
    return `${college} — ${details}`;
  }

  return college || details;
}

function normalizeEducation(raw: any) {
  const direct = safeArray(raw?.education);

  if (direct.length > 0) {
    return {
      education: direct,
      details: [],
    };
  }

  const source = Array.isArray(
    raw?.education_details
  )
    ? raw.education_details
    : [];

  const formatted: string[] = [];
  const seen = new Set<string>();

  for (const record of source) {
    const value = formatEducationRecord(record);

    if (!value) {
      continue;
    }

    const key = value
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

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

// =========================================================
// LANGUAGES
// =========================================================

const HUMAN_LANGUAGE_NAMES = [
  "english",
  "telugu",
  "hindi",
  "kannada",
  "tamil",
  "malayalam",
  "marathi",
  "bengali",
  "gujarati",
  "punjabi",
  "urdu",
  "odia",
];

const PROGRAMMING_LANGUAGE_NAMES = [
  "c",
  "c++",
  "c#",
  "java",
  "python",
  "javascript",
  "typescript",
  "kotlin",
  "swift",
  "php",
  "ruby",
  "go",
  "rust",
  "scala",
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

    if (!text) {
      continue;
    }

    const lower = text.toLowerCase();

    if (
      PROGRAMMING_LANGUAGE_NAMES.some(
        (name) =>
          lower === name ||
          lower.startsWith(`${name} `)
      )
    ) {
      continue;
    }

    const parts = text
      .split(/,|;|\||\s+&\s+/)
      .map(cleanText)
      .filter(Boolean);

    for (const part of parts) {
      if (
        HUMAN_LANGUAGE_NAMES.some((name) =>
          part.toLowerCase().includes(name)
        )
      ) {
        const key = part.toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          result.push(part);
        }
      }
    }
  }

  return result;
}

// =========================================================
// PROFILE
// =========================================================

function profileItemsFromObject(
  profile: any
): string[] {
  if (!profile || typeof profile !== "object") {
    return [];
  }

  const result: string[] = [];

  const addGroup = (
    label: string,
    value: any
  ) => {
    const items = safeArray(value);

    for (const item of items) {
      result.push(`${label}: ${item}`);
    }
  };

  addGroup("Education", profile.education);
  addGroup("Skill", profile.skills);
  addGroup("Project", profile.projects);
  addGroup(
    "Certification",
    profile.certifications
  );
  addGroup(
    "Experience",
    profile.internships_experience
  );
  addGroup("Language", profile.languages);
  addGroup(
    "Achievement",
    profile.achievements
  );

  return result;
}

// =========================================================
// PROJECT IDEAS
// =========================================================

function normalizeProjectIdeas(
  value: any
): ProjectIdea[] {
  if (!Array.isArray(value)) {
    return [];
  }

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

      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        project_name: cleanText(
          item.project_name ||
            item.title ||
            item.name
        ),
        description: cleanText(
          item.description
        ),
        technologies: safeArray(
          item.technologies
        ),
        actual_output: safeArray(
          item.actual_output ||
            item.output ||
            item.outputs
        ),
      };
    })
    .filter(
      (item): item is ProjectIdea =>
        Boolean(item?.project_name)
    );
}

function fallbackProjectIdeas(
  specialization: string
): ProjectIdea[] {
  const value = specialization.toLowerCase();

  if (value.includes("finance")) {
    return [
      {
        project_name:
          "Personal Expense & Budget Analyzer",
        description:
          "Track income, expenses, budgets and spending patterns.",
        technologies: [
          "Python",
          "Excel",
          "Power BI",
        ],
        actual_output: [
          "Expense dashboard",
          "Budget summary",
          "Monthly spending charts",
        ],
      },
      {
        project_name:
          "Financial Analysis Dashboard",
        description:
          "Analyze revenue, expenses and financial trends.",
        technologies: [
          "Excel",
          "Power BI",
        ],
        actual_output: [
          "Financial KPI dashboard",
          "Trend charts",
          "Financial report",
        ],
      },
    ];
  }

  if (
    value.includes("hr") ||
    value.includes("human resource")
  ) {
    return [
      {
        project_name:
          "Recruitment Analytics Dashboard",
        description:
          "Analyze applications, interviews and hiring performance.",
        technologies: [
          "Excel",
          "Power BI",
        ],
        actual_output: [
          "Recruitment funnel",
          "Hiring KPI dashboard",
          "Recruitment report",
        ],
      },
      {
        project_name:
          "Employee Management System",
        description:
          "Maintain employee records and employment information.",
        technologies: [
          "Python",
          "SQL",
        ],
        actual_output: [
          "Employee records",
          "Search functionality",
          "Employee reports",
        ],
      },
    ];
  }

  return [
    {
      project_name:
        "Job & Skill Gap Analyzer",
      description:
        "Compare resume skills with job requirements.",
      technologies: [
        "Python",
        "FastAPI",
        "React Native",
        "PostgreSQL",
      ],
      actual_output: [
        "Skill comparison",
        "Missing skills list",
        "Learning recommendations",
      ],
    },
    {
      project_name:
        "Student Placement Preparation App",
      description:
        "Help students prepare for aptitude, coding and interviews.",
      technologies: [
        "Python",
        "React Native",
        "PostgreSQL",
      ],
      actual_output: [
        "Practice modules",
        "Progress tracking",
        "Interview preparation",
      ],
    },
    {
      project_name:
        "AI Resume Analyzer",
      description:
        "Analyze resumes and generate career recommendations.",
      technologies: [
        "Python",
        "FastAPI",
        "Gemini API",
        "React Native",
      ],
      actual_output: [
        "Resume analysis",
        "Skill recommendations",
        "Career guidance",
      ],
    },
  ];
}

// =========================================================
// NORMALIZE ANALYSIS
// =========================================================

function normalizeAnalysis(
  value: any
): ResumeAnalysis {
  let raw = value;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {
        summary: cleanText(raw),
        education: [],
        skills: {
          programming_languages: [],
          web_technologies: [],
          databases: [],
          tools_platforms: [],
          other: [],
        },
        projects: [],
        certifications: [],
        internships_experience: [],
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
  }

  if (
    raw?.analysis &&
    typeof raw.analysis === "object"
  ) {
    raw = raw.analysis;
  }

  if (
    raw?.data?.analysis &&
    typeof raw.data.analysis === "object"
  ) {
    raw = raw.data.analysis;
  }

  const education = normalizeEducation(raw);

  const careerRaw =
    raw?.career_analysis || {};

  const learnNext: LearnNextItem[] =
    Array.isArray(careerRaw.learn_next)
      ? careerRaw.learn_next
          .map((item: any) => ({
            skill: cleanText(
              item?.skill ||
                item?.course_name ||
                item?.name
            ),
            fresher_topics: safeArray(
              item?.fresher_topics
            ),
            goal: cleanText(
              item?.goal
            ),
            advanced_topics: safeArray(
              item?.advanced_topics
            ),
          }))
          .filter(
            (item: LearnNextItem) =>
              Boolean(item.skill)
          )
      : [];

  const existingProfile =
    safeArray(
      careerRaw.what_you_already_have
    ).length > 0
      ? safeArray(
          careerRaw.what_you_already_have
        )
      : profileItemsFromObject(
          careerRaw.current_profile ||
            raw?.current_profile
        );

  const jobs = safeArray(
    careerRaw.jobs_you_can_apply_for ||
      careerRaw.suitable_roles ||
      raw?.jobs_you_can_apply_for
  );

  const improvements = safeArray(
    careerRaw.what_you_should_improve ||
      careerRaw.improve
  );

  const nextSteps = safeArray(
    careerRaw.your_next_step ||
      careerRaw.next_steps ||
      raw?.your_next_step
  );

  const projectIdeas =
    normalizeProjectIdeas(
      careerRaw.project_ideas ||
        raw?.project_ideas
    );

  const specialization = cleanText(
    raw?.specialization ||
      careerRaw.current_profile
        ?.specialization ||
      ""
  );

  const finalJobs =
    jobs.length > 0
      ? jobs
      : specialization
          .toLowerCase()
          .includes("computer")
        ? [
            "Software Developer Trainee",
            "Frontend Developer Trainee",
            "Web Developer Trainee",
          ]
        : specialization
              .toLowerCase()
              .includes("finance")
          ? [
              "Finance Executive",
              "Financial Analyst Trainee",
            ]
          : specialization
                .toLowerCase()
                .includes("hr")
            ? [
                "HR Executive",
                "Recruitment / Talent Acquisition Trainee",
              ]
            : [];

  const finalImprove =
    improvements.length > 0
      ? improvements
      : [
          "Strengthen the skills marked Basic or Beginner.",
          "Build at least one practical project.",
          "Practice interview questions for your target role.",
        ];

  const finalNextSteps =
    nextSteps.length > 0
      ? nextSteps
      : [
          "Follow the recommended learning path.",
          "Build one practical project.",
          "Prepare to explain your projects in interviews.",
          "Practice role-specific interview questions.",
        ];

  const finalProjectIdeas =
    projectIdeas.length > 0
      ? projectIdeas
      : fallbackProjectIdeas(
          specialization
        );

  const languages = normalizeLanguages(
    raw?.languages ??
      careerRaw.current_profile?.languages
  );

  const profileFallback =
    existingProfile.length > 0
      ? existingProfile
      : [
          ...education.education.map(
            (item) =>
              `Education: ${item}`
          ),
          ...safeArray(
            raw?.skills?.programming_languages
          ).map(
            (item) =>
              `Skill: ${item}`
          ),
          ...safeArray(
            raw?.skills?.web_technologies
          ).map(
            (item) =>
              `Skill: ${item}`
          ),
          ...safeArray(
            raw?.skills?.databases
          ).map(
            (item) =>
              `Skill: ${item}`
          ),
          ...safeArray(
            raw?.skills?.tools_platforms
          ).map(
            (item) =>
              `Skill: ${item}`
          ),
          ...safeArray(
            raw?.projects
          ).map(
            (item) =>
              `Project: ${item}`
          ),
        ];

  return {
    summary: cleanText(
      raw?.summary || ""
    ),

    education:
      education.education,

    education_details:
      education.details,

    specialization,

    skills: {
      programming_languages:
        safeArray(
          raw?.skills
            ?.programming_languages
        ),

      web_technologies:
        safeArray(
          raw?.skills
            ?.web_technologies
        ),

      databases: safeArray(
        raw?.skills?.databases
      ),

      tools_platforms: safeArray(
        raw?.skills?.tools_platforms
      ),

      other: safeArray(
        raw?.skills?.other
      ),
    },

    skill_details: safeArray(
      raw?.skill_details ||
        raw?.skills?.details
    ),

    projects: safeArray(
      raw?.projects
    ),

    certifications: safeArray(
      raw?.certifications
    ),

    internships_experience:
      safeArray(
        raw?.internships_experience ||
          raw?.experience
      ),

    languages,

    achievements: safeArray(
      raw?.achievements
    ),

    personal_information:
      safeArray(
        raw?.personal_information
      ),

    profile_found:
      Boolean(raw?.profile_found) ||
      profileFallback.length > 0,

    career_analysis: {
      what_you_already_have:
        profileFallback,

      learn_next: learnNext,

      jobs_you_can_apply_for:
        finalJobs,

      what_you_should_improve:
        finalImprove,

      your_next_step:
        finalNextSteps,

      project_ideas:
        finalProjectIdeas,
    },
  };
}

// =========================================================
// STORAGE
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
    } else {
      await AsyncStorage.setItem(
        SAVED_RESUME_ANALYSIS_KEY,
        value
      );
    }
  } catch (error) {
    console.log(
      "Save resume error:",
      error
    );
  }
}

async function clearSavedResumeAnalysis() {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(
        SAVED_RESUME_ANALYSIS_KEY
      );

      window.localStorage.removeItem(
        OLD_SAVED_RESUME_ANALYSIS_KEY
      );
    } else {
      await AsyncStorage.multiRemove([
        SAVED_RESUME_ANALYSIS_KEY,
        OLD_SAVED_RESUME_ANALYSIS_KEY,
      ]);
    }
  } catch (error) {
    console.log(
      "Clear resume error:",
      error
    );
  }
}

async function loadResumeAnalysis(): Promise<ResumeAnalysis | null> {
  try {
    let savedValue = "";

    if (Platform.OS === "web") {
      savedValue =
        window.localStorage.getItem(
          SAVED_RESUME_ANALYSIS_KEY
        ) || "";
    } else {
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
      "Load resume error:",
      error
    );

    return null;
  }
}

// =========================================================
// SMALL UI COMPONENTS
// =========================================================

function BulletList({
  items,
  emptyText = "No information found.",
}: {
  items: string[];
  emptyText?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <Text style={styles.emptyText}>
        {emptyText}
      </Text>
    );
  }

  return (
    <View>
      {items.map((item, index) => (
        <View
          key={`${item}-${index}`}
          style={styles.bulletRow}
        >
          <Text style={styles.bullet}>
            •
          </Text>

          <Text style={styles.bulletText}>
            {cleanText(item)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

function SkillGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.skillGroup}>
      <Text style={styles.skillGroupTitle}>
        {title}
      </Text>

      <View style={styles.tagContainer}>
        {items.map((item, index) => (
          <View
            key={`${item}-${index}`}
            style={styles.skillTag}
          >
            <Text style={styles.skillTagText}>
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =========================================================
// RESUME SECTION
// =========================================================

function ResumeDetails({
  analysis,
}: {
  analysis: ResumeAnalysis;
}) {
  const skills =
    analysis.skills;

  return (
    <View>
      <SectionCard title="📝 Summary">
        <Text style={styles.bodyText}>
          {analysis.summary ||
            "No summary found."}
        </Text>
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
          <Text style={styles.emptyText}>
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

      <SectionCard title="📜 Certifications">
        <BulletList
          items={
            analysis.certifications
          }
          emptyText="No certifications found."
        />
      </SectionCard>

      <SectionCard title="💼 Internship / Experience">
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
              analysis.languages || []
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
              analysis.achievements || []
            }
          />
        </SectionCard>
      )}
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
  if (!items || items.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No learning recommendations found.
      </Text>
    );
  }

  return (
    <View>
      {items.map((item, index) => (
        <View
          key={`${item.skill}-${index}`}
          style={styles.learnCard}
        >
          <Text style={styles.learnTitle}>
            {index + 1}.{" "}
            {cleanText(item.skill)}
          </Text>

          {item.goal ? (
            <Text style={styles.bodyText}>
              🎯 Goal: {item.goal}
            </Text>
          ) : null}

          {item.fresher_topics
            .length > 0 && (
            <View>
              <Text
                style={
                  styles.subHeading
                }
              >
                🌱 Fresher Level
              </Text>

              <BulletList
                items={
                  item.fresher_topics
                }
              />
            </View>
          )}

          {item.advanced_topics
            .length > 0 && (
            <View>
              <Text
                style={
                  styles.subHeading
                }
              >
                🚀 Advanced Level
              </Text>

              <BulletList
                items={
                  item.advanced_topics
                }
              />
            </View>
          )}
        </View>
      ))}
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
  if (!projects || projects.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No project ideas found.
      </Text>
    );
  }

  return (
    <View>
      {projects.map(
        (project, index) => (
          <View
            key={`${project.project_name}-${index}`}
            style={styles.projectCard}
          >
            <Text
              style={
                styles.projectTitle
              }
            >
              {index + 1}.{" "}
              {project.project_name}
            </Text>

            {project.description ? (
              <Text
                style={
                  styles.bodyText
                }
              >
                {project.description}
              </Text>
            ) : null}

            {project.technologies
              .length > 0 && (
              <View>
                <Text
                  style={
                    styles.subHeading
                  }
                >
                  🧰 Technologies
                </Text>

                <View
                  style={
                    styles.tagContainer
                  }
                >
                  {project.technologies.map(
                    (
                      technology,
                      techIndex
                    ) => (
                      <View
                        key={`${technology}-${techIndex}`}
                        style={
                          styles.skillTag
                        }
                      >
                        <Text
                          style={
                            styles.skillTagText
                          }
                        >
                          {technology}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            )}

            {project.actual_output
              .length > 0 && (
              <View>
                <Text
                  style={
                    styles.subHeading
                  }
                >
                  📦 Actual Output
                </Text>

                <BulletList
                  items={
                    project.actual_output
                  }
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
// CAREER ANALYSIS
// =========================================================

function CareerDetails({
  analysis,
}: {
  analysis: ResumeAnalysis;
}) {
  const career =
    analysis.career_analysis;

  return (
    <View>
      <SectionCard title="👤 What You Already Have">
        <BulletList
          items={
            career.what_you_already_have
          }
          emptyText="No current profile information found."
        />
      </SectionCard>

      <SectionCard title="📚 What You Should Learn Next">
        <LearnNextSection
          items={career.learn_next}
        />
      </SectionCard>

      <SectionCard title="🎯 Jobs You Can Apply For">
        <BulletList
          items={
            career.jobs_you_can_apply_for
          }
          emptyText="No suitable roles found."
        />
      </SectionCard>

      <SectionCard title="🛠️ What You Should Improve">
        <BulletList
          items={
            career.what_you_should_improve
          }
          emptyText="No improvement points found."
        />
      </SectionCard>

      <SectionCard title="➡️ Your Next Step">
        <BulletList
          items={
            career.your_next_step
          }
          emptyText="No next steps found."
        />
      </SectionCard>

      <SectionCard title="💡 Project Ideas">
        <ProjectIdeasSection
          projects={
            career.project_ideas
          }
        />
      </SectionCard>
    </View>
  );
}

// =========================================================
// MAIN SCREEN
// =========================================================

export default function ResumeScreen() {
  const [loading, setLoading] =
    useState(false);

  const [restoring, setRestoring] =
    useState(true);

  const [analysis, setAnalysis] =
    useState<ResumeAnalysis | null>(
      null
    );

  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState("");

  const [
    uploadError,
    setUploadError,
  ] = useState("");

  const [
    activeSection,
    setActiveSection,
  ] = useState<
    "resume" | "career" | null
  >(null);

  // =======================================================
  // RESTORE SAVED ANALYSIS
  // =======================================================

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const saved =
          await loadResumeAnalysis();

        if (
          mounted &&
          saved
        ) {
          setAnalysis(saved);
          setActiveSection(
            "resume"
          );
        }
      } catch (error) {
        console.log(
          "Restore error:",
          error
        );
      } finally {
        if (mounted) {
          setRestoring(false);
        }
      }
    };

    restore();

    return () => {
      mounted = false;
    };
  }, []);

  // =======================================================
  // UPLOAD RESUME
  // =======================================================

  const uploadResume = async () => {
    setUploadError("");

    try {
      // -----------------------------------------------------
      // PICK FILE
      // -----------------------------------------------------

      const result =
        await DocumentPicker.getDocumentAsync(
          {
            type: [
              "application/pdf",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ],
            copyToCacheDirectory: true,
            multiple: false,
          }
        );

      if (result.canceled) {
        return;
      }

      const selectedFile =
        result.assets?.[0];

      if (!selectedFile) {
        throw new Error(
          "No resume file was selected."
        );
      }

      // -----------------------------------------------------
      // RESET OLD RESULT
      // -----------------------------------------------------

      setAnalysis(null);
      setActiveSection(null);
      setUploadError("");

      setSelectedFileName(
        selectedFile.name ||
          "Selected resume"
      );

      await clearSavedResumeAnalysis();

      setLoading(true);

      // -----------------------------------------------------
      // GET LOGIN TOKEN
      // -----------------------------------------------------

      let token = "";

      if (Platform.OS === "web") {
        token =
          window.localStorage.getItem(
            "access_token"
          ) || "";
      } else {
        token =
          (await AsyncStorage.getItem(
            "access_token"
          )) || "";
      }

      if (!token) {
        throw new Error(
          "Please login first and then upload your resume."
        );
      }

      // -----------------------------------------------------
      // WEB UPLOAD
      // -----------------------------------------------------

      if (Platform.OS === "web") {
        const formData =
          new FormData();

        const fileResponse =
          await fetch(
            selectedFile.uri
          );

        if (!fileResponse.ok) {
          throw new Error(
            "Could not read the selected resume."
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

        const responseText =
          await response.text();

        console.log(
          "Resume API status:",
          response.status
        );

        console.log(
          "Resume API response:",
          responseText
        );

        let data: any = null;

        try {
          data = responseText
            ? JSON.parse(
                responseText
              )
            : null;
        } catch {
          throw new Error(
            `Backend returned an invalid response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            cleanText(
              data?.detail ||
                data?.message ||
                data?.error ||
                `Upload failed with status ${response.status}.`
            )
          );
        }

        await processSuccessfulResponse(
          data
        );

        return;
      }

      // -----------------------------------------------------
      // ANDROID / IOS UPLOAD
      // -----------------------------------------------------
      //
      // IMPORTANT:
      // Do NOT use FormData.append({ uri, name, type })
      // here.
      //
      // FileSystem.uploadAsync handles the native
      // multipart file upload.
      // -----------------------------------------------------

      if (!selectedFile.uri) {
        throw new Error(
          "Could not access the selected resume file."
        );
      }

      const mimeType =
        selectedFile.mimeType ||
        (selectedFile.name
          ?.toLowerCase()
          .endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf");

      console.log(
        "Uploading native resume:",
        selectedFile.uri
      );

      const uploadResult =
        await FileSystem.uploadAsync(
          `${API_URL}/api/v1/resume/upload?ts=${Date.now()}`,
          selectedFile.uri,
          {
            httpMethod: "POST",

            uploadType:
              FileSystem.FileSystemUploadType
                .MULTIPART,

            fieldName: "file",

            mimeType,

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "Resume upload status:",
        uploadResult.status
      );

      console.log(
        "Resume upload response:",
        uploadResult.body
      );

      let data: any = null;

      try {
        data = uploadResult.body
          ? JSON.parse(
              uploadResult.body
            )
          : null;
      } catch {
        throw new Error(
          `Backend returned an invalid response (${uploadResult.status}).`
        );
      }

      if (
        uploadResult.status < 200 ||
        uploadResult.status >= 300
      ) {
        throw new Error(
          cleanText(
            data?.detail ||
              data?.message ||
              data?.error ||
              `Resume upload failed with status ${uploadResult.status}.`
          )
        );
      }

      await processSuccessfulResponse(
        data
      );
    } catch (error: any) {
      console.log(
        "Resume upload error:",
        error
      );

      setAnalysis(null);
      setActiveSection(null);

      setUploadError(
        error?.message ||
          "Something went wrong while uploading the resume."
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // RESPONSE PROCESSOR
  // =======================================================

  const processSuccessfulResponse =
    async (data: any) => {
      // Backend currently returns:
      // {
      //   message: "...",
      //   resume_id: ...,
      //   user_id: ...,
      //   filename: "...",
      //   text_length: ...,
      //   ai_analysis: {...}
      // }

      let rawAnalysis =
        data?.ai_analysis ??
        data?.analysis ??
        data?.data?.analysis ??
        null;

      if (
        rawAnalysis === null ||
        rawAnalysis === undefined
      ) {
        throw new Error(
          "Resume uploaded successfully, but the backend did not return the resume analysis."
        );
      }

      const analysisData =
        normalizeAnalysis(
          rawAnalysis
        );

      await saveResumeAnalysis(
        analysisData
      );

      setUploadError("");

      setAnalysis(
        analysisData
      );

      setActiveSection(
        "resume"
      );
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
        <Text style={styles.pageTitle}>
          📄 Resume Analyzer
        </Text>

        <Text style={styles.pageSubtitle}>
          Upload your resume and get
          personalized career guidance.
        </Text>
      </View>

      {/* UPLOAD BUTTON */}

      <Pressable
        onPress={uploadResume}
        disabled={
          loading || restoring
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
            style={styles.loadingRow}
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
            style={styles.loadingRow}
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

      {/* LOADING */}

      {loading && (
        <View
          style={styles.analyzingBox}
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
            Uploading your resume,
            reading the file and
            generating personalized
            career analysis...
          </Text>
        </View>
      )}

      {/* ERROR */}

      {uploadError &&
        !loading && (
          <View
            style={styles.errorBox}
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              ⚠️ Resume Upload Error
            </Text>

            <Text
              style={
                styles.errorMessage
              }
            >
              {uploadError}
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
          {/* RESUME */}

          <Pressable
            onPress={() =>
              setActiveSection(
                activeSection ===
                  "resume"
                  ? null
                  : "resume"
              )
            }
            style={
              styles.mainAccordion
            }
          >
            <View
              style={
                styles.mainAccordionHeader
              }
            >
              <Text
                style={
                  styles.mainAccordionTitle
                }
              >
                📄 Your Resume
              </Text>

              <Text
                style={styles.arrow}
              >
                {activeSection ===
                "resume"
                  ? "⌃"
                  : "⌄"}
              </Text>
            </View>
          </Pressable>

          {activeSection ===
            "resume" && (
            <View
              style={
                styles.accordionBody
              }
            >
              <ResumeDetails
                analysis={
                  analysis
                }
              />
            </View>
          )}

          {/* CAREER */}

          <Pressable
            onPress={() =>
              setActiveSection(
                activeSection ===
                  "career"
                  ? null
                  : "career"
              )
            }
            style={
              styles.mainAccordion
            }
          >
            <View
              style={
                styles.mainAccordionHeader
              }
            >
              <Text
                style={
                  styles.mainAccordionTitle
                }
              >
                🚀 Career Analysis
              </Text>

              <Text
                style={styles.arrow}
              >
                {activeSection ===
                "career"
                  ? "⌃"
                  : "⌄"}
              </Text>
            </View>
          </Pressable>

          {activeSection ===
            "career" && (
            <View
              style={
                styles.accordionBody
              }
            >
              <CareerDetails
                analysis={
                  analysis
                }
              />
            </View>
          )}
        </View>
      )}

      {/* EMPTY */}

      {!analysis &&
        !loading &&
        !restoring &&
        !uploadError && (
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
      flexDirection: "row",
      alignItems: "center",
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
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    analyzingText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: "#475467",
    },

    errorBox: {
      backgroundColor:
        "#FEF2F2",
      borderWidth: 1,
      borderColor:
        "#FECACA",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },

    errorTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#B91C1C",
      marginBottom: 6,
    },

    errorMessage: {
      fontSize: 13,
      lineHeight: 20,
      color: "#7F1D1D",
    },

    resultsContainer: {
      gap: 12,
    },

    mainAccordion: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      overflow: "hidden",
    },

    mainAccordionHeader: {
      minHeight: 62,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
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

    accordionBody: {
      backgroundColor:
        "#F6F8FC",
      paddingTop: 4,
    },

    sectionCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: "#172033",
      marginBottom: 12,
    },

    bodyText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#475467",
    },

    emptyText: {
      fontSize: 13,
      lineHeight: 20,
      color: "#667085",
    },

    bulletRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      marginBottom: 8,
    },

    bullet: {
      fontSize: 18,
      color: "#2563EB",
      width: 22,
      lineHeight: 20,
    },

    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: "#475467",
    },

    skillGroup: {
      marginBottom: 14,
    },

    skillGroupTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: "#344054",
      marginBottom: 8,
    },

    tagContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    skillTag: {
      backgroundColor:
        "#EEF4FF",
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    skillTagText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#175CD3",
    },

    subHeading: {
      fontSize: 14,
      fontWeight: "800",
      color: "#344054",
      marginTop: 12,
      marginBottom: 8,
    },

    learnCard: {
      backgroundColor:
        "#FAFBFD",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 14,
      marginBottom: 12,
    },

    learnTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#172033",
      marginBottom: 10,
    },

    projectCard: {
      backgroundColor:
        "#FAFBFD",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#EAECF0",
      padding: 14,
      marginBottom: 12,
    },

    projectTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#172033",
      marginBottom: 10,
    },

    emptyState: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 28,
      alignItems: "center",
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
      textAlign: "center",
    },
  });