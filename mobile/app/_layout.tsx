// import { useFonts } from "expo-font";
// import {
//   DarkTheme,
//   DefaultTheme,
//   Stack,
//   ThemeProvider,
// } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { useEffect } from "react";
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

//   return (
//     <ThemeProvider
//       value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
//     >
//       <Stack>
//         <Stack.Screen
//           name="(tabs)"
//           options={{ headerShown: false }}
//         />

//         <Stack.Screen
//           name="modal"
//           options={{ presentation: "modal" }}
//         />
//       </Stack>
//     </ThemeProvider>
//   );
// }






import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        const firstSegment = segments[0];

        const publicRoutes = ["login", "signup"];

        const isPublicRoute =
          firstSegment &&
          publicRoutes.includes(firstSegment);

        const isAuthenticated = !!token;

        // User is not logged in
        // and trying to access protected page
        if (!isAuthenticated && !isPublicRoute) {
          router.replace("/login");
          return;
        }

        // User is already logged in
        // and trying to open login/signup
        if (isAuthenticated && isPublicRoute) {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.log("Authentication check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [segments]);

  if (checkingAuth) {
    return null;
  }

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}