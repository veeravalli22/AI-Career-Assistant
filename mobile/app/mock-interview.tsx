import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

const API_BASE_URL = "http://127.0.0.1:8001";

type Question = {
  question_number: number;
  category: string;
  difficulty: string;
  question: string;
};

type Evaluation = {
  score: number;
  rating: string;
  feedback: string;
  strengths: string[];
  missing_points: string[];
  improved_answer: string;
  communication_feedback: string;
};

type SavedEvaluation = Evaluation & {
  question_number: number;
  question: string;
  category: string;
  answer: string;
};

type CategoryPerformance = {
  score: number;
  feedback: string;
};

type FinalReport = {
  overall_score: number;
  average_score: number;
  performance_level: string;

  category_performance: {
    technical?: CategoryPerformance;
    coding?: CategoryPerformance;
    sql?: CategoryPerformance;
    project?: CategoryPerformance;
    behavioral?: CategoryPerformance;
    hr?: CategoryPerformance;
    communication?: CategoryPerformance;
  };

  strengths: string[];
  weak_areas: string[];
  improvement_suggestions: string[];

  interview_readiness: {
    status: string;
    summary: string;
  };

  final_advice: string;
};

type MockInterview = {
  interview_title: string;
  target_role: string;
  difficulty: string;
  total_questions: number;
  instructions: string[];
  questions: Question[];
  final_message: string;
};

