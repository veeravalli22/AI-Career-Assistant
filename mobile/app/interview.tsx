import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

const API_BASE_URL = "https://ai-career-assistant-5pqr.onrender.com";

type TechnicalPreparation = {
  topics_to_prepare: string[];
  important_concepts: string[];
  sample_questions: string[];
};

type CodingPreparation = {
  topics: string[];
  practice_questions: string[];
  difficulty: string;
};

type SqlPreparation = {
  topics: string[];
  sample_questions: string[];
};

type ProjectPreparation = {
  projects_to_prepare: string[];
  questions: string[];
  explanation_structure: string[];
};

type RoleSpecificPreparation = {
  topics: string[];
  questions: string[];
};

type HrPreparation = {
  questions: string[];
  preparation_tips: string[];
};

type BehavioralPreparation = {
  questions: string[];
  preparation_tips: string[];
};

type CommunicationPreparation = {
  focus_areas: string[];
  practice_tasks: string[];
};

type MockInterviewRound = {
  round: string;
  focus: string;
  question_count: number;
};

type SevenDayPlan = {
  day: string;
  focus: string;
  tasks: string[];
};

type InterviewPreparation = {
  preparation_title: string;
  target_role: string;
  overall_strategy: string;
  technical_preparation: TechnicalPreparation;
  coding_preparation: CodingPreparation;
  sql_preparation: SqlPreparation;
  project_preparation: ProjectPreparation;
  role_specific_preparation: RoleSpecificPreparation;
  hr_preparation: HrPreparation;
  behavioral_preparation: BehavioralPreparation;
  communication_preparation: CommunicationPreparation;
  topics_to_learn: string[];
  mock_interview_plan: MockInterviewRound[];
  seven_day_preparation_plan: SevenDayPlan[];
  final_advice: string[];
};

