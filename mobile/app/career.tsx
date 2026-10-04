import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";

import { router } from "expo-router";

const API_URL = "http://127.0.0.1:8001";

type CareerProfile = {
  id?: number;
  career_goal: string;
  target_role: string | null;
  experience_level: string | null;
  preferred_domain: string | null;
  preferred_work_type: string | null;
  additional_goal: string | null;
};

type StartingPoint = {
  strengths: string[];
  existing_skills: string[];
  missing_skills: string[];
  priority_gaps: string[];
};

type WeeklyRoadmap = {
  week: number;
  title: string;
  focus: string;
  topics: string[];
  practice_tasks: string[];
  deliverables: string[];
  estimated_hours: number;
};

type Project = {
  title: string;
  description: string;
  skills_used: string[];
  difficulty: string;
  purpose: string;
};

type InterviewPreparation = {
  technical_topics: string[];
  hr_topics: string[];
  coding_topics: string[];
  communication_focus: string[];
};

type JobPreparation = {
  resume_actions: string[];
  github_actions: string[];
  portfolio_actions: string[];
  job_application_actions: string[];
};

type DailyPlan = {
  coding: string;
  learning: string;
  practice: string;
  placement_preparation: string;
};

type CareerRoadmap = {
  roadmap_title: string;
  career_goal: string;
  target_role: string;
  current_level: string;
  timeline: string;
  starting_point: StartingPoint;
  weekly_roadmap: WeeklyRoadmap[];
  projects: Project[];
  interview_preparation: InterviewPreparation;
  job_preparation: JobPreparation;
  daily_plan: DailyPlan;
  final_advice: string[];
};