export default function MockInterviewScreen() {
  const [mockInterview, setMockInterview] =
    useState<MockInterview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);

  const [evaluations, setEvaluations] =
    useState<SavedEvaluation[]>([]);

  const [evaluating, setEvaluating] = useState(false);

  const [generatingReport, setGeneratingReport] =
    useState(false);

  const [completed, setCompleted] = useState(false);

  const [finalReport, setFinalReport] =
    useState<FinalReport | null>(null);

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // ============================================================
  // LOAD MOCK INTERVIEW
  // ============================================================

  const loadMockInterview = async () => {
    try {
      setLoading(true);
      setError("");

      setMockInterview(null);
      setEvaluation(null);
      setEvaluations([]);
      setAnswer("");
      setCompleted(false);
      setFinalReport(null);
      setGeneratingReport(false);
      setCurrentQuestionIndex(0);

      const token = getToken();

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/mock-interview/start`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to generate mock interview."
        );
      }

      setMockInterview(data.mock_interview);
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMockInterview();
  }, []);

  const currentQuestion =
    mockInterview?.questions?.[currentQuestionIndex];

  // ============================================================
  // EVALUATE ANSWER
  // ============================================================

  const evaluateAnswer = async () => {
    if (!currentQuestion) {
      return;
    }

    if (!answer.trim()) {
      Alert.alert(
        "Answer Required",
        "Please type your answer before submitting."
      );
      return;
    }

    try {
      setEvaluating(true);

      const token = getToken();

      if (!token) {
        Alert.alert(
          "Login Required",
          "Your login session is missing. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/mock-interview/evaluate`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: currentQuestion.question,
            category: currentQuestion.category,
            answer: answer.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to evaluate your answer."
        );
      }

      const newEvaluation: Evaluation =
        data?.evaluation;

      if (!newEvaluation) {
        throw new Error(
          "AI evaluation was not received from the server."
        );
      }

      setEvaluation(newEvaluation);

      // Save complete question + answer + evaluation
      const savedEvaluation: SavedEvaluation = {
        question_number:
          currentQuestion.question_number,

        question:
          currentQuestion.question,

        category:
          currentQuestion.category,

        answer:
          answer.trim(),

        score:
          Number(newEvaluation.score) || 0,

        rating:
          newEvaluation.rating || "Needs Improvement",

        feedback:
          newEvaluation.feedback || "",

        strengths:
          Array.isArray(newEvaluation.strengths)
            ? newEvaluation.strengths
            : [],

        missing_points:
          Array.isArray(
            newEvaluation.missing_points
          )
            ? newEvaluation.missing_points
            : [],

        improved_answer:
          newEvaluation.improved_answer || "",

        communication_feedback:
          newEvaluation.communication_feedback || "",
      };

      // Replace existing evaluation if question was already answered
      setEvaluations((previous) => {
        const filtered = previous.filter(
          (item) =>
            item.question_number !==
            currentQuestion.question_number
        );

        return [...filtered, savedEvaluation].sort(
          (a, b) =>
            a.question_number -
            b.question_number
        );
      });
    } catch (err: any) {
      Alert.alert(
        "Evaluation Failed",
        err?.message ||
          "Something went wrong."
      );
    } finally {
      setEvaluating(false);
    }
  };

  // ============================================================
  // GENERATE FINAL REPORT
  // ============================================================

  const generateFinalReport = async (
    allEvaluations: SavedEvaluation[]
  ) => {
    try {
      setGeneratingReport(true);

      const token = getToken();

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please login again."
        );
        setGeneratingReport(false);
        return;
      }

      if (
        !mockInterview ||
        allEvaluations.length !==
          mockInterview.questions.length
      ) {
        Alert.alert(
          "Interview Incomplete",
          `Please complete all ${mockInterview?.questions?.length || 10} questions first.`
        );

        setGeneratingReport(false);
        return;
      }

      // Make sure questions are sent in correct order
      const orderedEvaluations =
        [...allEvaluations].sort(
          (a, b) =>
            a.question_number -
            b.question_number
        );

      console.log(
        "FINAL REPORT REQUEST:",
        JSON.stringify(
          orderedEvaluations,
          null,
          2
        )
      );

      const response = await fetch(
        `${API_BASE_URL}/api/v1/mock-interview/final-report`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            evaluations:
              orderedEvaluations,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "FINAL REPORT RESPONSE:",
        JSON.stringify(data, null, 2)
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to generate final report."
        );
      }

      /*
       * Backend response may be:
       *
       * {
       *   final_report: {...}
       * }
       *
       * OR
       *
       * {
       *   report: {...}
       * }
       *
       * OR directly:
       *
       * {
       *   overall_score: ...
       * }
       *
       * So handle all three safely.
       */

      const reportFromServer =
        data?.final_report ||
        data?.report ||
        data;

      if (
        !reportFromServer ||
        typeof reportFromServer !== "object"
      ) {
        throw new Error(
          "Final report data was not received correctly."
        );
      }

      const normalizedReport: FinalReport = {
        overall_score:
          Number(
            reportFromServer.overall_score
          ) || 0,

        average_score:
          Number(
            reportFromServer.average_score
          ) || 0,

        performance_level:
          reportFromServer.performance_level ||
          "Needs Improvement",

        category_performance:
          reportFromServer.category_performance ||
          {},

        strengths:
          Array.isArray(
            reportFromServer.strengths
          )
            ? reportFromServer.strengths
            : [],

        weak_areas:
          Array.isArray(
            reportFromServer.weak_areas
          )
            ? reportFromServer.weak_areas
            : [],

        improvement_suggestions:
          Array.isArray(
            reportFromServer.improvement_suggestions
          )
            ? reportFromServer.improvement_suggestions
            : [],

        interview_readiness:
          reportFromServer.interview_readiness ||
          {
            status: "Review Required",
            summary:
              "Continue practicing interview questions.",
          },

        final_advice:
          reportFromServer.final_advice ||
          "Keep practicing and improve your weak areas.",
      };

      console.log(
        "NORMALIZED FINAL REPORT:",
        normalizedReport
      );

      // IMPORTANT:
      // First save report, then show completed screen.
      setFinalReport(normalizedReport);
      setCompleted(true);
    } catch (err: any) {
      console.error(
        "FINAL REPORT ERROR:",
        err
      );

      Alert.alert(
        "Final Report Failed",
        err?.message ||
          "Something went wrong while generating the final report."
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // ============================================================
  // NEXT / FINISH
  // ============================================================

  const goToNextQuestion = async () => {
    if (!mockInterview || !currentQuestion) {
      return;
    }

    /*
     * IMPORTANT:
     * If this is the last question, make sure
     * the latest evaluation is included.
     */

    const latestEvaluation =
      evaluation
        ? {
            question_number:
              currentQuestion.question_number,

            question:
              currentQuestion.question,

            category:
              currentQuestion.category,

            answer:
              answer.trim(),

            score:
              Number(evaluation.score) || 0,

            rating:
              evaluation.rating || "",

            feedback:
              evaluation.feedback || "",

            strengths:
              evaluation.strengths || [],

            missing_points:
              evaluation.missing_points || [],

            improved_answer:
              evaluation.improved_answer || "",

            communication_feedback:
              evaluation.communication_feedback || "",
          }
        : null;

    let updatedEvaluations =
      [...evaluations];

    if (latestEvaluation) {
      updatedEvaluations =
        updatedEvaluations.filter(
          (item) =>
            item.question_number !==
            latestEvaluation.question_number
        );

      updatedEvaluations.push(
        latestEvaluation
      );
    }

    updatedEvaluations.sort(
      (a, b) =>
        a.question_number -
        b.question_number
    );

    // ========================================================
    // LAST QUESTION
    // ========================================================

    if (
      currentQuestionIndex ===
      mockInterview.questions.length - 1
    ) {
      if (
        updatedEvaluations.length !==
        mockInterview.questions.length
      ) {
        Alert.alert(
          "Interview Incomplete",
          `Only ${updatedEvaluations.length}/${mockInterview.questions.length} questions are completed.`
        );
        return;
      }

      await generateFinalReport(
        updatedEvaluations
      );

      return;
    }

    // ========================================================
    // NEXT QUESTION
    // ========================================================

    const nextIndex =
      currentQuestionIndex + 1;

    const nextQuestion =
      mockInterview.questions[nextIndex];

    const savedNext =
      updatedEvaluations.find(
        (item) =>
          item.question_number ===
          nextQuestion.question_number
      );

    setCurrentQuestionIndex(
      nextIndex
    );

    if (savedNext) {
      setAnswer(savedNext.answer);

      setEvaluation({
        score: savedNext.score,
        rating: savedNext.rating,
        feedback: savedNext.feedback,
        strengths:
          savedNext.strengths,
        missing_points:
          savedNext.missing_points,
        improved_answer:
          savedNext.improved_answer,
        communication_feedback:
          savedNext.communication_feedback,
      });
    } else {
      setAnswer("");
      setEvaluation(null);
    }
  };

  // ============================================================
  // PREVIOUS QUESTION
  // ============================================================

  const goToPreviousQuestion = () => {
    if (
      currentQuestionIndex <= 0 ||
      !mockInterview
    ) {
      return;
    }

    const previousIndex =
      currentQuestionIndex - 1;

    const previousQuestion =
      mockInterview.questions[
        previousIndex
      ];

    const saved =
      evaluations.find(
        (item) =>
          item.question_number ===
          previousQuestion.question_number
      );

    setCurrentQuestionIndex(
      previousIndex
    );

    if (saved) {
      setAnswer(saved.answer);

      setEvaluation({
        score: saved.score,
        rating: saved.rating,
        feedback: saved.feedback,
        strengths:
          saved.strengths,
        missing_points:
          saved.missing_points,
        improved_answer:
          saved.improved_answer,
        communication_feedback:
          saved.communication_feedback,
      });
    } else {
      setAnswer("");
      setEvaluation(null);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Generating your personalized AI
          mock interview...
        </Text>
      </View>
    );
  }

  // ============================================================
  // GENERATING FINAL REPORT
  // ============================================================

  if (generatingReport) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.loadingTitle}>
          🎯 Interview Completed
        </Text>

        <Text style={styles.loadingText}>
          AI is analyzing all{" "}
          {mockInterview?.total_questions ||
            10}{" "}
          answers and preparing your
          final interview report...
        </Text>
      </View>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Unable to load mock interview
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadMockInterview}
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // NO DATA
  // ============================================================

  if (!mockInterview) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Mock interview data is unavailable.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadMockInterview}
        >
          <Text style={styles.primaryButtonText}>
            Generate Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // FINAL REPORT SCREEN
  // ============================================================

  if (completed && finalReport) {
    const categories =
      finalReport.category_performance ||
      {};

    return (
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.topBackButton}
        >
          <Text
            style={
              styles.topBackButtonText
            }
          >
            ← Back
          </Text>
        </TouchableOpacity>

        {/* HERO */}

        <View style={styles.completedHero}>
          <Text style={styles.completedIcon}>
            🎉
          </Text>

          <Text
            style={styles.completedTitle}
          >
            Interview Complete
          </Text>

          <Text
            style={styles.completedSubtitle}
          >
            Your personalized AI interview
            report is ready.
          </Text>
        </View>

        {/* OVERALL SCORE */}

        <View
          style={styles.scoreReportCard}
        >
          <Text
            style={styles.reportCardTitle}
          >
            🏆 Overall Performance
          </Text>

          <Text style={styles.bigScore}>
            {finalReport.overall_score}/100
          </Text>

          <Text
            style={styles.averageScore}
          >
            Average Score:{" "}
            {finalReport.average_score}/10
          </Text>

          <View
            style={
              styles.performanceBadge
            }
          >
            <Text
              style={
                styles.performanceBadgeText
              }
            >
              {finalReport.performance_level}
            </Text>
          </View>
        </View>

        {/* READINESS */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🎯 Interview Readiness
          </Text>

          <Text
            style={styles.readinessStatus}
          >
            {
              finalReport
                .interview_readiness
                ?.status
            }
          </Text>

          <Text style={styles.cardText}>
            {
              finalReport
                .interview_readiness
                ?.summary
            }
          </Text>
        </View>

        {/* CATEGORY PERFORMANCE */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📊 Category Performance
          </Text>

          {Object.entries(categories).map(
            ([categoryName, categoryData]) => {
              if (!categoryData) {
                return null;
              }

              return (
                <View
                  key={categoryName}
                >
                  <View
                    style={
                      styles.categoryRow
                    }
                  >
                    <Text
                      style={
                        styles.categoryName
                      }
                    >
                      {categoryName
                        .charAt(0)
                        .toUpperCase() +
                        categoryName.slice(
                          1
                        )}
                    </Text>

                    <Text
                      style={
                        styles.categoryScore
                      }
                    >
                      {
                        categoryData.score
                      }
                      /10
                    </Text>
                  </View>

                  {categoryData.feedback ? (
                    <Text
                      style={
                        styles.categoryFeedbackText
                      }
                    >
                      {
                        categoryData.feedback
                      }
                    </Text>
                  ) : null}
                </View>
              );
            }
          )}
        </View>

        {/* STRENGTHS */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            ✅ Your Strengths
          </Text>

          {finalReport.strengths?.length >
          0 ? (
            finalReport.strengths.map(
              (item, index) => (
                <Text
                  key={index}
                  style={
                    styles.bulletText
                  }
                >
                  • {item}
                </Text>
              )
            )
          ) : (
            <Text style={styles.cardText}>
              No specific strengths were
              generated.
            </Text>
          )}
        </View>

        {/* WEAK AREAS */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📌 Areas to Improve
          </Text>

          {finalReport.weak_areas
            ?.length > 0 ? (
            finalReport.weak_areas.map(
              (item, index) => (
                <Text
                  key={index}
                  style={
                    styles.bulletText
                  }
                >
                  • {item}
                </Text>
              )
            )
          ) : (
            <Text style={styles.cardText}>
              No major weak areas were
              identified.
            </Text>
          )}
        </View>

        {/* IMPROVEMENT */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            💡 Improvement Suggestions
          </Text>

          {finalReport
            .improvement_suggestions
            ?.length > 0 ? (
            finalReport.improvement_suggestions.map(
              (item, index) => (
                <Text
                  key={index}
                  style={
                    styles.bulletText
                  }
                >
                  • {item}
                </Text>
              )
            )
          ) : (
            <Text style={styles.cardText}>
              Keep practicing interview
              questions regularly.
            </Text>
          )}
        </View>

        {/* FINAL ADVICE */}

        <View
          style={
            styles.improvedAnswerBox
          }
        >
          <Text style={styles.cardTitle}>
            🚀 Final Advice
          </Text>

          <Text style={styles.cardText}>
            {finalReport.final_advice}
          </Text>
        </View>

        {/* NEW INTERVIEW */}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadMockInterview}
        >
          <Text
            style={styles.primaryButtonText}
          >
            Start New Mock Interview
          </Text>
        </TouchableOpacity>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    );
  }

  // ============================================================
  // INTERVIEW QUESTION SCREEN
  // ============================================================

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.topBackButton}
      >
        <Text
          style={styles.topBackButtonText}
        >
          ← Back
        </Text>
      </TouchableOpacity>

      {/* HERO */}

      <View style={styles.hero}>
        <Text style={styles.heroIcon}>
          🎤
        </Text>

        <Text style={styles.title}>
          {mockInterview.interview_title}
        </Text>

        <Text style={styles.subtitle}>
          Practice a personalized interview
          based on your resume and career
          goal.
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text
              style={styles.infoLabel}
            >
              Target Role
            </Text>

            <Text
              style={styles.infoValue}
            >
              {mockInterview.target_role}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text
              style={styles.infoLabel}
            >
              Question
            </Text>

            <Text
              style={styles.infoValue}
            >
              {currentQuestionIndex + 1}/
              {mockInterview.total_questions}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text
              style={styles.infoLabel}
            >
              Level
            </Text>

            <Text
              style={styles.infoValue}
            >
              {mockInterview.difficulty}
            </Text>
          </View>
        </View>
      </View>

      {/* PROGRESS */}

      <View
        style={styles.progressContainer}
      >
        <View
          style={[
            styles.progressBar,
            {
              width: `${
                ((currentQuestionIndex +
                  1) /
                  mockInterview.total_questions) *
                100
              }%`,
            },
          ]}
        />
      </View>

      {/* INSTRUCTIONS */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          📌 Instructions
        </Text>

        {mockInterview.instructions.map(
          (instruction, index) => (
            <Text
              key={index}
              style={styles.bulletText}
            >
              • {instruction}
            </Text>
          )
        )}
      </View>

      {/* QUESTION */}

      {currentQuestion && (
        <View style={styles.questionCard}>
          <View
            style={styles.questionHeader}
          >
            <Text
              style={
                styles.questionNumber
              }
            >
              Question{" "}
              {currentQuestion.question_number}
            </Text>

            <Text style={styles.category}>
              {currentQuestion.category}
            </Text>
          </View>

          <Text style={styles.difficulty}>
            Difficulty:{" "}
            {currentQuestion.difficulty}
          </Text>

          <Text
            style={styles.questionText}
          >
            {currentQuestion.question}
          </Text>

          <Text
            style={styles.answerLabel}
          >
            Your Answer
          </Text>

          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your interview answer here..."
            multiline
            textAlignVertical="top"
            style={styles.answerInput}
            editable={
              !evaluating &&
              !evaluation
            }
          />

          {!evaluation && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                evaluating &&
                  styles.disabledButton,
              ]}
              onPress={
                evaluateAnswer
              }
              disabled={evaluating}
            >
              {evaluating ? (
                <View
                  style={
                    styles.buttonLoading
                  }
                >
                  <ActivityIndicator
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    AI is evaluating...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Submit Answer
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* EVALUATION */}

      {evaluation && (
        <View
          style={styles.evaluationCard}
        >
          <Text
            style={styles.evaluationTitle}
          >
            🤖 AI Evaluation
          </Text>

          <View
            style={styles.scoreContainer}
          >
            <Text style={styles.score}>
              {evaluation.score}/10
            </Text>

            <Text style={styles.rating}>
              {evaluation.rating}
            </Text>
          </View>

          {/* FEEDBACK */}

          <View
            style={styles.feedbackSection}
          >
            <Text
              style={styles.sectionTitle}
            >
              💬 Feedback
            </Text>

            <Text
              style={styles.sectionText}
            >
              {evaluation.feedback}
            </Text>
          </View>

          {/* STRENGTHS */}

          <View
            style={styles.feedbackSection}
          >
            <Text
              style={styles.sectionTitle}
            >
              ✅ Strengths
            </Text>

            {evaluation.strengths?.map(
              (item, index) => (
                <Text
                  key={index}
                  style={
                    styles.bulletText
                  }
                >
                  • {item}
                </Text>
              )
            )}
          </View>

          {/* MISSING POINTS */}

          <View
            style={styles.feedbackSection}
          >
            <Text
              style={styles.sectionTitle}
            >
              📌 Missing Points
            </Text>

            {evaluation.missing_points?.map(
              (item, index) => (
                <Text
                  key={index}
                  style={
                    styles.bulletText
                  }
                >
                  • {item}
                </Text>
              )
            )}
          </View>

          {/* IMPROVED ANSWER */}

          <View
            style={
              styles.improvedAnswerBox
            }
          >
            <Text
              style={styles.sectionTitle}
            >
              💡 Improved Answer
            </Text>

            <Text
              style={styles.sectionText}
            >
              {evaluation.improved_answer}
            </Text>
          </View>

          {/* COMMUNICATION */}

          <View
            style={styles.feedbackSection}
          >
            <Text
              style={styles.sectionTitle}
            >
              🗣️ Communication Feedback
            </Text>

            <Text
              style={styles.sectionText}
            >
              {
                evaluation.communication_feedback
              }
            </Text>
          </View>

          {/* NAVIGATION */}

          <View
            style={styles.navigationRow}
          >
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                currentQuestionIndex ===
                  0 &&
                  styles.disabledSecondaryButton,
              ]}
              onPress={
                goToPreviousQuestion
              }
              disabled={
                currentQuestionIndex ===
                0
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                ← Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.primarySmallButton
              }
              onPress={
                goToNextQuestion
              }
              disabled={
                generatingReport
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {currentQuestionIndex ===
                mockInterview.questions.length -
                  1
                  ? "Finish Interview"
                  : "Next Question →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View
        style={styles.bottomSpace}
      />
    </ScrollView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#f7f8fc",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f7f8fc",
  },

  loadingTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    color: "#555",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  errorText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  topBackButton: {
    marginBottom: 16,
  },

  topBackButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  hero: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  heroIcon: {
    fontSize: 38,
    marginBottom: 8,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 8,
    color: "#111827",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6b7280",
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: "row",
    gap: 8,
  },

  infoBox: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 10,
  },

  infoLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  progressContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111827",
  },

  cardText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#374151",
  },

  bulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 7,
  },

  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  questionNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },

  category: {
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  difficulty: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 14,
  },

  questionText: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },

  answerLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },

  answerInput: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 6,
  },

  primarySmallButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flex: 1,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  evaluationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  evaluationTitle: {
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 18,
    color: "#111827",
  },

  scoreContainer: {
    alignItems: "center",
    padding: 18,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    marginBottom: 18,
  },

  score: {
    fontSize: 34,
    fontWeight: "900",
    color: "#2563eb",
  },

  rating: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 5,
    color: "#374151",
  },

  feedbackSection: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
  },

  improvedAnswerBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 15,
    marginBottom: 18,
  },

  navigationRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  disabledSecondaryButton: {
    opacity: 0.4,
  },

  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },

  backButton: {
    marginTop: 10,
    paddingVertical: 12,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  completedHero: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    marginBottom: 16,
  },

  completedIcon: {
    fontSize: 55,
    marginBottom: 10,
  },

  completedTitle: {
    fontSize: 27,
    fontWeight: "900",
    marginBottom: 8,
  },

  completedSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },

  scoreReportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },

  reportCardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  bigScore: {
    fontSize: 52,
    fontWeight: "900",
    color: "#2563eb",
    marginVertical: 8,
  },

  averageScore: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 14,
  },

  performanceBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },

  performanceBadgeText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "800",
  },

  readinessStatus: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 8,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },

  categoryName: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },

  categoryScore: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "800",
  },

  categoryFeedbackText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b7280",
    paddingVertical: 8,
  },

  bottomSpace: {
    height: 30,
  },
});