// import { useFonts } from "expo-font";
// import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useEffect } from "react";
// import { useRouter, useSegments } from "expo-router";
// import "react-native-reanimated";

// import { useColorScheme } from "@/components/useColorScheme";

// export {
//   ErrorBoundary,
// } from "expo-router";

// export const unstable_settings = {
//   initialRouteName: "(tabs)",
// };

// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const [loaded, error] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//   });

//   useEffect(() => {
//     if (error) throw error;
//   }, [error]);

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return <RootLayoutNav />;
// }

// function RootLayoutNav() {
//   const colorScheme = useColorScheme();

//   const router = useRouter();
//   const segments = useSegments();

//   useEffect(() => {
//     const checkAuthentication = () => {
//       const token = localStorage.getItem("access_token");

//       const firstSegment = segments[0];

//       const publicRoutes = [
//         "login",
//         "signup",
//       ];

//       const isPublicRoute =
//         firstSegment && publicRoutes.includes(firstSegment);

//       const isAuthenticated = !!token;

//       // User is NOT logged in and trying to access
//       // a protected page.
//       if (!isAuthenticated && !isPublicRoute) {
//         router.replace("/login");
//         return;
//       }

//       // User is already logged in and opens
//       // login/signup page.
//       if (
//         isAuthenticated &&
//         isPublicRoute
//       ) {
//         router.replace("/");
//       }
//     };

//     checkAuthentication();
//   }, [segments]);

//   return (
//     <ThemeProvider
//       value={
//         colorScheme === "dark"
//           ? DarkTheme
//           : DefaultTheme
//       }
//     >
//       <Stack>
//         <Stack.Screen
//           name="(tabs)"
//           options={{
//             headerShown: false,
//           }}
//         />

//         <Stack.Screen
//           name="login"
//           options={{
//             headerShown: false,
//           }}
//         />

//         <Stack.Screen
//           name="signup"
//           options={{
//             headerShown: false,
//           }}
//         />

//         <Stack.Screen
//           name="modal"
//           options={{
//             presentation: "modal",
//           }}
//         />
//       </Stack>
//     </ThemeProvider>
//   );
// }








import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

const API_URL = "http://127.0.0.1:8001";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.detail || "Invalid email or password."
        );
        return;
      }

      localStorage.setItem("access_token", data.access_token);

      router.replace("/");
    } catch (error) {
      setErrorMessage(
        "Could not connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back 👋</Text>

        <Text style={styles.subtitle}>
          Login to your AI Career Assistant
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/signup")}
          activeOpacity={0.7}
        >
          <Text style={styles.signupText}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 28,
  },

  input: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 15,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 14,
  },

  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  signupText: {
    textAlign: "center",
    marginTop: 22,
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});