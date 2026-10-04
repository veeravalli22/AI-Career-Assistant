import React, { useState } from "react";

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

// =========================================================
// API
// =========================================================

const API_URL = "http://127.0.0.1:8001";

// =========================================================
// TYPES
// =========================================================

type Skills = {
  programming_languages?: string[];
  web_technologies?: string[];
  databases?: string[];
  tools_platforms?: string[];
  other?: string[];
};

type ResumeAnalysis = {
  skills?: Skills;
};

type RequiredSkill = {
  skill?: string;
  priority?: string;
  reason?: string;
};

type JDAnalysis = {
  job_overview?: {
    job_title?: string;
  };
  skills_to_prepare?: RequiredSkill[];
  complete_syllabus?: {
    technical?: {
      topic?: string;
      models?: string[];
    }[];
  };
};

type CareerContext = {
  resume: {
    id: number;
    filename: string;
    extracted_text: string;
    analysis: ResumeAnalysis | string | null;
  };
  job_description: {
    id: number;
    job_description: string;
    analysis: JDAnalysis | string | null;
  };
};

// =========================================================
// HELPERS
// =========================================================

function cleanText(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

function normalizeSkill(skill: string): string {
  return cleanText(skill)
    .toLowerCase()
    .replace(/\.js/g, "")
    .replace(/[^a-z0-9+#]/g, "");
}

function skillMatches(
  resumeSkill: string,
  requiredSkill: string
): boolean {
  const resume = normalizeSkill(resumeSkill);
  const required = normalizeSkill(requiredSkill);

  if (!resume || !required) {
    return false;
  }

  if (resume === required) {
    return true;
  }

  if (
    resume.includes(required) ||
    required.includes(resume)
  ) {
    return true;
  }

  const aliases: Record<string, string[]> = {
    react: ["react", "reactjs"],
    node: ["node", "nodejs"],
    express: ["express", "expressjs"],
    next: ["next", "nextjs"],
    javascript: ["javascript", "js"],
    typescript: ["typescript", "ts"],
    postgres: ["postgres", "postgresql"],
    mysql: ["mysql"],
    mongodb: ["mongodb", "mongo"],
    github: ["github"],
    git: ["git"],
    sql: ["sql"],
  };

  for (const key of Object.keys(aliases)) {
    const values = aliases[key];

    if (
      values.includes(resume) &&
      values.includes(required)
    ) {
      return true;
    }
  }

  return false;
}

function getAllResumeSkills(
  skills: Skills
): string[] {
  return [
    ...(skills.programming_languages || []),
    ...(skills.web_technologies || []),
    ...(skills.databases || []),
    ...(skills.tools_platforms || []),
    ...(skills.other || []),
  ]
    .map(cleanText)
    .filter(Boolean)
    .filter(
      (skill, index, array) =>
        array.findIndex(
          (item) =>
            normalizeSkill(item) ===
            normalizeSkill(skill)
        ) === index
    );
}

function parseAnalysis(value: any): any {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// =========================================================
// SKILL TAG
// =========================================================

function SkillTag({
  text,
  type,
}: {
  text: string;
  type: "have" | "missing";
}) {
  return (
    <View
      style={[
        styles.skillTag,
        type === "have"
          ? styles.haveTag
          : styles.missingTag,
      ]}
    >
      <Text
        style={[
          styles.skillTagText,
          type === "have"
            ? styles.haveTagText
            : styles.missingTagText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

// =========================================================
// BULLET
// =========================================================

function Bullet({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>

      <Text style={styles.bulletText}>
        {text}
      </Text>
    </View>
  );
}

// =========================================================
// MAIN SCREEN
// =========================================================

export default function SkillGapScreen() {
  const [loading, setLoading] =
    useState(false);

  const [resumeSkills, setResumeSkills] =
    useState<string[]>([]);

  const [requiredSkills, setRequiredSkills] =
    useState<string[]>([]);

  const [matchedSkills, setMatchedSkills] =
    useState<string[]>([]);

  const [missingSkills, setMissingSkills] =
    useState<string[]>([]);

  const [analyzed, setAnalyzed] =
    useState(false);

  const [jobTitle, setJobTitle] =
    useState("");

  // =======================================================
  // GET TOKEN
  // =======================================================

  const getToken = async () => {
    if (Platform.OS === "web") {
      return (
        window.localStorage.getItem(
          "access_token"
        ) || ""
      );
    }

    try {
      const AsyncStorage =
        require(
          "@react-native-async-storage/async-storage"
        ).default;

      return (
        (await AsyncStorage.getItem(
          "access_token"
        )) || ""
      );
    } catch {
      return "";
    }
  };

  // =======================================================
  // MARK SKILL GAP AS COMPLETED
  // =======================================================

  const markSkillGapCompleted = async (
    token: string
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/progress/complete`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            module_name: "skill_gap_analysis",
          }),
        }
      );

      if (!response.ok) {
        console.log(
          "Progress update failed:",
          response.status
        );
      } else {
        console.log(
          "Skill Gap marked as completed."
        );
      }
    } catch (error) {
      console.log(
        "Progress update error:",
        error
      );
    }
  };

  // =======================================================
  // ANALYZE SAVED RESUME + SAVED JD
  // =======================================================

  const analyzeSkillGap = async () => {
    try {
      setLoading(true);
      setAnalyzed(false);

      const token = await getToken();

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login first."
        );
        return;
      }

      // ---------------------------------------------------
      // GET SAVED CAREER CONTEXT
      // ---------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/v1/career/context`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to load your saved resume and job description.";

        try {
          const errorData =
            await response.json();

          if (errorData?.detail) {
            message = errorData.detail;
          }
        } catch {}

        throw new Error(message);
      }

      const context: CareerContext =
        await response.json();

      // ---------------------------------------------------
      // RESUME ANALYSIS
      // ---------------------------------------------------

      const resumeAnalysis =
        parseAnalysis(
          context?.resume?.analysis
        );

      if (!resumeAnalysis) {
        throw new Error(
          "Resume analysis was not found. Please analyze your resume first."
        );
      }

      const resumeSkillsData: Skills =
        resumeAnalysis.skills || {};

      const currentSkills =
        getAllResumeSkills(
          resumeSkillsData
        );

      // ---------------------------------------------------
      // JD ANALYSIS
      // ---------------------------------------------------

      const jdAnalysis =
        parseAnalysis(
          context?.job_description?.analysis
        );

      if (!jdAnalysis) {
        throw new Error(
          "Job description analysis was not found. Please analyze the job description first."
        );
      }

      // ---------------------------------------------------
      // GET REQUIRED SKILLS FROM JD ANALYSIS
      // ---------------------------------------------------

      const detectedRequiredSkills =
        Array.isArray(
          jdAnalysis.skills_to_prepare
        )
          ? jdAnalysis.skills_to_prepare
              .map(
                (item: RequiredSkill) =>
                  cleanText(item?.skill)
              )
              .filter(Boolean)
          : [];

      // ---------------------------------------------------
      // FALLBACK: GET TECHNICAL TOPICS
      // ---------------------------------------------------

      const technicalTopics =
        Array.isArray(
          jdAnalysis?.complete_syllabus
            ?.technical
        )
          ? jdAnalysis.complete_syllabus.technical
              .map(
                (item) =>
                  cleanText(item?.topic)
              )
              .filter(Boolean)
          : [];

      const combinedRequiredSkills =
        Array.from(
          new Set([
            ...detectedRequiredSkills,
            ...technicalTopics,
          ])
        );

      // ---------------------------------------------------
      // MATCH SKILLS
      // ---------------------------------------------------

      const have: string[] = [];
      const missing: string[] = [];

      combinedRequiredSkills.forEach(
        (requiredSkill) => {
          const found =
            currentSkills.some(
              (resumeSkill) =>
                skillMatches(
                  resumeSkill,
                  requiredSkill
                )
            );

          if (found) {
            have.push(requiredSkill);
          } else {
            missing.push(requiredSkill);
          }
        }
      );

      // ---------------------------------------------------
      // SAVE RESULTS TO SCREEN
      // ---------------------------------------------------

      setJobTitle(
        cleanText(
          jdAnalysis?.job_overview
            ?.job_title
        ) || "Target Job"
      );

      setResumeSkills(
        currentSkills
      );

      setRequiredSkills(
        combinedRequiredSkills
      );

      setMatchedSkills(
        Array.from(new Set(have))
      );

      setMissingSkills(
        Array.from(new Set(missing))
      );

      setAnalyzed(true);

      // ---------------------------------------------------
      // MARK MODULE AS COMPLETED
      // ---------------------------------------------------

      await markSkillGapCompleted(
        token
      );

    } catch (error: any) {
      console.log(
        "Skill gap error:",
        error
      );

      Alert.alert(
        "Analysis Failed",
        error?.message ||
          "Something went wrong while analyzing your skill gap."
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // CLEAR
  // =======================================================

  const clearAnalysis = () => {
    setResumeSkills([]);
    setRequiredSkills([]);
    setMatchedSkills([]);
    setMissingSkills([]);
    setJobTitle("");
    setAnalyzed(false);
  };

  // =======================================================
  // PRIORITY
  // =======================================================

  const getPriorityText = () => {
    if (missingSkills.length === 0) {
      return "Excellent! Your resume contains the skills detected for this job. Focus on coding practice, projects and interview preparation.";
    }

    if (missingSkills.length === 1) {
      return `Start with ${missingSkills[0]} and practice it with a small project.`;
    }

    if (missingSkills.length <= 3) {
      return `Start with ${missingSkills[0]}, then gradually prepare the remaining missing skills.`;
    }

    return `You have ${missingSkills.length} important skill gaps. Start with the highest-priority skills and learn them step by step.`;
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
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>
          🧩 Skill Gap Analysis
        </Text>

        <Text style={styles.subtitle}>
          Your saved resume and job description
          are automatically compared to identify
          the skills you need to prepare.
        </Text>
      </View>

      {/* SAVED DATA CARD */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          📊 Saved Career Data
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Resume
          </Text>

          <Text style={styles.infoValue}>
            Saved Resume ✓
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Job
          </Text>

          <Text style={styles.infoValue}>
            {jobTitle || "Saved Job Description"}
          </Text>
        </View>

        <Text style={styles.helperText}>
          No need to paste your job description
          again. The latest saved data is used
          automatically.
        </Text>

        <Pressable
          onPress={analyzeSkillGap}
          disabled={loading}
          style={({ pressed }) => [
            styles.analyzeButton,
            pressed && styles.pressed,
            loading && styles.disabledButton,
          ]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.buttonText}>
                Analyzing...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              🔍 Analyze My Skill Gap
            </Text>
          )}
        </Pressable>
      </View>

      {/* RESULTS */}

      {analyzed && (
        <View style={styles.results}>

          {/* RESUME SKILLS */}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              📄 Your Resume Skills
            </Text>

            {resumeSkills.length > 0 ? (
              <View style={styles.tagsContainer}>
                {resumeSkills.map(
                  (skill, index) => (
                    <SkillTag
                      key={`${skill}-${index}`}
                      text={skill}
                      type="have"
                    />
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No skills were found in your
                resume analysis.
              </Text>
            )}
          </View>

          {/* REQUIRED SKILLS */}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              🎯 Skills Required for This Job
            </Text>

            {requiredSkills.length > 0 ? (
              <View style={styles.tagsContainer}>
                {requiredSkills.map(
                  (skill, index) => (
                    <SkillTag
                      key={`${skill}-${index}`}
                      text={skill}
                      type="missing"
                    />
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No specific skills were detected
                from the job description.
              </Text>
            )}
          </View>

          {/* MATCHED */}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              ✅ Skills You Have
            </Text>

            {matchedSkills.length > 0 ? (
              <View style={styles.tagsContainer}>
                {matchedSkills.map(
                  (skill, index) => (
                    <SkillTag
                      key={`${skill}-${index}`}
                      text={skill}
                      type="have"
                    />
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No matching required skills
                were detected.
              </Text>
            )}
          </View>

          {/* MISSING */}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              ⚠️ Missing Skills
            </Text>

            {missingSkills.length > 0 ? (
              <View style={styles.tagsContainer}>
                {missingSkills.map(
                  (skill, index) => (
                    <SkillTag
                      key={`${skill}-${index}`}
                      text={skill}
                      type="missing"
                    />
                  )
                )}
              </View>
            ) : (
              <Text style={styles.successText}>
                🎉 No major skill gaps detected.
              </Text>
            )}
          </View>

          {/* WHAT TO LEARN */}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              📚 What You Should Learn
            </Text>

            {missingSkills.length > 0 ? (
              <View>
                {missingSkills.map(
                  (skill, index) => (
                    <Bullet
                      key={`${skill}-${index}`}
                      text={`${index + 1}. Learn ${skill} and practice it with a small project.`}
                    />
                  )
                )}
              </View>
            ) : (
              <Text style={styles.normalText}>
                Focus on strengthening your existing
                skills through coding practice,
                projects and interview preparation.
              </Text>
            )}
          </View>

          {/* PRIORITY */}

          <View style={styles.priorityCard}>
            <Text style={styles.priorityTitle}>
              🎯 Preparation Priority
            </Text>

            <Text style={styles.priorityText}>
              {getPriorityText()}
            </Text>
          </View>

          {/* REFRESH */}

          <Pressable
            onPress={clearAnalysis}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.clearButtonText}>
              🔄 Refresh Skill Gap
            </Text>
          </Pressable>
        </View>
      )}

      {/* EMPTY STATE */}

      {!analyzed && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            🧩
          </Text>

          <Text style={styles.emptyTitle}>
            Find Your Skill Gaps
          </Text>

          <Text style={styles.emptyDescription}>
            Your saved resume and saved job
            description will be compared
            automatically.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },

  // HEADER

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#667085",
  },

  // CARD

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475467",
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#027A48",
    maxWidth: "65%",
    textAlign: "right",
  },

  helperText: {
    fontSize: 13,
    color: "#667085",
    lineHeight: 19,
    marginTop: 12,
    marginBottom: 14,
  },

  // BUTTON

  analyzeButton: {
    minHeight: 52,
    backgroundColor: "#2563EB",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
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

  // RESULTS

  results: {
    gap: 14,
  },

  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 12,
  },

  // TAGS

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillTag: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },

  haveTag: {
    backgroundColor: "#ECFDF3",
    borderColor: "#ABEFC6",
  },

  missingTag: {
    backgroundColor: "#FFF4ED",
    borderColor: "#FED7AA",
  },

  skillTagText: {
    fontSize: 13,
    fontWeight: "700",
  },

  haveTagText: {
    color: "#027A48",
  },

  missingTagText: {
    color: "#C2410C",
  },

  // BULLETS

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  bullet: {
    width: 20,
    fontSize: 17,
    color: "#2563EB",
    fontWeight: "800",
  },

  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#475467",
  },

  // TEXT

  normalText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475467",
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#98A2B3",
  },

  successText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#027A48",
    fontWeight: "600",
  },

  // PRIORITY

  priorityCard: {
    backgroundColor: "#EEF4FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C7D7FE",
  },

  priorityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#175CD3",
    marginBottom: 8,
  },

  priorityText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#344054",
  },

  // CLEAR

  clearButton: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  clearButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#344054",
  },

  // EMPTY STATE

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 5,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#667085",
    textAlign: "center",
  },
});