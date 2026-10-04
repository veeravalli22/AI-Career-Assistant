import {
  // Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export default function HomeScreen() {
   useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
    }
  }, []);

  const features = [
    {
      title: "Resume Analyzer",
      description: "Analyze your resume with AI",
      icon: "📄",
    },
    {
      title: "Job Description Analyzer",
      description: "Understand job requirements",
      icon: "💼",
    },
    {
      title: "Skill Gap Analysis",
      description: "Find the skills you need",
      icon: "🧩",
    },
    {
      title: "Career Roadmap",
      description: "Build your learning path",
      icon: "🗺️",
    },
    {
      title: "Interview Preparation",
      description: "Prepare for technical interviews",
      icon: "🎯",
    },
    {
      title: "AI Mock Interview",
      description: "Practice with AI",
      icon: "🎤",
    },
    {
      title: "Career AI Chat",
      description: "Ask your career questions",
      icon: "🤖",
    },
    {
      title: "My Progress",
      description: "Track your career progress",
      icon: "📊",
    },
  ];

  const handleFeaturePress = (title: string) => {
    switch (title) {
      case "Resume Analyzer":
        router.push("/resume");
        break;

      case "Job Description Analyzer":
        router.push("/jd");
        break;

      case "Skill Gap Analysis":
        router.push("/skill-gap");
        break;

      case "Career Roadmap":
        router.push("/career");
        break;

      case "Interview Preparation":
        router.push("/interview");
        break;

      case "AI Mock Interview":
        router.push("/mock-interview");
        break;

      case "Career AI Chat":
        router.push("/career-chat");
        break;

      case "My Progress":
        router.push("/progress");
        break;

      default:
        break;
    }
  };

  // const handleLogout = () => {
  //   Alert.alert(
  //     "Logout",
  //     "Are you sure you want to logout?",
  //     [
  //       {
  //         text: "Cancel",
  //         style: "cancel",
  //       },
  //       {
  //         text: "Logout",
  //         style: "destructive",
  //         onPress: () => {
  //           localStorage.removeItem("access_token");
  //           router.replace("/login");
  //         },
  //       },
  //     ]
  //   );
  // };
  const handleLogout = () => {
  localStorage.removeItem("access_token");
  router.replace("/login");
};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Welcome back, Chaitanya 👋
            </Text>

            <Text style={styles.title}>
              AI Career & Placement Assistant
            </Text>

            <Text style={styles.subtitle}>
              Your AI-powered career companion
            </Text>
          </View>

          {/* LOGOUT BUTTON */}

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.75}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>↪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CAREER JOURNEY CARD */}

      <View style={styles.profileCard}>
        <View style={styles.profileContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              CAREER JOURNEY
            </Text>
          </View>

          <Text style={styles.profileTitle}>
            Get ready for your dream career 🚀
          </Text>

          <Text style={styles.profileText}>
            Analyze your skills, improve your resume,
            practice interviews and become job-ready.
          </Text>
        </View>

        <Text style={styles.rocket}>
          🚀
        </Text>
      </View>

      {/* CAREER TOOLS */}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Career Tools
        </Text>

        <Text style={styles.sectionSubtitle}>
          Explore your AI-powered tools
        </Text>
      </View>

      {/* FEATURE CARDS */}

      {features.map((feature) => (
        <TouchableOpacity
          key={feature.title}
          style={styles.featureCard}
          activeOpacity={0.75}
          onPress={() => handleFeaturePress(feature.title)}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              {feature.icon}
            </Text>
          </View>

          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              {feature.title}
            </Text>

            <Text style={styles.featureDescription}>
              {feature.description}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>
              ›
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* FOOTER */}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          AI-powered tools to help you prepare for placements.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 35,
  },

  /* HEADER */

  header: {
    marginBottom: 24,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "500",
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 35,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 22,
  },

  /* LOGOUT */

  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },

  logoutIcon: {
    fontSize: 19,
    color: "#DC2626",
    marginBottom: 1,
  },

  logoutText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },

  /* CAREER JOURNEY */

  profileCard: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 20,
    minHeight: 175,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,

    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },

  profileContent: {
    flex: 1,
    paddingRight: 8,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },

  badgeText: {
    color: "#DBEAFE",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  profileTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 25,
    marginBottom: 7,
  },

  profileText: {
    color: "#DBEAFE",
    fontSize: 13,
    lineHeight: 19,
  },

  rocket: {
    fontSize: 43,
    marginLeft: 8,
  },

  /* SECTION */

  sectionHeader: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 3,
  },

  /* FEATURE CARD */

  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  icon: {
    fontSize: 27,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  arrow: {
    fontSize: 23,
    color: "#64748B",
    marginTop: -2,
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 5,
  },

  footerText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});