export default function CareerScreen() {
  const [careerGoal, setCareerGoal] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [domain, setDomain] = useState("");
  const [workType, setWorkType] = useState("Full-time");
  const [additionalGoal, setAdditionalGoal] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  const [savedProfile, setSavedProfile] =
    useState<CareerProfile | null>(null);

  const [roadmap, setRoadmap] =
    useState<CareerRoadmap | null>(null);

  // --------------------------------------------------
  // Load saved career profile
  // --------------------------------------------------

  const loadCareerProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoadingProfile(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/v1/career/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoadingProfile(false);
        return;
      }

      if (data.profile) {
        const profile = data.profile;

        setSavedProfile(profile);

        setCareerGoal(profile.career_goal || "");
        setTargetRole(profile.target_role || "");
        setExperienceLevel(
          profile.experience_level || "Fresher"
        );
        setDomain(profile.preferred_domain || "");
        setWorkType(
          profile.preferred_work_type || "Full-time"
        );
        setAdditionalGoal(
          profile.additional_goal || ""
        );
      }
    } catch (error) {
      console.log(
        "Career profile loading error:",
        error
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadCareerProfile();
  }, []);

  // --------------------------------------------------
  // Save career profile
  // --------------------------------------------------

  const saveCareerProfile = async () => {
    if (!careerGoal.trim()) {
      Alert.alert(
        "Career Goal Required",
        "Please enter your career goal."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login before saving your career goal."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/v1/career/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            career_goal: careerGoal.trim(),
            target_role:
              targetRole.trim() || null,
            experience_level:
              experienceLevel.trim() || null,
            preferred_domain:
              domain.trim() || null,
            preferred_work_type:
              workType.trim() || null,
            additional_goal:
              additionalGoal.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Save Failed",
          data.detail ||
            "Could not save your career goal."
        );
        return;
      }

      setSavedProfile(data.profile);

      Alert.alert(
        "Saved Successfully",
        "Your career goal has been saved."
      );
    } catch (error) {
      console.log(
        "Career profile save error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Could not connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Generate AI Career Roadmap
  // --------------------------------------------------

  const generateCareerRoadmap = async () => {
    try {
      setGeneratingRoadmap(true);

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login before generating your roadmap."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/v1/career/roadmap`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Roadmap Generation Failed",
          data.detail ||
            "Could not generate your roadmap."
        );
        return;
      }

      if (!data.roadmap) {
        Alert.alert(
          "No Roadmap",
          "AI did not return a roadmap."
        );
        return;
      }

      setRoadmap(data.roadmap);

      Alert.alert(
        "Roadmap Ready 🚀",
        "Your personalized AI career roadmap has been generated."
      );
    } catch (error) {
      console.log(
        "Career roadmap error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Could not connect to the backend server."
      );
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading your career profile...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        🚀 Career Roadmap
      </Text>

      <Text style={styles.subtitle}>
        Your resume and career goal will be used to
        create a personalized AI career roadmap.
      </Text>

      {/* Career Goal */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          🎯 What is your career goal?
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: Become a Software Developer"
          placeholderTextColor="#94A3B8"
          value={careerGoal}
          onChangeText={setCareerGoal}
        />
      </View>

      {/* Target Role */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          💼 Target Job Role
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: Frontend Developer"
          placeholderTextColor="#94A3B8"
          value={targetRole}
          onChangeText={setTargetRole}
        />
      </View>

      {/* Experience */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          👨‍💻 Experience Level
        </Text>

        <View style={styles.optionsRow}>
          {[
            "Fresher",
            "Beginner",
            "Experienced",
          ].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                experienceLevel === option &&
                  styles.selectedOption,
              ]}
              onPress={() =>
                setExperienceLevel(option)
              }
            >
              <Text
                style={[
                  styles.optionText,
                  experienceLevel === option &&
                    styles.selectedOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Domain */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          🧩 Preferred Domain
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: Software Development"
          placeholderTextColor="#94A3B8"
          value={domain}
          onChangeText={setDomain}
        />
      </View>

      {/* Work Type */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          🏢 Preferred Work Type
        </Text>

        <View style={styles.optionsRow}>
          {[
            "Full-time",
            "Internship",
            "Both",
          ].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                workType === option &&
                  styles.selectedOption,
              ]}
              onPress={() =>
                setWorkType(option)
              }
            >
              <Text
                style={[
                  styles.optionText,
                  workType === option &&
                    styles.selectedOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Additional Goal */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          📝 Additional Goal
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textArea,
          ]}
          placeholder="Example: I want to get placed within 6 months."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          value={additionalGoal}
          onChangeText={setAdditionalGoal}
        />
      </View>

      {/* Save */}

      <TouchableOpacity
        style={[
          styles.saveButton,
          loading && styles.disabledButton,
        ]}
        onPress={saveCareerProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            💾 Save Career Goal
          </Text>
        )}
      </TouchableOpacity>

      {/* Saved Profile */}

      {savedProfile && (
        <View style={styles.savedCard}>
          <Text style={styles.savedTitle}>
            ✅ Your Career Goal
          </Text>

          <Text style={styles.savedGoal}>
            {savedProfile.career_goal}
          </Text>

          {savedProfile.target_role && (
            <Text style={styles.savedDetail}>
              Target Role:{" "}
              {savedProfile.target_role}
            </Text>
          )}

          {savedProfile.preferred_domain && (
            <Text style={styles.savedDetail}>
              Domain:{" "}
              {savedProfile.preferred_domain}
            </Text>
          )}

          {savedProfile.experience_level && (
            <Text style={styles.savedDetail}>
              Experience:{" "}
              {savedProfile.experience_level}
            </Text>
          )}

          {savedProfile.preferred_work_type && (
            <Text style={styles.savedDetail}>
              Work Type:{" "}
              {savedProfile.preferred_work_type}
            </Text>
          )}

          {savedProfile.additional_goal && (
            <Text style={styles.savedDetail}>
              Goal Details:{" "}
              {savedProfile.additional_goal}
            </Text>
          )}
        </View>
      )}

      {/* Generate Roadmap */}

      <View style={styles.roadmapActionCard}>
        <Text style={styles.roadmapActionTitle}>
          🗺️ AI Personalized Career Roadmap
        </Text>

        <Text style={styles.roadmapActionText}>
          Your resume and saved career profile will be
          analyzed by AI to create a personalized roadmap.
        </Text>

        <TouchableOpacity
          style={[
            styles.generateButton,
            generatingRoadmap &&
              styles.disabledButton,
          ]}
          onPress={generateCareerRoadmap}
          disabled={generatingRoadmap}
        >
          {generatingRoadmap ? (
            <>
              <ActivityIndicator
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.generateButtonText
                }
              >
                Generating Roadmap...
              </Text>
            </>
          ) : (
            <Text
              style={styles.generateButtonText}
            >
              ✨ Generate My Career Roadmap
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Roadmap */}

      {roadmap && (
        <View style={styles.roadmapContainer}>
          <Text style={styles.roadmapTitle}>
            {roadmap.roadmap_title}
          </Text>

          <Text style={styles.roadmapSubtitle}>
            {roadmap.timeline}
          </Text>

          {/* Starting Point */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              📍 Your Starting Point
            </Text>

            <Text style={styles.smallHeading}>
              Strengths
            </Text>

            {roadmap.starting_point?.strengths?.map(
              (item, index) => (
                <Text
                  key={`strength-${index}`}
                  style={styles.bulletText}
                >
                  • {item}
                </Text>
              )
            )}

            <Text style={styles.smallHeading}>
              Existing Skills
            </Text>

            {roadmap.starting_point?.existing_skills?.map(
              (item, index) => (
                <Text
                  key={`skill-${index}`}
                  style={styles.bulletText}
                >
                  • {item}
                </Text>
              )
            )}

            <Text style={styles.smallHeading}>
              Skills To Learn
            </Text>

            {roadmap.starting_point?.missing_skills?.map(
              (item, index) => (
                <Text
                  key={`missing-${index}`}
                  style={styles.bulletText}
                >
                  • {item}
                </Text>
              )
            )}

            <Text style={styles.smallHeading}>
              Priority Gaps
            </Text>

            {roadmap.starting_point?.priority_gaps?.map(
              (item, index) => (
                <Text
                  key={`gap-${index}`}
                  style={styles.bulletText}
                >
                  • {item}
                </Text>
              )
            )}
          </View>

          {/* Weekly Roadmap */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              📅 Weekly Roadmap
            </Text>

            {roadmap.weekly_roadmap?.map(
              (week) => (
                <View
                  key={`week-${week.week}`}
                  style={styles.weekCard}
                >
                  <Text style={styles.weekTitle}>
                    Week {week.week}:{" "}
                    {week.title}
                  </Text>

                  <Text style={styles.weekFocus}>
                    Focus: {week.focus}
                  </Text>

                  <Text style={styles.smallHeading}>
                    Topics
                  </Text>

                  {week.topics?.map(
                    (item, index) => (
                      <Text
                        key={`topic-${week.week}-${index}`}
                        style={styles.bulletText}
                      >
                        • {item}
                      </Text>
                    )
                  )}

                  <Text style={styles.smallHeading}>
                    Practice
                  </Text>

                  {week.practice_tasks?.map(
                    (item, index) => (
                      <Text
                        key={`practice-${week.week}-${index}`}
                        style={styles.bulletText}
                      >
                        • {item}
                      </Text>
                    )
                  )}

                  <Text style={styles.smallHeading}>
                    Deliverables
                  </Text>

                  {week.deliverables?.map(
                    (item, index) => (
                      <Text
                        key={`deliverable-${week.week}-${index}`}
                        style={styles.bulletText}
                      >
                        • {item}
                      </Text>
                    )
                  )}

                  <Text style={styles.hoursText}>
                    ⏱️ Estimated hours:{" "}
                    {week.estimated_hours}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Projects */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              🛠️ Recommended Projects
            </Text>

            {roadmap.projects?.map(
              (project, index) => (
                <View
                  key={`project-${index}`}
                  style={styles.projectCard}
                >
                  <Text style={styles.projectTitle}>
                    {project.title}
                  </Text>

                  <Text
                    style={styles.projectDescription}
                  >
                    {project.description}
                  </Text>

                  <Text style={styles.smallHeading}>
                    Skills
                  </Text>

                  <Text style={styles.bulletText}>
                    {project.skills_used?.join(
                      " • "
                    )}
                  </Text>

                  <Text style={styles.projectMeta}>
                    Difficulty:{" "}
                    {project.difficulty}
                  </Text>

                  <Text style={styles.projectMeta}>
                    Purpose: {project.purpose}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Interview Preparation */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              🎤 Interview Preparation
            </Text>

            <Text style={styles.smallHeading}>
              Technical Topics
            </Text>

            {roadmap.interview_preparation
              ?.technical_topics?.map(
                (item, index) => (
                  <Text
                    key={`technical-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}

            <Text style={styles.smallHeading}>
              Coding Topics
            </Text>

            {roadmap.interview_preparation
              ?.coding_topics?.map(
                (item, index) => (
                  <Text
                    key={`coding-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}

            <Text style={styles.smallHeading}>
              HR Topics
            </Text>

            {roadmap.interview_preparation
              ?.hr_topics?.map(
                (item, index) => (
                  <Text
                    key={`hr-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}

            <Text style={styles.smallHeading}>
              Communication Focus
            </Text>

            {roadmap.interview_preparation
              ?.communication_focus?.map(
                (item, index) => (
                  <Text
                    key={`communication-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}
          </View>

          {/* Job Preparation */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              💼 Job Preparation
            </Text>

            <Text style={styles.smallHeading}>
              Resume
            </Text>

            {roadmap.job_preparation
              ?.resume_actions?.map(
                (item, index) => (
                  <Text
                    key={`resume-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}

            <Text style={styles.smallHeading}>
              GitHub
            </Text>

            {roadmap.job_preparation
              ?.github_actions?.map(
                (item, index) => (
                  <Text
                    key={`github-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}

            <Text style={styles.smallHeading}>
              Portfolio
            </Text>

            {roadmap.job_preparation
              ?.portfolio_actions?.map(
                (item, index) => (
                  <Text
                    key={`portfolio-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}

            <Text style={styles.smallHeading}>
              Job Applications
            </Text>

            {roadmap.job_preparation
              ?.job_application_actions?.map(
                (item, index) => (
                  <Text
                    key={`application-${index}`}
                    style={styles.bulletText}
                  >
                    • {item}
                  </Text>
                )
              )}
          </View>

          {/* Daily Plan */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              🕒 Daily Plan
            </Text>

            <Text style={styles.dailyItem}>
              💻 Coding:{" "}
              {roadmap.daily_plan?.coding}
            </Text>

            <Text style={styles.dailyItem}>
              📚 Learning:{" "}
              {roadmap.daily_plan?.learning}
            </Text>

            <Text style={styles.dailyItem}>
              🧠 Practice:{" "}
              {roadmap.daily_plan?.practice}
            </Text>

            <Text style={styles.dailyItem}>
              🎯 Placement:{" "}
              {
                roadmap.daily_plan
                  ?.placement_preparation
              }
            </Text>
          </View>

          {/* Final Advice */}

          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapCardTitle}>
              💡 Final Advice
            </Text>

            {roadmap.final_advice?.map(
              (item, index) => (
                <Text
                  key={`advice-${index}`}
                  style={styles.bulletText}
                >
                  • {item}
                </Text>
              )
            )}
          </View>
        </View>
      )}

      {/* Back */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          ← Back
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --------------------------------------------------
// Styles
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#475569",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#0F172A",
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },

  selectedOption: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  optionText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },

  selectedOptionText: {
    color: "#FFFFFF",
  },

  saveButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 18,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  savedCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
  },

  savedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 10,
  },

  savedGoal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },

  savedDetail: {
    fontSize: 14,
    color: "#334155",
    marginTop: 6,
    lineHeight: 20,
  },

  roadmapActionCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  roadmapActionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#312E81",
    marginBottom: 8,
  },

  roadmapActionText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4338CA",
    marginBottom: 15,
  },

  generateButton: {
    backgroundColor: "#4F46E5",
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  roadmapContainer: {
    marginTop: 5,
  },

  roadmapTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },

  roadmapSubtitle: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 15,
  },

  roadmapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  roadmapCardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },

  smallHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
    marginBottom: 6,
  },

  bulletText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    marginBottom: 4,
  },

  weekCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  weekTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 7,
  },

  weekFocus: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    marginBottom: 5,
  },

  hoursText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 10,
  },

  projectCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  projectTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 7,
  },

  projectDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    marginBottom: 5,
  },

  projectMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    marginTop: 5,
  },

  dailyItem: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    marginBottom: 8,
  },

  backButton: {
    alignItems: "center",
    padding: 12,
  },

  backButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});