import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_BASE_URL = "http://127.0.0.1:8001";

type ProgressData = {
  progress: {
    completed_modules: number;
    total_modules: number;
    percentage: number;
  };
  modules: {
    resume_analyzer: boolean;
    job_description_analyzer: boolean;
    skill_gap_analysis: boolean;
    career_roadmap: boolean;
    interview_preparation: boolean;
    mock_interview: boolean;
    career_chat: boolean;
  };
  chat_sessions: number;
  career_profile: {
    completed: boolean;
    target_role: string | null;
    career_goal: string | null;
  };
};

const moduleNames = [
  {
    key: "resume_analyzer",
    title: "Resume Analyzer",
    description: "Analyze your resume and improve it.",
  },
  {
    key: "job_description_analyzer",
    title: "Job Description Analyzer",
    description: "Understand job requirements and skills.",
  },
  {
    key: "skill_gap_analysis",
    title: "Skill Gap Analysis",
    description: "Find the skills you need to improve.",
  },
  {
    key: "career_roadmap",
    title: "Career Roadmap",
    description: "Follow a personalized career roadmap.",
  },
  {
    key: "interview_preparation",
    title: "Interview Preparation",
    description: "Prepare for placement interviews.",
  },
  {
    key: "mock_interview",
    title: "AI Mock Interview",
    description: "Practice interviews with AI.",
  },
  {
    key: "career_chat",
    title: "AI Career Chat",
    description: "Ask AI about your career and placements.",
  },
] as const;

export default function ProgressScreen() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/progress`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to load progress.");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to load progress</Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadProgress}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Text style={styles.backIconText}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.title}>My Progress</Text>
            <Text style={styles.subtitle}>
              Track your career preparation journey
            </Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Overall Progress</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressPercentage}>
              {data.progress.percentage}%
            </Text>

            <Text style={styles.progressCount}>
              {data.progress.completed_modules} of{" "}
              {data.progress.total_modules} modules
            </Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    data.progress.percentage,
                    100
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressMessage}>
            Keep going! Complete more modules to improve your placement
            preparation.
          </Text>
        </View>

        {/* Career Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Profile</Text>

          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Status</Text>
              <Text
                style={[
                  styles.profileValue,
                  data.career_profile.completed
                    ? styles.completedText
                    : styles.pendingText,
                ]}
              >
                {data.career_profile.completed
                  ? "Completed"
                  : "Not Completed"}
              </Text>
            </View>

            {data.career_profile.target_role && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Target Role</Text>
                <Text style={styles.profileValue}>
                  {data.career_profile.target_role}
                </Text>
              </View>
            )}

            {data.career_profile.career_goal && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Career Goal</Text>
                <Text style={styles.profileValue}>
                  {data.career_profile.career_goal}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Module Progress</Text>

          {moduleNames.map((module) => {
            const completed =
              data.modules[
                module.key as keyof typeof data.modules
              ];

            return (
              <View key={module.key} style={styles.moduleCard}>
                <View
                  style={[
                    styles.statusCircle,
                    completed
                      ? styles.completedCircle
                      : styles.pendingCircle,
                  ]}
                >
                  <Text style={styles.statusIcon}>
                    {completed ? "✓" : "○"}
                  </Text>
                </View>

                <View style={styles.moduleContent}>
                  <Text style={styles.moduleTitle}>
                    {module.title}
                  </Text>

                  <Text style={styles.moduleDescription}>
                    {module.description}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.statusText,
                    completed
                      ? styles.completedText
                      : styles.pendingText,
                  ]}
                >
                  {completed ? "Done" : "Pending"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Chat Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Career Chat</Text>

          <View style={styles.chatStatsCard}>
            <Text style={styles.chatNumber}>
              {data.chat_sessions}
            </Text>

            <Text style={styles.chatLabel}>
              Chat Sessions
            </Text>

            <Text style={styles.chatDescription}>
              Your saved AI Career Chat conversations.
            </Text>

            <Pressable
              style={styles.chatButton}
              onPress={() => router.push("/career-chat")}
            >
              <Text style={styles.chatButtonText}>
                Open Career Chat
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F8FC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  errorText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  backButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
  },

  backButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  backIconText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#222",
    marginTop: -3,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 3,
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },

  progressLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  progressPercentage: {
    fontSize: 42,
    fontWeight: "800",
    color: "#2563EB",
  },

  progressCount: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 10,
  },

  progressMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 12,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
  },

  profileRow: {
    marginBottom: 14,
  },

  profileLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  profileValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },

  statusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  completedCircle: {
    backgroundColor: "#DCFCE7",
  },

  pendingCircle: {
    backgroundColor: "#F3F4F6",
  },

  statusIcon: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16A34A",
  },

  moduleContent: {
    flex: 1,
    paddingRight: 8,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  moduleDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
    lineHeight: 17,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  completedText: {
    color: "#16A34A",
  },

  pendingText: {
    color: "#9CA3AF",
  },

  chatStatsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },

  chatNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#2563EB",
  },

  chatLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },

  chatDescription: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },

  chatButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },

  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 20,
  },
});