export default function InterviewScreen() {
  const [preparation, setPreparation] =
    useState<InterviewPreparation | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const generateInterviewPreparation = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/interview/preparation`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to generate interview preparation."
        );
      }

      setPreparation(data.interview_preparation);
    } catch (err: any) {
      console.log("Interview preparation error:", err);
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInterviewPreparation();
  }, []);

  const renderList = (items?: string[]) => {
    if (!items || items.length === 0) {
      return <Text style={styles.emptyText}>No items available.</Text>;
    }

    return items.map((item, index) => (
      <View key={`${item}-${index}`} style={styles.listRow}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.listText}>{item}</Text>
      </View>
    ));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>🎤 Interview Preparation</Text>

        <Text style={styles.subtitle}>
          Personalized interview preparation based on your resume,
          career goal, target role, and job description.
        </Text>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={generateInterviewPreparation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.generateButtonText}>
            🎯 Generate Interview Preparation
          </Text>
        )}
      </TouchableOpacity>

      {/* Error */}
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={generateInterviewPreparation}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Loading */}
      {loading && !preparation ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2563eb" />

          <Text style={styles.loadingTitle}>
            AI is preparing your interview plan...
          </Text>

          <Text style={styles.loadingText}>
            Your resume and career profile are being analyzed.
          </Text>
        </View>
      ) : null}

      {/* Preparation */}
      {preparation ? (
        <>
          {/* Main Title */}
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              {preparation.preparation_title}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                Target Role: {preparation.target_role}
              </Text>
            </View>

            <Text style={styles.heroText}>
              {preparation.overall_strategy}
            </Text>
          </View>

          {/* Technical */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              💻 Technical Preparation
            </Text>

            <Text style={styles.subTitle}>Topics to Prepare</Text>
            {renderList(
              preparation.technical_preparation?.topics_to_prepare
            )}

            <Text style={styles.subTitle}>Important Concepts</Text>
            {renderList(
              preparation.technical_preparation?.important_concepts
            )}

            <Text style={styles.subTitle}>Sample Questions</Text>
            {renderList(
              preparation.technical_preparation?.sample_questions
            )}
          </View>

          {/* Coding */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🧑‍💻 Coding Preparation</Text>

            <Text style={styles.subTitle}>Topics</Text>
            {renderList(preparation.coding_preparation?.topics)}

            <Text style={styles.subTitle}>Practice Questions</Text>
            {renderList(
              preparation.coding_preparation?.practice_questions
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Difficulty</Text>
              <Text style={styles.infoValue}>
                {preparation.coding_preparation?.difficulty || "Not specified"}
              </Text>
            </View>
          </View>

          {/* SQL */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🗄️ SQL Preparation</Text>

            <Text style={styles.subTitle}>Topics</Text>
            {renderList(preparation.sql_preparation?.topics)}

            <Text style={styles.subTitle}>Sample Questions</Text>
            {renderList(
              preparation.sql_preparation?.sample_questions
            )}
          </View>

          {/* Projects */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              📂 Project Interview Preparation
            </Text>

            <Text style={styles.subTitle}>Projects to Prepare</Text>
            {renderList(
              preparation.project_preparation?.projects_to_prepare
            )}

            <Text style={styles.subTitle}>Possible Questions</Text>
            {renderList(preparation.project_preparation?.questions)}

            <Text style={styles.subTitle}>Project Explanation Structure</Text>
            {renderList(
              preparation.project_preparation?.explanation_structure
            )}
          </View>

          {/* Role Specific */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              🎯 Role-Specific Preparation
            </Text>

            <Text style={styles.subTitle}>Topics</Text>
            {renderList(
              preparation.role_specific_preparation?.topics
            )}

            <Text style={styles.subTitle}>Questions</Text>
            {renderList(
              preparation.role_specific_preparation?.questions
            )}
          </View>

          {/* HR */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>👔 HR Preparation</Text>

            <Text style={styles.subTitle}>Common HR Questions</Text>
            {renderList(preparation.hr_preparation?.questions)}

            <Text style={styles.subTitle}>Preparation Tips</Text>
            {renderList(
              preparation.hr_preparation?.preparation_tips
            )}
          </View>

          {/* Behavioral */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              🧠 Behavioral Preparation
            </Text>

            <Text style={styles.subTitle}>Questions</Text>
            {renderList(preparation.behavioral_preparation?.questions)}

            <Text style={styles.subTitle}>Preparation Tips</Text>
            {renderList(
              preparation.behavioral_preparation?.preparation_tips
            )}
          </View>

          {/* Communication */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              🗣️ Communication Preparation
            </Text>

            <Text style={styles.subTitle}>Focus Areas</Text>
            {renderList(
              preparation.communication_preparation?.focus_areas
            )}

            <Text style={styles.subTitle}>Practice Tasks</Text>
            {renderList(
              preparation.communication_preparation?.practice_tasks
            )}
          </View>

          {/* Topics To Learn */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              📚 Topics You Need To Learn
            </Text>

            {renderList(preparation.topics_to_learn)}
          </View>

          {/* Mock Interview */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              🎤 Mock Interview Plan
            </Text>

            {preparation.mock_interview_plan?.map((item, index) => (
              <View
                key={`${item.round}-${index}`}
                style={styles.planCard}
              >
                <Text style={styles.planTitle}>
                  {item.round}
                </Text>

                <Text style={styles.planFocus}>
                  Focus: {item.focus}
                </Text>

                <Text style={styles.questionCount}>
                  Questions: {item.question_count}
                </Text>
              </View>
            ))}
          </View>

          {/* Seven Day Plan */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              📅 7-Day Interview Preparation Plan
            </Text>

            {preparation.seven_day_preparation_plan?.map(
              (day, index) => (
                <View
                  key={`${day.day}-${index}`}
                  style={styles.dayCard}
                >
                  <Text style={styles.dayTitle}>{day.day}</Text>

                  <Text style={styles.dayFocus}>
                    Focus: {day.focus}
                  </Text>

                  <Text style={styles.subTitle}>Tasks</Text>

                  {renderList(day.tasks)}
                </View>
              )
            )}
          </View>

          {/* Final Advice */}
          <View style={styles.finalCard}>
            <Text style={styles.sectionTitle}>
              💡 Final Interview Advice
            </Text>

            {renderList(preparation.final_advice)}
          </View>
        </>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  content: {
    padding: 20,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    marginBottom: 20,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },

  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#6b7280",
  },

  generateButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  heroCard: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 14,
  },

  roleBadgeText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
  },

  heroText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#4b5563",
  },

  sectionCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  subTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 8,
  },

  bullet: {
    fontSize: 17,
    lineHeight: 22,
    color: "#2563eb",
    marginRight: 8,
  },

  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },

  infoBox: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d4ed8",
  },

  planCard: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  planTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },

  planFocus: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 21,
    marginBottom: 6,
  },

  questionCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },

  dayCard: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  dayTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 5,
  },

  dayFocus: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  },

  finalCard: {
    backgroundColor: "#eff6ff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  loadingCard: {
    backgroundColor: "#ffffff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },

  loadingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 15,
    textAlign: "center",
  },

  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 7,
    textAlign: "center",
  },

  errorCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#b91c1c",
    marginBottom: 6,
  },

  errorText: {
    fontSize: 14,
    color: "#7f1d1d",
    lineHeight: 21,
    marginBottom: 12,
  },

  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#dc2626",
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  retryText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});