// import {
//   ActivityIndicator,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { router } from "expo-router";
// import { useEffect, useState } from "react";

// const API_URL = "http://localhost:8001";

// /* =========================================================
//    STORAGE KEYS
// ========================================================= */

// const JD_TEXT_KEY = "jd_job_description";
// const JD_ANALYSIS_KEY = "jd_analysis";
// const ACCESS_TOKEN_KEY = "access_token";

// /* =========================================================
//    STORAGE HELPERS
// ========================================================= */

// async function saveStorage(
//   key: string,
//   value: string
// ): Promise<void> {
//   try {
//     if (Platform.OS === "web") {
//       window.localStorage.setItem(key, value);
//       return;
//     }

//     const AsyncStorage =
//       require("@react-native-async-storage/async-storage").default;

//     await AsyncStorage.setItem(key, value);
//   } catch (error) {
//     console.log("Could not save storage:", error);
//   }
// }

// async function getStorage(
//   key: string
// ): Promise<string | null> {
//   try {
//     if (Platform.OS === "web") {
//       return window.localStorage.getItem(key);
//     }

//     const AsyncStorage =
//       require("@react-native-async-storage/async-storage").default;

//     return await AsyncStorage.getItem(key);
//   } catch (error) {
//     console.log("Could not read storage:", error);
//     return null;
//   }
// }

// /* =========================================================
//    TYPES
// ========================================================= */

// type SectionId =
//   | "job"
//   | "skills"
//   | "syllabus"
//   | "roadmap"
//   | "daily"
//   | "interview";

// type SyllabusItem = {
//   topic?: string;
//   models?: string[];
// };

// type Analysis = {
//   job_overview?: {
//     job_title?: string;
//     company?: string;
//     location?: string;
//     job_type?: string;
//     eligibility?: string[];
//     responsibilities?: string[];
//     interview_process?: string[];
//   };

//   skills_to_prepare?: {
//     skill?: string;
//     priority?: string;
//     reason?: string;
//   }[];

//   complete_syllabus?: {
//     technical?: SyllabusItem[];
//     aptitude?: SyllabusItem[];
//     reasoning?: SyllabusItem[];
//     english?: SyllabusItem[];
//     interview?: SyllabusItem[];
//   };

//   daily_time_allocation?: {
//     technical_minutes?: number;
//     aptitude_minutes?: number;
//     reasoning_minutes?: number;
//     english_minutes?: number;
//     interview_minutes?: number;
//     total_minutes?: number;
//   };

//   eight_week_roadmap?: {
//     week?: number;

//     days?: {
//       day?: number;

//       technical?: {
//         topic?: string;
//         models?: string[];
//         minutes?: number;
//         practice_questions?: number;
//         practice_programs?: number;
//       };

//       aptitude?: {
//         topic?: string;
//         models?: string[];
//         minutes?: number;
//         practice_questions?: number;
//       };

//       reasoning?: {
//         topic?: string;
//         models?: string[];
//         minutes?: number;
//         practice_questions?: number;
//       };

//       english?: {
//         topic?: string;
//         task?: string;
//         minutes?: number;
//       };

//       interview?: {
//         topic?: string;
//         task?: string;
//         minutes?: number;
//       };
//     }[];
//   }[];

//   daily_practice_system?: {
//     technical?: string[];
//     aptitude?: string[];
//     reasoning?: string[];
//     english?: string[];
//     interview?: string[];
//   };

//   interview_preparation?: {
//     technical_questions?: string[];
//     hr_questions?: string[];
//     project_questions?: string[];
//     communication_practice?: string[];
//   };
// };

// type Section = {
//   id: SectionId;
//   title: string;
//   icon: string;
// };

// const sections: Section[] = [
//   {
//     id: "job",
//     title: "Job Overview",
//     icon: "💼",
//   },
//   {
//     id: "skills",
//     title: "Skills to Prepare",
//     icon: "🎯",
//   },
//   {
//     id: "syllabus",
//     title: "Complete Syllabus",
//     icon: "📚",
//   },
//   {
//     id: "roadmap",
//     title: "8-Week Roadmap",
//     icon: "📅",
//   },
//   {
//     id: "daily",
//     title: "Daily Practice",
//     icon: "⏱️",
//   },
//   {
//     id: "interview",
//     title: "Interview Preparation",
//     icon: "🎤",
//   },
// ];

// /* =========================================================
//    COMMON BULLET LIST
// ========================================================= */

// function BulletList({
//   items,
//   emptyText = "No details available.",
// }: {
//   items?: string[];
//   emptyText?: string;
// }) {
//   if (!items || items.length === 0) {
//     return (
//       <Text style={styles.emptyText}>
//         {emptyText}
//       </Text>
//     );
//   }

//   return (
//     <View style={styles.bulletList}>
//       {items.map((item, index) => (
//         <View
//           key={`${item}-${index}`}
//           style={styles.bulletRow}
//         >
//           <Text style={styles.bullet}>
//             •
//           </Text>

//           <Text style={styles.bulletText}>
//             {item}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// /* =========================================================
//    MODELS LIST
// ========================================================= */

// function ModelsList({
//   models,
// }: {
//   models?: string[];
// }) {
//   if (!models || models.length === 0) {
//     return null;
//   }

//   return (
//     <View style={styles.modelsContainer}>
//       <Text style={styles.smallHeading}>
//         Models to Practice
//       </Text>

//       {models.map((model, index) => (
//         <View
//           key={`${model}-${index}`}
//           style={styles.modelRow}
//         >
//           <Text style={styles.modelNumber}>
//             {index + 1}
//           </Text>

//           <Text style={styles.modelText}>
//             {model}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );
// }

// /* =========================================================
//    SYLLABUS SUBJECT ACCORDION
// ========================================================= */

// function SyllabusSubject({
//   title,
//   data,
//   isOpen,
//   onPress,
// }: {
//   title: string;

//   data?: {
//     topic?: string;
//     models?: string[];
//   }[];

//   isOpen: boolean;

//   onPress: () => void;
// }) {
//   if (!data || data.length === 0) {
//     return null;
//   }

//   return (
//     <View
//       style={styles.syllabusSubjectWrapper}
//     >
//       <TouchableOpacity
//         style={[
//           styles.syllabusSubjectHeader,
//           isOpen &&
//             styles.syllabusSubjectHeaderOpen,
//         ]}
//         onPress={onPress}
//         activeOpacity={0.8}
//       >
//         <Text
//           style={styles.syllabusSubjectTitle}
//         >
//           {title}
//         </Text>

//         <Text
//           style={styles.syllabusSubjectArrow}
//         >
//           {isOpen ? "⌃" : "›"}
//         </Text>
//       </TouchableOpacity>

//       {isOpen ? (
//         <View
//           style={
//             styles.syllabusSubjectContent
//           }
//         >
//           {data.map((item, index) => (
//             <View
//               key={`${item.topic}-${index}`}
//               style={styles.topicCard}
//             >
//               <Text style={styles.topicTitle}>
//                 {index + 1}.{" "}
//                 {item.topic || "Topic"}
//               </Text>

//               <ModelsList
//                 models={item.models}
//               />
//             </View>
//           ))}
//         </View>
//       ) : null}
//     </View>
//   );
// }

// /* =========================================================
//    DAY BLOCK
// ========================================================= */

// function DayBlock({
//   day,
// }: {
//   day: NonNullable<
//     NonNullable<
//       Analysis["eight_week_roadmap"]
//     >[number]["days"]
//   >[number];
// }) {
//   return (
//     <View style={styles.dayCard}>
//       <Text style={styles.dayTitle}>
//         Day {day.day}
//       </Text>

//       {/* TECHNICAL */}

//       {day.technical ? (
//         <View style={styles.dailySubject}>
//           <Text
//             style={styles.dailySubjectTitle}
//           >
//             💻 Technical
//           </Text>

//           <Text style={styles.dailyTopic}>
//             {day.technical.topic ||
//               "Technical topic"}
//           </Text>

//           <ModelsList
//             models={day.technical.models}
//           />

//           <Text style={styles.practiceInfo}>
//             ⏱{" "}
//             {day.technical.minutes ?? 0}{" "}
//             minutes
//           </Text>

//           {(day.technical
//             .practice_programs ?? 0) > 0 ? (
//             <Text
//               style={styles.practiceInfo}
//             >
//               💻 Coding practice:{" "}
//               {
//                 day.technical
//                   .practice_programs
//               }{" "}
//               programs
//             </Text>
//           ) : null}

//           {(day.technical
//             .practice_questions ?? 0) > 0 ? (
//             <Text
//               style={styles.practiceInfo}
//             >
//               📝 Practice:{" "}
//               {
//                 day.technical
//                   .practice_questions
//               }{" "}
//               questions
//             </Text>
//           ) : null}
//         </View>
//       ) : null}

//       {/* APTITUDE */}

//       {day.aptitude ? (
//         <View style={styles.dailySubject}>
//           <Text
//             style={styles.dailySubjectTitle}
//           >
//             🔢 Aptitude
//           </Text>

//           <Text style={styles.dailyTopic}>
//             {day.aptitude.topic ||
//               "Aptitude topic"}
//           </Text>

//           <ModelsList
//             models={day.aptitude.models}
//           />

//           <Text style={styles.practiceInfo}>
//             ⏱{" "}
//             {day.aptitude.minutes ?? 0}{" "}
//             minutes
//           </Text>

//           {(day.aptitude
//             .practice_questions ?? 0) > 0 ? (
//             <Text
//               style={styles.practiceInfo}
//             >
//               📝 Practice:{" "}
//               {
//                 day.aptitude
//                   .practice_questions
//               }{" "}
//               questions
//             </Text>
//           ) : null}
//         </View>
//       ) : null}

//       {/* REASONING */}

//       {day.reasoning ? (
//         <View style={styles.dailySubject}>
//           <Text
//             style={styles.dailySubjectTitle}
//           >
//             🧠 Reasoning
//           </Text>

//           <Text style={styles.dailyTopic}>
//             {day.reasoning.topic ||
//               "Reasoning topic"}
//           </Text>

//           <ModelsList
//             models={day.reasoning.models}
//           />

//           <Text style={styles.practiceInfo}>
//             ⏱{" "}
//             {day.reasoning.minutes ?? 0}{" "}
//             minutes
//           </Text>

//           {(day.reasoning
//             .practice_questions ?? 0) > 0 ? (
//             <Text
//               style={styles.practiceInfo}
//             >
//               📝 Practice:{" "}
//               {
//                 day.reasoning
//                   .practice_questions
//               }{" "}
//               questions
//             </Text>
//           ) : null}
//         </View>
//       ) : null}

//       {/* ENGLISH */}

//       {day.english ? (
//         <View style={styles.dailySubject}>
//           <Text
//             style={styles.dailySubjectTitle}
//           >
//             🗣️ English
//           </Text>

//           <Text style={styles.dailyTopic}>
//             {day.english.topic ||
//               "English practice"}
//           </Text>

//           {day.english.task ? (
//             <Text style={styles.taskText}>
//               {day.english.task}
//             </Text>
//           ) : null}

//           <Text style={styles.practiceInfo}>
//             ⏱{" "}
//             {day.english.minutes ?? 0}{" "}
//             minutes
//           </Text>
//         </View>
//       ) : null}

//       {/* INTERVIEW */}

//       {day.interview ? (
//         <View style={styles.dailySubject}>
//           <Text
//             style={styles.dailySubjectTitle}
//           >
//             🎤 Interview
//           </Text>

//           <Text style={styles.dailyTopic}>
//             {day.interview.topic ||
//               "Interview practice"}
//           </Text>

//           {day.interview.task ? (
//             <Text style={styles.taskText}>
//               {day.interview.task}
//             </Text>
//           ) : null}

//           <Text style={styles.practiceInfo}>
//             ⏱{" "}
//             {day.interview.minutes ?? 0}{" "}
//             minutes
//           </Text>
//         </View>
//       ) : null}
//     </View>
//   );
// }

// /* =========================================================
//    JOB OVERVIEW
// ========================================================= */

// function JobOverview({
//   analysis,
// }: {
//   analysis: Analysis;
// }) {
//   const job = analysis.job_overview;

//   if (!job) {
//     return (
//       <Text style={styles.emptyText}>
//         No job overview available.
//       </Text>
//     );
//   }

//   return (
//     <View>
//       <View style={styles.infoGrid}>
//         <View style={styles.infoItem}>
//           <Text style={styles.infoLabel}>
//             Job Title
//           </Text>

//           <Text style={styles.infoValue}>
//             {job.job_title ||
//               "Not specified"}
//           </Text>
//         </View>

//         <View style={styles.infoItem}>
//           <Text style={styles.infoLabel}>
//             Company
//           </Text>

//           <Text style={styles.infoValue}>
//             {job.company ||
//               "Not specified"}
//           </Text>
//         </View>

//         <View style={styles.infoItem}>
//           <Text style={styles.infoLabel}>
//             Location
//           </Text>

//           <Text style={styles.infoValue}>
//             {job.location ||
//               "Not specified"}
//           </Text>
//         </View>

//         <View style={styles.infoItem}>
//           <Text style={styles.infoLabel}>
//             Job Type
//           </Text>

//           <Text style={styles.infoValue}>
//             {job.job_type ||
//               "Not specified"}
//           </Text>
//         </View>
//       </View>

//       <Text style={styles.subheading}>
//         Eligibility
//       </Text>

//       <BulletList
//         items={job.eligibility}
//       />

//       <Text style={styles.subheading}>
//         Responsibilities
//       </Text>

//       <BulletList
//         items={job.responsibilities}
//       />

//       <Text style={styles.subheading}>
//         Interview Process
//       </Text>

//       <BulletList
//         items={job.interview_process}
//       />
//     </View>
//   );
// }

// /* =========================================================
//    SKILLS
// ========================================================= */

// function SkillsSection({
//   analysis,
// }: {
//   analysis: Analysis;
// }) {
//   const skills =
//     analysis.skills_to_prepare;

//   if (!skills || skills.length === 0) {
//     return (
//       <Text style={styles.emptyText}>
//         No skill recommendations
//         available.
//       </Text>
//     );
//   }

//   return (
//     <View>
//       {skills.map((item, index) => (
//         <View
//           key={`${item.skill}-${index}`}
//           style={styles.skillCard}
//         >
//           <View style={styles.skillHeader}>
//             <Text style={styles.skillName}>
//               {item.skill || "Skill"}
//             </Text>

//             <View
//               style={styles.priorityBadge}
//             >
//               <Text
//                 style={styles.priorityText}
//               >
//                 {item.priority || "MEDIUM"}
//               </Text>
//             </View>
//           </View>

//           {item.reason ? (
//             <Text
//               style={styles.skillReason}
//             >
//               {item.reason}
//             </Text>
//           ) : null}
//         </View>
//       ))}
//     </View>
//   );
// }

// /* =========================================================
//    COMPLETE SYLLABUS
// ========================================================= */

// function SyllabusSection({
//   analysis,
// }: {
//   analysis: Analysis;
// }) {
//   const syllabus =
//     analysis.complete_syllabus;

//   const [openSubject, setOpenSubject] =
//     useState<string | null>(null);

//   if (!syllabus) {
//     return (
//       <Text style={styles.emptyText}>
//         Complete syllabus is not
//         available.
//       </Text>
//     );
//   }

//   const toggleSubject = (
//     subject: string
//   ) => {
//     setOpenSubject((current) =>
//       current === subject
//         ? null
//         : subject
//     );
//   };

//   return (
//     <View>
//       <Text style={styles.syllabusIntro}>
//         Tap a section to view all topics
//         and models to practice.
//       </Text>

//       <SyllabusSubject
//         title="💻 Technical"
//         data={syllabus.technical}
//         isOpen={
//           openSubject === "technical"
//         }
//         onPress={() =>
//           toggleSubject("technical")
//         }
//       />

//       <SyllabusSubject
//         title="🔢 Aptitude"
//         data={syllabus.aptitude}
//         isOpen={
//           openSubject === "aptitude"
//         }
//         onPress={() =>
//           toggleSubject("aptitude")
//         }
//       />

//       <SyllabusSubject
//         title="🧠 Reasoning"
//         data={syllabus.reasoning}
//         isOpen={
//           openSubject === "reasoning"
//         }
//         onPress={() =>
//           toggleSubject("reasoning")
//         }
//       />

//       <SyllabusSubject
//         title="🗣️ English"
//         data={syllabus.english}
//         isOpen={
//           openSubject === "english"
//         }
//         onPress={() =>
//           toggleSubject("english")
//         }
//       />

//       <SyllabusSubject
//         title="🎤 Interview"
//         data={syllabus.interview}
//         isOpen={
//           openSubject === "interview"
//         }
//         onPress={() =>
//           toggleSubject("interview")
//         }
//       />
//     </View>
//   );
// }

// /* =========================================================
//    ROADMAP
// ========================================================= */

// function RoadmapSection({
//   analysis,
// }: {
//   analysis: Analysis;
// }) {
//   const roadmap =
//     analysis.eight_week_roadmap;

//   const [openWeek, setOpenWeek] =
//     useState<number | null>(null);

//   if (!roadmap || roadmap.length === 0) {
//     return (
//       <Text style={styles.emptyText}>
//         8-week roadmap is not available.
//       </Text>
//     );
//   }

//   const toggleWeek = (
//     weekNumber: number
//   ) => {
//     setOpenWeek((current) =>
//       current === weekNumber
//         ? null
//         : weekNumber
//     );
//   };

//   return (
//     <View>
//       <Text style={styles.roadmapIntro}>
//         Your 8-week plan is personalized
//         according to topic difficulty,
//         available study time, models, and
//         practice requirements.
//       </Text>

//       {roadmap.map((week, index) => {
//         const weekNumber =
//           week.week ?? index + 1;

//         const isOpen =
//           openWeek === weekNumber;

//         return (
//           <View
//             key={`week-${weekNumber}-${index}`}
//             style={styles.weekAccordion}
//           >
//             <TouchableOpacity
//               style={[
//                 styles.weekHeader,
//                 isOpen &&
//                   styles.weekHeaderOpen,
//               ]}
//               onPress={() =>
//                 toggleWeek(weekNumber)
//               }
//               activeOpacity={0.8}
//             >
//               <View
//                 style={
//                   styles.weekHeaderLeft
//                 }
//               >
//                 <Text
//                   style={styles.weekIcon}
//                 >
//                   📅
//                 </Text>

//                 <Text
//                   style={styles.weekTitle}
//                 >
//                   Week {weekNumber}
//                 </Text>
//               </View>

//               <Text
//                 style={styles.weekArrow}
//               >
//                 {isOpen ? "⌃" : "›"}
//               </Text>
//             </TouchableOpacity>

//             {isOpen ? (
//               <View
//                 style={styles.weekContent}
//               >
//                 {week.days?.map(
//                   (day, dayIndex) => (
//                     <DayBlock
//                       key={`day-${day.day}-${dayIndex}`}
//                       day={day}
//                     />
//                   )
//                 )}
//               </View>
//             ) : null}
//           </View>
//         );
//       })}
//     </View>
//   );
// }

// /* =========================================================
//    DAILY PRACTICE
// ========================================================= */

// function DailyPracticeSection({
//   analysis,
// }: {
//   analysis: Analysis;
// }) {
//   const allocation =
//     analysis.daily_time_allocation;

//   const practice =
//     analysis.daily_practice_system;

//   return (
//     <View>
//       <Text style={styles.subheading}>
//         Daily Time Allocation
//       </Text>

//       {allocation ? (
//         <View style={styles.timeCard}>
//           <Text style={styles.timeRow}>
//             💻 Technical —{" "}
//             {allocation.technical_minutes ??
//               0}{" "}
//             min
//           </Text>

//           <Text style={styles.timeRow}>
//             🔢 Aptitude —{" "}
//             {allocation.aptitude_minutes ??
//               0}{" "}
//             min
//           </Text>

//           <Text style={styles.timeRow}>
//             🧠 Reasoning —{" "}
//             {allocation.reasoning_minutes ??
//               0}{" "}
//             min
//           </Text>

//           <Text style={styles.timeRow}>
//             🗣️ English —{" "}
//             {allocation.english_minutes ??
//               0}{" "}
//             min
//           </Text>

//           <Text style={styles.timeRow}>
//             🎤 Interview —{" "}
//             {allocation.interview_minutes ??
//               0}{" "}
//             min
//           </Text>

//           <View
//             style={styles.totalTimeBox}
//           >
//             <Text
//               style={styles.totalTimeText}
//             >
//               Total —{" "}
//               {allocation.total_minutes ??
//                 0}{" "}
//               minutes/day
//             </Text>
//           </View>
//         </View>
//       ) : (
//         <Text style={styles.emptyText}>
//           Daily time allocation is not
//           available.
//         </Text>
//       )}

//       {practice ? (
//         <>
//           <Text style={styles.subheading}>
//             Daily Practice System
//           </Text>

//           <Text
//             style={styles.practiceHeading}
//           >
//             💻 Technical
//           </Text>

//           <BulletList
//             items={practice.technical}
//           />

//           <Text
//             style={styles.practiceHeading}
//           >
//             🔢 Aptitude
//           </Text>

//           <BulletList
//             items={practice.aptitude}
//           />

//           <Text
//             style={styles.practiceHeading}
//           >
//             🧠 Reasoning
//           </Text>

//           <BulletList
//             items={practice.reasoning}
//           />

//           <Text
//             style={styles.practiceHeading}
//           >
//             🗣️ English
//           </Text>

//           <BulletList
//             items={practice.english}
//           />

//           <Text
//             style={styles.practiceHeading}
//           >
//             🎤 Interview
//           </Text>

//           <BulletList
//             items={practice.interview}
//           />
//         </>
//       ) : null}
//     </View>
//   );
// }

// /* =========================================================
//    INTERVIEW
// ========================================================= */

// function InterviewSection({
//   analysis,
// }: {
//   analysis: Analysis;
// }) {
//   const interview =
//     analysis.interview_preparation;

//   if (!interview) {
//     return (
//       <Text style={styles.emptyText}>
//         Interview preparation is not
//         available.
//       </Text>
//     );
//   }

//   return (
//     <View>
//       <Text style={styles.subheading}>
//         Technical Questions
//       </Text>

//       <BulletList
//         items={
//           interview.technical_questions
//         }
//       />

//       <Text style={styles.subheading}>
//         HR Questions
//       </Text>

//       <BulletList
//         items={interview.hr_questions}
//       />

//       <Text style={styles.subheading}>
//         Project Questions
//       </Text>

//       <BulletList
//         items={interview.project_questions}
//       />

//       <Text style={styles.subheading}>
//         Communication Practice
//       </Text>

//       <BulletList
//         items={
//           interview.communication_practice
//         }
//       />
//     </View>
//   );
// }

// /* =========================================================
//    MAIN JD ANALYZER SCREEN
// ========================================================= */

// export default function JDAnalyzerScreen() {
//   const [
//     jobDescription,
//     setJobDescription,
//   ] = useState("");

//   const [
//     analysis,
//     setAnalysis,
//   ] = useState<Analysis | null>(null);

//   const [
//     openSection,
//     setOpenSection,
//   ] = useState<SectionId | null>(
//     null
//   );

//   const [loading, setLoading] =
//     useState(false);

//   const [
//     restoring,
//     setRestoring,
//   ] = useState(true);

//   const [
//     errorMessage,
//     setErrorMessage,
//   ] = useState("");

//   /* =======================================================
//      LOAD SAVED DATA
     
//      IMPORTANT:
//      First load from PostgreSQL through backend.
//      If backend data is unavailable, use local storage
//      as a fallback.
//   ======================================================= */

//   useEffect(() => {
//     let mounted = true;

//     const restoreSavedData = async () => {
//       try {
//         setRestoring(true);

//         const token =
//           await getStorage(
//             ACCESS_TOKEN_KEY
//           );

//         /*
//          * ---------------------------------------------------
//          * 1. TRY BACKEND FIRST
//          * ---------------------------------------------------
//          */

//         if (token) {
//           try {
//             const response =
//               await fetch(
//                 `${API_URL}/api/v1/jd/latest`,
//                 {
//                   method: "GET",
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                   },
//                 }
//               );

//             const data =
//               await response.json();

//             if (!mounted) {
//               return;
//             }

//             if (response.ok) {
//               /*
//                * Saved JD from PostgreSQL
//                */
//               if (
//                 typeof data.job_description ===
//                   "string" &&
//                 data.job_description.trim() !== ""
//               ) {
//                 setJobDescription(
//                   data.job_description
//                 );

//                 /*
//                  * Keep a local fallback copy.
//                  */
//                 await saveStorage(
//                   JD_TEXT_KEY,
//                   data.job_description
//                 );
//               }

//               /*
//                * Saved AI analysis from PostgreSQL
//                */
//               if (
//                 data.analysis &&
//                 typeof data.analysis ===
//                   "object"
//               ) {
//                 setAnalysis(
//                   data.analysis as Analysis
//                 );

//                 /*
//                  * Keep a local fallback copy.
//                  */
//                 await saveStorage(
//                   JD_ANALYSIS_KEY,
//                   JSON.stringify(
//                     data.analysis
//                   )
//                 );

//                 setOpenSection("job");
//               }

//               /*
//                * Backend request succeeded.
//                * No need to use local data.
//                */
//               return;
//             }

//             console.log(
//               "Backend JD load failed:",
//               data.detail
//             );
//           } catch (backendError) {
//             console.log(
//               "Could not load JD from backend:",
//               backendError
//             );
//           }
//         }

//         /*
//          * ---------------------------------------------------
//          * 2. LOCAL STORAGE FALLBACK
//          * ---------------------------------------------------
//          */

//         const savedJD =
//           await getStorage(
//             JD_TEXT_KEY
//           );

//         const savedAnalysis =
//           await getStorage(
//             JD_ANALYSIS_KEY
//           );

//         if (!mounted) {
//           return;
//         }

//         if (
//           savedJD !== null &&
//           savedJD.trim() !== ""
//         ) {
//           setJobDescription(savedJD);
//         }

//         if (
//           savedAnalysis !== null &&
//           savedAnalysis.trim() !== ""
//         ) {
//           try {
//             const parsedAnalysis =
//               JSON.parse(
//                 savedAnalysis
//               );

//             if (
//               parsedAnalysis &&
//               typeof parsedAnalysis ===
//                 "object"
//             ) {
//               setAnalysis(
//                 parsedAnalysis as Analysis
//               );

//               setOpenSection("job");
//             }
//           } catch (error) {
//             console.log(
//               "Saved JD analysis could not be restored:",
//               error
//             );
//           }
//         }
//       } catch (error) {
//         console.log(
//           "Could not restore saved JD:",
//           error
//         );
//       } finally {
//         if (mounted) {
//           setRestoring(false);
//         }
//       }
//     };

//     restoreSavedData();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   /* =======================================================
//      ANALYZE JD
//   ======================================================= */

//   const analyzeJD = async () => {
//     setErrorMessage("");

//     if (!jobDescription.trim()) {
//       setErrorMessage(
//         "Please enter a job description."
//       );
//       return;
//     }

//     try {
//       setLoading(true);

//       /*
//        * Get login token.
//        */
//       const token =
//         await getStorage(
//           ACCESS_TOKEN_KEY
//         );

//       if (!token) {
//         setErrorMessage(
//           "Please login again."
//         );
//         return;
//       }

//       /*
//        * Send JD to backend.
//        *
//        * Backend will:
//        * 1. Send JD to Gemini
//        * 2. Generate analysis
//        * 3. Save JD + analysis in PostgreSQL
//        * 4. Return the analysis
//        */

//       const response =
//         await fetch(
//           `${API_URL}/api/v1/jd/analyze`,
//           {
//             method: "POST",

//             headers: {
//               "Content-Type":
//                 "application/json",

//               Authorization: `Bearer ${token}`,
//             },

//             body: JSON.stringify({
//               job_description:
//                 jobDescription.trim(),
//             }),
//           }
//         );

//       const data =
//         await response.json();

//       if (!response.ok) {
//         setErrorMessage(
//           typeof data.detail ===
//             "string"
//             ? data.detail
//             : "Failed to analyze job description."
//         );

//         return;
//       }

//       /*
//        * Make sure backend returned analysis.
//        */

//       if (
//         !data.analysis ||
//         typeof data.analysis !==
//           "object"
//       ) {
//         setErrorMessage(
//           "AI returned an unexpected response format."
//         );

//         return;
//       }

//       /*
//        * IMPORTANT:
//        *
//        * Do NOT save the analysis as the main database
//        * storage here.
//        *
//        * Backend already saved it into PostgreSQL.
//        */

//       const analysisString =
//         JSON.stringify(
//           data.analysis
//         );

//       /*
//        * Keep local fallback copy also.
//        * This is NOT replacing PostgreSQL.
//        */

//       await saveStorage(
//         JD_TEXT_KEY,
//         jobDescription.trim()
//       );

//       await saveStorage(
//         JD_ANALYSIS_KEY,
//         analysisString
//       );

//       /*
//        * Update screen.
//        */

//       setAnalysis(
//         data.analysis as Analysis
//       );

//       setOpenSection("job");
//     } catch (error) {
//       console.error(
//         "JD Analyzer Error:",
//         error
//       );

//       setErrorMessage(
//         "Could not connect to the backend. Please make sure the backend is running."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =======================================================
//      MAIN SECTION TOGGLE
//   ======================================================= */

//   const toggleSection = (
//     id: SectionId
//   ) => {
//     if (openSection === id) {
//       setOpenSection(null);
//     } else {
//       setOpenSection(id);
//     }
//   };

//   /* =======================================================
//      SECTION CONTENT
//   ======================================================= */

//   const renderSectionContent = (
//     id: SectionId
//   ) => {
//     if (!analysis) {
//       return null;
//     }

//     switch (id) {
//       case "job":
//         return (
//           <JobOverview
//             analysis={analysis}
//           />
//         );

//       case "skills":
//         return (
//           <SkillsSection
//             analysis={analysis}
//           />
//         );

//       case "syllabus":
//         return (
//           <SyllabusSection
//             analysis={analysis}
//           />
//         );

//       case "roadmap":
//         return (
//           <RoadmapSection
//             analysis={analysis}
//           />
//         );

//       case "daily":
//         return (
//           <DailyPracticeSection
//             analysis={analysis}
//           />
//         );

//       case "interview":
//         return (
//           <InterviewSection
//             analysis={analysis}
//           />
//         );

//       default:
//         return null;
//     }
//   };

//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={
//         styles.content
//       }
//       showsVerticalScrollIndicator={
//         false
//       }
//     >
//       {/* BACK */}

//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={() => router.back()}
//       >
//         <Text style={styles.backText}>
//           ← Back
//         </Text>
//       </TouchableOpacity>

//       {/* TITLE */}

//       <Text style={styles.title}>
//         💼 Job Description Analyzer
//       </Text>

//       <Text style={styles.subtitle}>
//         Paste a job description and let AI
//         identify the skills and preparation
//         needed.
//       </Text>

//       {/* RESTORING */}

//       {restoring ? (
//         <View
//           style={styles.restoreBox}
//         >
//           <ActivityIndicator
//             size="small"
//             color="#2563EB"
//           />

//           <Text
//             style={styles.restoreText}
//           >
//             Loading your saved job
//             description...
//           </Text>
//         </View>
//       ) : null}

//       {/* LABEL */}

//       <Text style={styles.label}>
//         Job Description
//       </Text>

//       <Text style={styles.helperText}>
//         Include the complete job description
//         for better AI analysis.
//       </Text>

//       {/* ACTUAL INPUT */}

//       <View
//         style={styles.actualInputContainer}
//       >
//         <JDTextInput
//           value={jobDescription}
//           onChangeText={(text) => {
//             setJobDescription(text);

//             /*
//              * Local fallback only.
//              *
//              * PostgreSQL save happens when
//              * Analyze Job Description succeeds.
//              */

//             saveStorage(
//               JD_TEXT_KEY,
//               text
//             ).catch((error) => {
//               console.log(
//                 "Could not save JD locally:",
//                 error
//               );
//             });
//           }}
//         />
//       </View>

//       {/* ERROR */}

//       {errorMessage ? (
//         <Text style={styles.errorText}>
//           {errorMessage}
//         </Text>
//       ) : null}

//       {/* ANALYZE BUTTON */}

//       <TouchableOpacity
//         style={[
//           styles.button,
//           loading &&
//             styles.buttonDisabled,
//         ]}
//         onPress={analyzeJD}
//         disabled={loading}
//         activeOpacity={0.8}
//       >
//         {loading ? (
//           <View
//             style={styles.loadingRow}
//           >
//             <ActivityIndicator
//               color="#FFFFFF"
//             />

//             <Text
//               style={styles.buttonText}
//             >
//               Analyzing...
//             </Text>
//           </View>
//         ) : (
//           <Text
//             style={styles.buttonText}
//           >
//             🤖 Analyze Job Description
//           </Text>
//         )}
//       </TouchableOpacity>

//       {/* RESULTS */}

//       {analysis ? (
//         <View
//           style={styles.resultsContainer}
//         >
//           <Text
//             style={styles.analysisTitle}
//           >
//             🤖 AI Career Analysis
//           </Text>

//           <Text
//             style={styles.analysisSubtitle}
//           >
//             Tap any section to view the
//             details.
//           </Text>

//           {/* MAIN ACCORDIONS */}

//           {sections.map((section) => {
//             const isOpen =
//               openSection ===
//               section.id;

//             return (
//               <View
//                 key={section.id}
//                 style={
//                   styles.sectionWrapper
//                 }
//               >
//                 <TouchableOpacity
//                   style={[
//                     styles.sectionHeader,
//                     isOpen &&
//                       styles.sectionHeaderOpen,
//                   ]}
//                   onPress={() =>
//                     toggleSection(
//                       section.id
//                     )
//                   }
//                   activeOpacity={0.8}
//                 >
//                   <View
//                     style={
//                       styles.sectionLeft
//                     }
//                   >
//                     <Text
//                       style={
//                         styles.sectionIcon
//                       }
//                     >
//                       {section.icon}
//                     </Text>

//                     <Text
//                       style={
//                         styles.sectionTitle
//                       }
//                     >
//                       {section.title}
//                     </Text>
//                   </View>

//                   <Text
//                     style={styles.arrow}
//                   >
//                     {isOpen
//                       ? "⌃"
//                       : "›"}
//                   </Text>
//                 </TouchableOpacity>

//                 {isOpen ? (
//                   <View
//                     style={
//                       styles.sectionContent
//                     }
//                   >
//                     {renderSectionContent(
//                       section.id
//                     )}
//                   </View>
//                 ) : null}
//               </View>
//             );
//           })}
//         </View>
//       ) : null}
//     </ScrollView>
//   );
// }

// /* =========================================================
//    TEXT INPUT
// ========================================================= */

// function JDTextInput({
//   value,
//   onChangeText,
// }: {
//   value: string;
//   onChangeText: (
//     text: string
//   ) => void;
// }) {
//   return (
//     <TextInput
//       style={styles.textArea}
//       placeholder="Paste the complete job description here..."
//       placeholderTextColor="#94A3B8"
//       multiline
//       textAlignVertical="top"
//       value={value}
//       onChangeText={onChangeText}
//     />
//   );
// }

// /* =========================================================
//    STYLES
// ========================================================= */

// const styles =
//   StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: "#F8FAFC",
//     },

//     content: {
//       padding: 20,
//       paddingBottom: 50,
//     },

//     backButton: {
//       marginBottom: 16,
//     },

//     backText: {
//       fontSize: 16,
//       fontWeight: "600",
//       color: "#2563EB",
//     },

//     title: {
//       fontSize: 26,
//       fontWeight: "800",
//       color: "#0F172A",
//       marginBottom: 8,
//     },

//     subtitle: {
//       fontSize: 15,
//       lineHeight: 22,
//       color: "#64748B",
//       marginBottom: 24,
//     },

//     restoreBox: {
//       flexDirection: "row",
//       alignItems: "center",
//       backgroundColor: "#EFF6FF",
//       borderRadius: 10,
//       paddingHorizontal: 12,
//       paddingVertical: 10,
//       marginBottom: 16,
//       gap: 9,
//     },

//     restoreText: {
//       flex: 1,
//       fontSize: 13,
//       color: "#2563EB",
//       fontWeight: "600",
//     },

//     label: {
//       fontSize: 16,
//       fontWeight: "700",
//       color: "#0F172A",
//       marginBottom: 5,
//     },

//     helperText: {
//       fontSize: 13,
//       color: "#64748B",
//       marginBottom: 10,
//     },

//     actualInputContainer: {
//       marginBottom: 14,
//     },

//     textArea: {
//       minHeight: 190,
//       borderWidth: 1,
//       borderColor: "#CBD5E1",
//       borderRadius: 14,
//       backgroundColor: "#FFFFFF",
//       padding: 15,
//       fontSize: 15,
//       color: "#0F172A",
//       textAlignVertical: "top",
//     },

//     errorText: {
//       color: "#DC2626",
//       fontSize: 14,
//       lineHeight: 20,
//       marginBottom: 12,
//     },

//     button: {
//       backgroundColor: "#2563EB",
//       borderRadius: 14,
//       paddingVertical: 15,
//       alignItems: "center",
//       marginBottom: 28,
//     },

//     buttonDisabled: {
//       opacity: 0.7,
//     },

//     buttonText: {
//       color: "#FFFFFF",
//       fontSize: 16,
//       fontWeight: "700",
//     },

//     loadingRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 10,
//     },

//     resultsContainer: {
//       marginTop: 4,
//     },

//     analysisTitle: {
//       fontSize: 22,
//       fontWeight: "800",
//       color: "#0F172A",
//       marginBottom: 5,
//     },

//     analysisSubtitle: {
//       fontSize: 14,
//       color: "#64748B",
//       marginBottom: 16,
//     },

//     /* =====================================================
//        MAIN SECTION ACCORDIONS
//     ===================================================== */

//     sectionWrapper: {
//       marginBottom: 12,
//       borderRadius: 14,
//       overflow: "hidden",
//       backgroundColor: "#FFFFFF",
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//     },

//     sectionHeader: {
//       minHeight: 64,
//       paddingHorizontal: 16,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//     },

//     sectionHeaderOpen: {
//       backgroundColor: "#EFF6FF",
//     },

//     sectionLeft: {
//       flexDirection: "row",
//       alignItems: "center",
//       flex: 1,
//     },

//     sectionIcon: {
//       fontSize: 22,
//       marginRight: 12,
//     },

//     sectionTitle: {
//       fontSize: 16,
//       fontWeight: "700",
//       color: "#0F172A",
//       flex: 1,
//     },

//     arrow: {
//       fontSize: 25,
//       color: "#64748B",
//       marginLeft: 10,
//     },

//     sectionContent: {
//       paddingHorizontal: 16,
//       paddingTop: 16,
//       paddingBottom: 20,
//       backgroundColor: "#FFFFFF",
//       borderTopWidth: 1,
//       borderTopColor: "#E2E8F0",
//     },

//     /* =====================================================
//        COMMON
//     ===================================================== */

//     subheading: {
//       fontSize: 17,
//       fontWeight: "800",
//       color: "#0F172A",
//       marginTop: 18,
//       marginBottom: 10,
//     },

//     smallHeading: {
//       fontSize: 14,
//       fontWeight: "700",
//       color: "#1E293B",
//       marginBottom: 7,
//     },

//     /* =====================================================
//        COMPLETE SYLLABUS
//     ===================================================== */

//     syllabusIntro: {
//       fontSize: 14,
//       lineHeight: 21,
//       color: "#475569",
//       backgroundColor: "#EFF6FF",
//       borderRadius: 10,
//       padding: 12,
//       marginBottom: 14,
//     },

//     syllabusSubjectWrapper: {
//       marginBottom: 12,
//       borderRadius: 14,
//       overflow: "hidden",
//       backgroundColor: "#FFFFFF",
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//     },

//     syllabusSubjectHeader: {
//       minHeight: 58,
//       paddingHorizontal: 15,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       backgroundColor: "#FFFFFF",
//     },

//     syllabusSubjectHeaderOpen: {
//       backgroundColor: "#EFF6FF",
//     },

//     syllabusSubjectTitle: {
//       flex: 1,
//       fontSize: 17,
//       fontWeight: "800",
//       color: "#0F172A",
//     },

//     syllabusSubjectArrow: {
//       fontSize: 25,
//       color: "#64748B",
//       marginLeft: 10,
//     },

//     syllabusSubjectContent: {
//       padding: 10,
//       backgroundColor: "#FFFFFF",
//       borderTopWidth: 1,
//       borderTopColor: "#E2E8F0",
//     },

//     topicCard: {
//       backgroundColor: "#F8FAFC",
//       borderRadius: 12,
//       padding: 13,
//       marginBottom: 10,
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//     },

//     topicTitle: {
//       fontSize: 15,
//       fontWeight: "700",
//       color: "#1E293B",
//       lineHeight: 21,
//     },

//     modelsContainer: {
//       marginTop: 9,
//     },

//     modelRow: {
//       flexDirection: "row",
//       alignItems: "flex-start",
//       marginBottom: 7,
//     },

//     modelNumber: {
//       width: 22,
//       height: 22,
//       borderRadius: 11,
//       backgroundColor: "#E2E8F0",
//       textAlign: "center",
//       lineHeight: 22,
//       fontSize: 12,
//       fontWeight: "700",
//       color: "#334155",
//       marginRight: 8,
//     },

//     modelText: {
//       flex: 1,
//       fontSize: 14,
//       lineHeight: 20,
//       color: "#475569",
//     },

//     /* =====================================================
//        BULLETS
//     ===================================================== */

//     bulletList: {
//       marginBottom: 6,
//     },

//     bulletRow: {
//       flexDirection: "row",
//       alignItems: "flex-start",
//       marginBottom: 8,
//     },

//     bullet: {
//       fontSize: 17,
//       lineHeight: 21,
//       color: "#2563EB",
//       marginRight: 8,
//     },

//     bulletText: {
//       flex: 1,
//       fontSize: 14,
//       lineHeight: 21,
//       color: "#334155",
//     },

//     emptyText: {
//       fontSize: 14,
//       lineHeight: 21,
//       color: "#64748B",
//     },

//     /* =====================================================
//        JOB OVERVIEW
//     ===================================================== */

//     infoGrid: {
//       marginBottom: 5,
//     },

//     infoItem: {
//       backgroundColor: "#F8FAFC",
//       borderRadius: 10,
//       padding: 12,
//       marginBottom: 9,
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//     },

//     infoLabel: {
//       fontSize: 12,
//       fontWeight: "700",
//       color: "#64748B",
//       marginBottom: 4,
//     },

//     infoValue: {
//       fontSize: 15,
//       fontWeight: "600",
//       color: "#0F172A",
//       lineHeight: 21,
//     },

//     /* =====================================================
//        SKILLS
//     ===================================================== */

//     skillCard: {
//       backgroundColor: "#F8FAFC",
//       borderRadius: 12,
//       padding: 14,
//       marginBottom: 10,
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//     },

//     skillHeader: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       gap: 10,
//     },

//     skillName: {
//       flex: 1,
//       fontSize: 16,
//       fontWeight: "800",
//       color: "#0F172A",
//     },

//     priorityBadge: {
//       borderRadius: 8,
//       paddingHorizontal: 9,
//       paddingVertical: 5,
//       backgroundColor: "#E0E7FF",
//     },

//     priorityText: {
//       fontSize: 11,
//       fontWeight: "800",
//       color: "#3730A3",
//     },

//     skillReason: {
//       marginTop: 8,
//       fontSize: 14,
//       lineHeight: 21,
//       color: "#475569",
//     },

//     /* =====================================================
//        ROADMAP
//     ===================================================== */

//     roadmapIntro: {
//       fontSize: 14,
//       lineHeight: 21,
//       color: "#475569",
//       backgroundColor: "#EFF6FF",
//       borderRadius: 10,
//       padding: 12,
//       marginBottom: 16,
//     },

//     weekAccordion: {
//       marginBottom: 12,
//       borderRadius: 14,
//       overflow: "hidden",
//       backgroundColor: "#FFFFFF",
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//     },

//     weekHeader: {
//       minHeight: 60,
//       paddingHorizontal: 15,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       backgroundColor: "#FFFFFF",
//     },

//     weekHeaderOpen: {
//       backgroundColor: "#EFF6FF",
//     },

//     weekHeaderLeft: {
//       flexDirection: "row",
//       alignItems: "center",
//       flex: 1,
//     },

//     weekIcon: {
//       fontSize: 20,
//       marginRight: 10,
//     },

//     weekTitle: {
//       fontSize: 18,
//       fontWeight: "800",
//       color: "#0F172A",
//       flex: 1,
//     },

//     weekArrow: {
//       fontSize: 25,
//       color: "#64748B",
//       marginLeft: 10,
//     },

//     weekContent: {
//       padding: 10,
//       backgroundColor: "#FFFFFF",
//       borderTopWidth: 1,
//       borderTopColor: "#E2E8F0",
//     },

//     /* =====================================================
//        DAY CARD
//     ===================================================== */

//     dayCard: {
//       backgroundColor: "#FFFFFF",
//       borderRadius: 12,
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//       padding: 13,
//       marginBottom: 10,
//     },

//     dayTitle: {
//       fontSize: 17,
//       fontWeight: "800",
//       color: "#2563EB",
//       marginBottom: 12,
//     },

//     dailySubject: {
//       borderTopWidth: 1,
//       borderTopColor: "#E2E8F0",
//       paddingTop: 11,
//       marginTop: 10,
//     },

//     dailySubjectTitle: {
//       fontSize: 15,
//       fontWeight: "800",
//       color: "#0F172A",
//       marginBottom: 5,
//     },

//     dailyTopic: {
//       fontSize: 14,
//       fontWeight: "700",
//       lineHeight: 20,
//       color: "#334155",
//       marginBottom: 5,
//     },

//     taskText: {
//       fontSize: 14,
//       lineHeight: 21,
//       color: "#475569",
//       marginBottom: 5,
//     },

//     practiceInfo: {
//       fontSize: 13,
//       lineHeight: 20,
//       color: "#64748B",
//       marginTop: 3,
//     },

//     /* =====================================================
//        DAILY PRACTICE
//     ===================================================== */

//     timeCard: {
//       backgroundColor: "#F8FAFC",
//       borderRadius: 12,
//       padding: 14,
//       borderWidth: 1,
//       borderColor: "#E2E8F0",
//       marginBottom: 8,
//     },

//     timeRow: {
//       fontSize: 14,
//       lineHeight: 24,
//       color: "#334155",
//       fontWeight: "600",
//     },

//     totalTimeBox: {
//       marginTop: 10,
//       paddingTop: 10,
//       borderTopWidth: 1,
//       borderTopColor: "#CBD5E1",
//     },

//     totalTimeText: {
//       fontSize: 15,
//       fontWeight: "800",
//       color: "#0F172A",
//     },

//     practiceHeading: {
//       fontSize: 15,
//       fontWeight: "800",
//       color: "#1E293B",
//       marginTop: 10,
//       marginBottom: 7,
//     },
//   });










import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8001";

/* =========================================================
   STORAGE KEYS
========================================================= */

const JD_TEXT_KEY = "jd_job_description";
const JD_ANALYSIS_KEY = "jd_analysis";
const ACCESS_TOKEN_KEY = "access_token";

/* =========================================================
   STORAGE HELPERS
========================================================= */

async function saveStorage(
  key: string,
  value: string
): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, value);
      return;
    }

    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;

    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log("Could not save storage:", error);
  }
}

async function getStorage(
  key: string
): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return window.localStorage.getItem(key);
    }

    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;

    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.log("Could not read storage:", error);
    return null;
  }
}

/* =========================================================
   TYPES
========================================================= */

type SectionId =
  | "job"
  | "skills"
  | "syllabus"
  | "roadmap"
  | "daily"
  | "interview";

/* ---------------------------------------------------------
   GENERAL TOPIC
--------------------------------------------------------- */

type SyllabusTopic = {
  topic?: string;
  models?: string[];
};

/* ---------------------------------------------------------
   TECHNICAL COURSE
--------------------------------------------------------- */

type TechnicalCourse = {
  course?: string;
  topics?: SyllabusTopic[];
};

/* ---------------------------------------------------------
   ROADMAP SUBJECT
--------------------------------------------------------- */

type RoadmapSubject = {
  course?: string;
  topic?: string;
  models?: string[];
  minutes?: number;
  practice_questions?: number;
  practice_programs?: number;
};

/* ---------------------------------------------------------
   ANALYSIS
--------------------------------------------------------- */

type Analysis = {
  job_overview?: {
    job_title?: string;
    company?: string;
    location?: string;
    job_type?: string;
    eligibility?: string[];
    responsibilities?: string[];
    interview_process?: string[];
  };

  skills_to_prepare?: {
    skill?: string;
    priority?: string;
    reason?: string;
  }[];

  complete_syllabus?: {
    technical?: TechnicalCourse[];

    aptitude?: SyllabusTopic[];

    data_interpretation?: SyllabusTopic[];

    reasoning?: SyllabusTopic[];

    english?: SyllabusTopic[];

    interview?: SyllabusTopic[];
  };

  daily_time_allocation?: {
    technical_minutes?: number;
    aptitude_minutes?: number;
    data_interpretation_minutes?: number;
    reasoning_minutes?: number;
    english_minutes?: number;
    interview_minutes?: number;
    total_minutes?: number;
  };

  eight_week_roadmap?: {
    week?: number;

    days?: {
      day?: number;

      technical?: RoadmapSubject;

      aptitude?: RoadmapSubject;

      data_interpretation?: RoadmapSubject;

      reasoning?: RoadmapSubject;

      english?: {
        topic?: string;
        task?: string;
        minutes?: number;
      };

      interview?: {
        topic?: string;
        task?: string;
        minutes?: number;
      };
    }[];
  }[];

  daily_practice_system?: {
    technical?: string[];
    aptitude?: string[];
    data_interpretation?: string[];
    reasoning?: string[];
    english?: string[];
    interview?: string[];
  };

  interview_preparation?: {
    technical_questions?: string[];
    hr_questions?: string[];
    project_questions?: string[];
    communication_practice?: string[];
  };
};

type Section = {
  id: SectionId;
  title: string;
  icon: string;
};

const sections: Section[] = [
  {
    id: "job",
    title: "Job Overview",
    icon: "💼",
  },
  {
    id: "skills",
    title: "Skills to Prepare",
    icon: "🎯",
  },
  {
    id: "syllabus",
    title: "Complete Syllabus",
    icon: "📚",
  },
  {
    id: "roadmap",
    title: "8-Week Roadmap",
    icon: "📅",
  },
  {
    id: "daily",
    title: "Daily Practice",
    icon: "⏱️",
  },
  {
    id: "interview",
    title: "Interview Preparation",
    icon: "🎤",
  },
];

/* =========================================================
   COMMON BULLET LIST
========================================================= */

function BulletList({
  items,
  emptyText = "No details available.",
}: {
  items?: string[];
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
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View
          key={`${item}-${index}`}
          style={styles.bulletRow}
        >
          <Text style={styles.bullet}>
            •
          </Text>

          <Text style={styles.bulletText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* =========================================================
   MODELS LIST
========================================================= */

function ModelsList({
  models,
}: {
  models?: string[];
}) {
  if (!models || models.length === 0) {
    return null;
  }

  return (
    <View style={styles.modelsContainer}>
      <Text style={styles.smallHeading}>
        Models to Practice
      </Text>

      {models.map((model, index) => (
        <View
          key={`${model}-${index}`}
          style={styles.modelRow}
        >
          <Text style={styles.modelNumber}>
            {index + 1}
          </Text>

          <Text style={styles.modelText}>
            {model}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* =========================================================
   TOPIC LIST
========================================================= */

function TopicList({
  data,
}: {
  data?: SyllabusTopic[];
}) {
  if (!data || data.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No topics available.
      </Text>
    );
  }

  return (
    <View>
      {data.map((item, index) => (
        <View
          key={`${item.topic}-${index}`}
          style={styles.topicCard}
        >
          <Text style={styles.topicTitle}>
            {index + 1}.{" "}
            {item.topic || "Topic"}
          </Text>

          <ModelsList
            models={item.models}
          />
        </View>
      ))}
    </View>
  );
}

/* =========================================================
   TECHNICAL COURSE
========================================================= */

function TechnicalCourseCard({
  course,
  index,
}: {
  course: TechnicalCourse;
  index: number;
}) {
  const [open, setOpen] =
    useState(false);

  return (
    <View
      style={styles.courseCard}
    >
      <TouchableOpacity
        style={[
          styles.courseHeader,
          open &&
            styles.courseHeaderOpen,
        ]}
        onPress={() =>
          setOpen(!open)
        }
        activeOpacity={0.8}
      >
        <View
          style={
            styles.courseHeaderLeft
          }
        >
          <View
            style={styles.courseNumber}
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
            style={styles.courseTitle}
          >
            {course.course ||
              "Technical Course"}
          </Text>
        </View>

        <Text
          style={styles.courseArrow}
        >
          {open ? "⌃" : "›"}
        </Text>
      </TouchableOpacity>

      {open ? (
        <View
          style={
            styles.courseContent
          }
        >
          {course.topics &&
          course.topics.length > 0 ? (
            course.topics.map(
              (item, topicIndex) => (
                <View
                  key={`${item.topic}-${topicIndex}`}
                  style={
                    styles.courseTopicCard
                  }
                >
                  <Text
                    style={
                      styles.courseTopicTitle
                    }
                  >
                    {topicIndex + 1}.{" "}
                    {item.topic ||
                      "Topic"}
                  </Text>

                  <ModelsList
                    models={
                      item.models
                    }
                  />
                </View>
              )
            )
          ) : (
            <Text
              style={
                styles.emptyText
              }
            >
              No topics available for
              this course.
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   SYLLABUS SUBJECT ACCORDION
========================================================= */

function SyllabusSubject({
  title,
  data,
  isOpen,
  onPress,
}: {
  title: string;

  data?: SyllabusTopic[];

  isOpen: boolean;

  onPress: () => void;
}) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View
      style={
        styles.syllabusSubjectWrapper
      }
    >
      <TouchableOpacity
        style={[
          styles.syllabusSubjectHeader,
          isOpen &&
            styles.syllabusSubjectHeaderOpen,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text
          style={
            styles.syllabusSubjectTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.syllabusSubjectArrow
          }
        >
          {isOpen ? "⌃" : "›"}
        </Text>
      </TouchableOpacity>

      {isOpen ? (
        <View
          style={
            styles.syllabusSubjectContent
          }
        >
          <TopicList
            data={data}
          />
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   TECHNICAL SYLLABUS SECTION
========================================================= */

function TechnicalSyllabus({
  data,
}: {
  data?: TechnicalCourse[];
}) {
  if (!data || data.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No technical courses available.
      </Text>
    );
  }

  return (
    <View>
      <Text style={styles.syllabusHint}>
        Technical preparation is organized
        as Course → Topics → Models.
      </Text>

      {data.map((course, index) => (
        <TechnicalCourseCard
          key={`${course.course}-${index}`}
          course={course}
          index={index}
        />
      ))}
    </View>
  );
}

/* =========================================================
   DAY BLOCK
========================================================= */

function DayBlock({
  day,
}: {
  day: NonNullable<
    NonNullable<
      Analysis["eight_week_roadmap"]
    >[number]["days"]
  >[number];
}) {
  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayTitle}>
        Day {day.day}
      </Text>

      {/* TECHNICAL */}

      {day.technical ? (
        <View
          style={styles.dailySubject}
        >
          <Text
            style={
              styles.dailySubjectTitle
            }
          >
            💻 Technical
          </Text>

          {day.technical.course ? (
            <Text
              style={
                styles.dailyCourse
              }
            >
              Course:{" "}
              {day.technical.course}
            </Text>
          ) : null}

          <Text
            style={styles.dailyTopic}
          >
            {day.technical.topic ||
              "Technical topic"}
          </Text>

          <ModelsList
            models={
              day.technical.models
            }
          />

          <Text
            style={styles.practiceInfo}
          >
            ⏱{" "}
            {day.technical.minutes ??
              0}{" "}
            minutes
          </Text>

          {(day.technical
            .practice_programs ??
            0) > 0 ? (
            <Text
              style={
                styles.practiceInfo
              }
            >
              💻 Coding practice:{" "}
              {
                day.technical
                  .practice_programs
              }{" "}
              programs
            </Text>
          ) : null}

          {(day.technical
            .practice_questions ??
            0) > 0 ? (
            <Text
              style={
                styles.practiceInfo
              }
            >
              📝 Practice:{" "}
              {
                day.technical
                  .practice_questions
              }{" "}
              questions
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* APTITUDE */}

      {day.aptitude ? (
        <View
          style={styles.dailySubject}
        >
          <Text
            style={
              styles.dailySubjectTitle
            }
          >
            🔢 Quantitative Aptitude
          </Text>

          <Text
            style={styles.dailyTopic}
          >
            {day.aptitude.topic ||
              "Aptitude topic"}
          </Text>

          <ModelsList
            models={
              day.aptitude.models
            }
          />

          <Text
            style={styles.practiceInfo}
          >
            ⏱{" "}
            {day.aptitude.minutes ??
              0}{" "}
            minutes
          </Text>

          {(day.aptitude
            .practice_questions ??
            0) > 0 ? (
            <Text
              style={
                styles.practiceInfo
              }
            >
              📝 Practice:{" "}
              {
                day.aptitude
                  .practice_questions
              }{" "}
              questions
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* DATA INTERPRETATION */}

      {day.data_interpretation ? (
        <View
          style={styles.dailySubject}
        >
          <Text
            style={
              styles.dailySubjectTitle
            }
          >
            📊 Data Interpretation
          </Text>

          <Text
            style={styles.dailyTopic}
          >
            {day.data_interpretation
              .topic ||
              "DI topic"}
          </Text>

          <ModelsList
            models={
              day.data_interpretation
                .models
            }
          />

          <Text
            style={styles.practiceInfo}
          >
            ⏱{" "}
            {day.data_interpretation
              .minutes ?? 0}{" "}
            minutes
          </Text>

          {(day.data_interpretation
            .practice_questions ??
            0) > 0 ? (
            <Text
              style={
                styles.practiceInfo
              }
            >
              📝 Practice:{" "}
              {
                day.data_interpretation
                  .practice_questions
              }{" "}
              questions
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* REASONING */}

      {day.reasoning ? (
        <View
          style={styles.dailySubject}
        >
          <Text
            style={
              styles.dailySubjectTitle
            }
          >
            🧠 Reasoning
          </Text>

          <Text
            style={styles.dailyTopic}
          >
            {day.reasoning.topic ||
              "Reasoning topic"}
          </Text>

          <ModelsList
            models={
              day.reasoning.models
            }
          />

          <Text
            style={styles.practiceInfo}
          >
            ⏱{" "}
            {day.reasoning.minutes ??
              0}{" "}
            minutes
          </Text>

          {(day.reasoning
            .practice_questions ??
            0) > 0 ? (
            <Text
              style={
                styles.practiceInfo
              }
            >
              📝 Practice:{" "}
              {
                day.reasoning
                  .practice_questions
              }{" "}
              questions
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* ENGLISH */}

      {day.english ? (
        <View
          style={styles.dailySubject}
        >
          <Text
            style={
              styles.dailySubjectTitle
            }
          >
            🗣️ English
          </Text>

          <Text
            style={styles.dailyTopic}
          >
            {day.english.topic ||
              "English practice"}
          </Text>

          {day.english.task ? (
            <Text
              style={styles.taskText}
            >
              {day.english.task}
            </Text>
          ) : null}

          <Text
            style={styles.practiceInfo}
          >
            ⏱{" "}
            {day.english.minutes ??
              0}{" "}
            minutes
          </Text>
        </View>
      ) : null}

      {/* INTERVIEW */}

      {day.interview ? (
        <View
          style={styles.dailySubject}
        >
          <Text
            style={
              styles.dailySubjectTitle
            }
          >
            🎤 Interview
          </Text>

          <Text
            style={styles.dailyTopic}
          >
            {day.interview.topic ||
              "Interview practice"}
          </Text>

          {day.interview.task ? (
            <Text
              style={styles.taskText}
            >
              {day.interview.task}
            </Text>
          ) : null}

          <Text
            style={styles.practiceInfo}
          >
            ⏱{" "}
            {day.interview.minutes ??
              0}{" "}
            minutes
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   JOB OVERVIEW
========================================================= */

function JobOverview({
  analysis,
}: {
  analysis: Analysis;
}) {
  const job =
    analysis.job_overview;

  if (!job) {
    return (
      <Text style={styles.emptyText}>
        No job overview available.
      </Text>
    );
  }

  return (
    <View>
      <View
        style={styles.infoGrid}
      >
        <View style={styles.infoItem}>
          <Text
            style={styles.infoLabel}
          >
            Job Title
          </Text>

          <Text
            style={styles.infoValue}
          >
            {job.job_title ||
              "Not specified"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text
            style={styles.infoLabel}
          >
            Company
          </Text>

          <Text
            style={styles.infoValue}
          >
            {job.company ||
              "Not specified"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text
            style={styles.infoLabel}
          >
            Location
          </Text>

          <Text
            style={styles.infoValue}
          >
            {job.location ||
              "Not specified"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text
            style={styles.infoLabel}
          >
            Job Type
          </Text>

          <Text
            style={styles.infoValue}
          >
            {job.job_type ||
              "Not specified"}
          </Text>
        </View>
      </View>

      <Text style={styles.subheading}>
        Eligibility
      </Text>

      <BulletList
        items={job.eligibility}
      />

      <Text style={styles.subheading}>
        Responsibilities
      </Text>

      <BulletList
        items={job.responsibilities}
      />

      <Text style={styles.subheading}>
        Interview Process
      </Text>

      <BulletList
        items={job.interview_process}
      />
    </View>
  );
}

/* =========================================================
   SKILLS
========================================================= */

function SkillsSection({
  analysis,
}: {
  analysis: Analysis;
}) {
  const skills =
    analysis.skills_to_prepare;

  if (!skills || skills.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No skill recommendations
        available.
      </Text>
    );
  }

  return (
    <View>
      {skills.map((item, index) => (
        <View
          key={`${item.skill}-${index}`}
          style={styles.skillCard}
        >
          <View
            style={styles.skillHeader}
          >
            <Text
              style={styles.skillName}
            >
              {item.skill || "Skill"}
            </Text>

            <View
              style={
                styles.priorityBadge
              }
            >
              <Text
                style={
                  styles.priorityText
                }
              >
                {item.priority ||
                  "MEDIUM"}
              </Text>
            </View>
          </View>

          {item.reason ? (
            <Text
              style={styles.skillReason}
            >
              {item.reason}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/* =========================================================
   COMPLETE SYLLABUS
========================================================= */

function SyllabusSection({
  analysis,
}: {
  analysis: Analysis;
}) {
  const syllabus =
    analysis.complete_syllabus;

  const [openSubject, setOpenSubject] =
    useState<string | null>(null);

  if (!syllabus) {
    return (
      <Text style={styles.emptyText}>
        Complete syllabus is not
        available.
      </Text>
    );
  }

  const toggleSubject = (
    subject: string
  ) => {
    setOpenSubject((current) =>
      current === subject
        ? null
        : subject
    );
  };

  return (
    <View>
      <Text
        style={styles.syllabusIntro}
      >
        Complete preparation syllabus:
        Technical courses with topics and
        models, Aptitude and Reasoning
        topics with all important models,
        Data Interpretation, English and
        Interview preparation.
      </Text>

      {/* TECHNICAL */}

      <View
        style={
          styles.syllabusSubjectWrapper
        }
      >
        <TouchableOpacity
          style={[
            styles.syllabusSubjectHeader,
            openSubject ===
              "technical" &&
              styles.syllabusSubjectHeaderOpen,
          ]}
          onPress={() =>
            toggleSubject(
              "technical"
            )
          }
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.syllabusSubjectTitle
            }
          >
            💻 Technical
          </Text>

          <Text
            style={
              styles.syllabusSubjectArrow
            }
          >
            {openSubject ===
            "technical"
              ? "⌃"
              : "›"}
          </Text>
        </TouchableOpacity>

        {openSubject ===
        "technical" ? (
          <View
            style={
              styles.syllabusSubjectContent
            }
          >
            <TechnicalSyllabus
              data={
                syllabus.technical
              }
            />
          </View>
        ) : null}
      </View>

      {/* APTITUDE */}

      <SyllabusSubject
        title="🔢 Quantitative Aptitude"
        data={syllabus.aptitude}
        isOpen={
          openSubject === "aptitude"
        }
        onPress={() =>
          toggleSubject("aptitude")
        }
      />

      {/* DATA INTERPRETATION */}

      <SyllabusSubject
        title="📊 Data Interpretation"
        data={
          syllabus.data_interpretation
        }
        isOpen={
          openSubject ===
          "data_interpretation"
        }
        onPress={() =>
          toggleSubject(
            "data_interpretation"
          )
        }
      />

      {/* REASONING */}

      <SyllabusSubject
        title="🧠 Reasoning"
        data={syllabus.reasoning}
        isOpen={
          openSubject === "reasoning"
        }
        onPress={() =>
          toggleSubject("reasoning")
        }
      />

      {/* ENGLISH */}

      <SyllabusSubject
        title="🗣️ English"
        data={syllabus.english}
        isOpen={
          openSubject === "english"
        }
        onPress={() =>
          toggleSubject("english")
        }
      />

      {/* INTERVIEW */}

      <SyllabusSubject
        title="🎤 Interview"
        data={syllabus.interview}
        isOpen={
          openSubject === "interview"
        }
        onPress={() =>
          toggleSubject("interview")
        }
      />
    </View>
  );
}

/* =========================================================
   ROADMAP
========================================================= */

function RoadmapSection({
  analysis,
}: {
  analysis: Analysis;
}) {
  const roadmap =
    analysis.eight_week_roadmap;

  const [openWeek, setOpenWeek] =
    useState<number | null>(null);

  if (!roadmap || roadmap.length === 0) {
    return (
      <Text style={styles.emptyText}>
        8-week roadmap is not available.
      </Text>
    );
  }

  const toggleWeek = (
    weekNumber: number
  ) => {
    setOpenWeek((current) =>
      current === weekNumber
        ? null
        : weekNumber
    );
  };

  return (
    <View>
      <Text
        style={styles.roadmapIntro}
      >
        Your 8-week plan is personalized
        from the complete syllabus. Each
        day contains the topic and its
        important models to practice.
      </Text>

      {roadmap.map((week, index) => {
        const weekNumber =
          week.week ?? index + 1;

        const isOpen =
          openWeek === weekNumber;

        return (
          <View
            key={`week-${weekNumber}-${index}`}
            style={
              styles.weekAccordion
            }
          >
            <TouchableOpacity
              style={[
                styles.weekHeader,
                isOpen &&
                  styles.weekHeaderOpen,
              ]}
              onPress={() =>
                toggleWeek(
                  weekNumber
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={
                  styles.weekHeaderLeft
                }
              >
                <Text
                  style={styles.weekIcon}
                >
                  📅
                </Text>

                <Text
                  style={styles.weekTitle}
                >
                  Week {weekNumber}
                </Text>
              </View>

              <Text
                style={styles.weekArrow}
              >
                {isOpen ? "⌃" : "›"}
              </Text>
            </TouchableOpacity>

            {isOpen ? (
              <View
                style={
                  styles.weekContent
                }
              >
                {week.days?.map(
                  (day, dayIndex) => (
                    <DayBlock
                      key={`day-${day.day}-${dayIndex}`}
                      day={day}
                    />
                  )
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/* =========================================================
   DAILY PRACTICE
========================================================= */

function DailyPracticeSection({
  analysis,
}: {
  analysis: Analysis;
}) {
  const allocation =
    analysis.daily_time_allocation;

  const practice =
    analysis.daily_practice_system;

  return (
    <View>
      <Text style={styles.subheading}>
        Daily Time Allocation
      </Text>

      {allocation ? (
        <View style={styles.timeCard}>
          <Text style={styles.timeRow}>
            💻 Technical —{" "}
            {allocation.technical_minutes ??
              0}{" "}
            min
          </Text>

          <Text style={styles.timeRow}>
            🔢 Aptitude —{" "}
            {allocation.aptitude_minutes ??
              0}{" "}
            min
          </Text>

          <Text style={styles.timeRow}>
            📊 Data Interpretation —{" "}
            {allocation.data_interpretation_minutes ??
              0}{" "}
            min
          </Text>

          <Text style={styles.timeRow}>
            🧠 Reasoning —{" "}
            {allocation.reasoning_minutes ??
              0}{" "}
            min
          </Text>

          <Text style={styles.timeRow}>
            🗣️ English —{" "}
            {allocation.english_minutes ??
              0}{" "}
            min
          </Text>

          <Text style={styles.timeRow}>
            🎤 Interview —{" "}
            {allocation.interview_minutes ??
              0}{" "}
            min
          </Text>

          <View
            style={styles.totalTimeBox}
          >
            <Text
              style={styles.totalTimeText}
            >
              Total —{" "}
              {allocation.total_minutes ??
                0}{" "}
              minutes/day
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Daily time allocation is not
          available.
        </Text>
      )}

      {practice ? (
        <>
          <Text
            style={styles.subheading}
          >
            Daily Practice System
          </Text>

          <Text
            style={styles.practiceHeading}
          >
            💻 Technical
          </Text>

          <BulletList
            items={practice.technical}
          />

          <Text
            style={styles.practiceHeading}
          >
            🔢 Aptitude
          </Text>

          <BulletList
            items={practice.aptitude}
          />

          <Text
            style={styles.practiceHeading}
          >
            📊 Data Interpretation
          </Text>

          <BulletList
            items={
              practice.data_interpretation
            }
          />

          <Text
            style={styles.practiceHeading}
          >
            🧠 Reasoning
          </Text>

          <BulletList
            items={practice.reasoning}
          />

          <Text
            style={styles.practiceHeading}
          >
            🗣️ English
          </Text>

          <BulletList
            items={practice.english}
          />

          <Text
            style={styles.practiceHeading}
          >
            🎤 Interview
          </Text>

          <BulletList
            items={practice.interview}
          />
        </>
      ) : null}
    </View>
  );
}

/* =========================================================
   INTERVIEW
========================================================= */

function InterviewSection({
  analysis,
}: {
  analysis: Analysis;
}) {
  const interview =
    analysis.interview_preparation;

  if (!interview) {
    return (
      <Text style={styles.emptyText}>
        Interview preparation is not
        available.
      </Text>
    );
  }

  return (
    <View>
      <Text style={styles.subheading}>
        Technical Questions
      </Text>

      <BulletList
        items={
          interview.technical_questions
        }
      />

      <Text style={styles.subheading}>
        HR Questions
      </Text>

      <BulletList
        items={
          interview.hr_questions
        }
      />

      <Text style={styles.subheading}>
        Project Questions
      </Text>

      <BulletList
        items={
          interview.project_questions
        }
      />

      <Text style={styles.subheading}>
        Communication Practice
      </Text>

      <BulletList
        items={
          interview.communication_practice
        }
      />
    </View>
  );
}

/* =========================================================
   MAIN JD ANALYZER SCREEN
========================================================= */

export default function JDAnalyzerScreen() {
  const [
    jobDescription,
    setJobDescription,
  ] = useState("");

  const [
    analysis,
    setAnalysis,
  ] = useState<Analysis | null>(
    null
  );

  const [
    openSection,
    setOpenSection,
  ] = useState<SectionId | null>(
    null
  );

  const [loading, setLoading] =
    useState(false);

  const [
    restoring,
    setRestoring,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     LOAD SAVED DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const restoreSavedData =
      async () => {
        try {
          setRestoring(true);

          const token =
            await getStorage(
              ACCESS_TOKEN_KEY
            );

          /* -----------------------------------------------
             1. BACKEND FIRST
          ------------------------------------------------ */

          if (token) {
            try {
              const response =
                await fetch(
                  `${API_URL}/api/v1/jd/latest`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

              const data =
                await response.json();

              if (!mounted) {
                return;
              }

              if (response.ok) {
                if (
                  typeof data.job_description ===
                    "string" &&
                  data.job_description.trim() !==
                    ""
                ) {
                  setJobDescription(
                    data.job_description
                  );

                  await saveStorage(
                    JD_TEXT_KEY,
                    data.job_description
                  );
                }

                if (
                  data.analysis &&
                  typeof data.analysis ===
                    "object"
                ) {
                  setAnalysis(
                    data.analysis as Analysis
                  );

                  await saveStorage(
                    JD_ANALYSIS_KEY,
                    JSON.stringify(
                      data.analysis
                    )
                  );

                  setOpenSection(
                    "job"
                  );
                }

                return;
              }

              console.log(
                "Backend JD load failed:",
                data.detail
              );
            } catch (backendError) {
              console.log(
                "Could not load JD from backend:",
                backendError
              );
            }
          }

          /* -----------------------------------------------
             2. LOCAL STORAGE FALLBACK
          ------------------------------------------------ */

          const savedJD =
            await getStorage(
              JD_TEXT_KEY
            );

          const savedAnalysis =
            await getStorage(
              JD_ANALYSIS_KEY
            );

          if (!mounted) {
            return;
          }

          if (
            savedJD !== null &&
            savedJD.trim() !== ""
          ) {
            setJobDescription(
              savedJD
            );
          }

          if (
            savedAnalysis !== null &&
            savedAnalysis.trim() !== ""
          ) {
            try {
              const parsedAnalysis =
                JSON.parse(
                  savedAnalysis
                );

              if (
                parsedAnalysis &&
                typeof parsedAnalysis ===
                  "object"
              ) {
                setAnalysis(
                  parsedAnalysis as Analysis
                );

                setOpenSection(
                  "job"
                );
              }
            } catch (error) {
              console.log(
                "Saved JD analysis could not be restored:",
                error
              );
            }
          }
        } catch (error) {
          console.log(
            "Could not restore saved JD:",
            error
          );
        } finally {
          if (mounted) {
            setRestoring(false);
          }
        }
      };

    restoreSavedData();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     ANALYZE JD
  ======================================================= */

  const analyzeJD = async () => {
    setErrorMessage("");

    if (!jobDescription.trim()) {
      setErrorMessage(
        "Please enter a job description."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        await getStorage(
          ACCESS_TOKEN_KEY
        );

      if (!token) {
        setErrorMessage(
          "Please login again."
        );
        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/v1/jd/analyze`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              job_description:
                jobDescription.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setErrorMessage(
          typeof data.detail ===
            "string"
            ? data.detail
            : "Failed to analyze job description."
        );

        return;
      }

      if (
        !data.analysis ||
        typeof data.analysis !==
          "object"
      ) {
        setErrorMessage(
          "AI returned an unexpected response format."
        );

        return;
      }

      const analysisString =
        JSON.stringify(
          data.analysis
        );

      await saveStorage(
        JD_TEXT_KEY,
        jobDescription.trim()
      );

      await saveStorage(
        JD_ANALYSIS_KEY,
        analysisString
      );

      setAnalysis(
        data.analysis as Analysis
      );

      setOpenSection("job");
    } catch (error) {
      console.error(
        "JD Analyzer Error:",
        error
      );

      setErrorMessage(
        "Could not connect to the backend. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     MAIN SECTION TOGGLE
  ======================================================= */

  const toggleSection = (
    id: SectionId
  ) => {
    if (openSection === id) {
      setOpenSection(null);
    } else {
      setOpenSection(id);
    }
  };

  /* =======================================================
     SECTION CONTENT
  ======================================================= */

  const renderSectionContent = (
    id: SectionId
  ) => {
    if (!analysis) {
      return null;
    }

    switch (id) {
      case "job":
        return (
          <JobOverview
            analysis={analysis}
          />
        );

      case "skills":
        return (
          <SkillsSection
            analysis={analysis}
          />
        );

      case "syllabus":
        return (
          <SyllabusSection
            analysis={analysis}
          />
        );

      case "roadmap":
        return (
          <RoadmapSection
            analysis={analysis}
          />
        );

      case "daily":
        return (
          <DailyPracticeSection
            analysis={analysis}
          />
        );

      case "interview":
        return (
          <InterviewSection
            analysis={analysis}
          />
        );

      default:
        return null;
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* BACK */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </TouchableOpacity>

      {/* TITLE */}

      <Text style={styles.title}>
        💼 Job Description Analyzer
      </Text>

      <Text style={styles.subtitle}>
        Paste a job description and let AI
        identify the skills and preparation
        needed.
      </Text>

      {/* RESTORING */}

      {restoring ? (
        <View
          style={styles.restoreBox}
        >
          <ActivityIndicator
            size="small"
            color="#2563EB"
          />

          <Text
            style={styles.restoreText}
          >
            Loading your saved job
            description...
          </Text>
        </View>
      ) : null}

      {/* LABEL */}

      <Text style={styles.label}>
        Job Description
      </Text>

      <Text style={styles.helperText}>
        Include the complete job description
        for better AI analysis.
      </Text>

      {/* INPUT */}

      <View
        style={
          styles.actualInputContainer
        }
      >
        <JDTextInput
          value={jobDescription}
          onChangeText={(text) => {
            setJobDescription(text);

            saveStorage(
              JD_TEXT_KEY,
              text
            ).catch((error) => {
              console.log(
                "Could not save JD locally:",
                error
              );
            });
          }}
        />
      </View>

      {/* ERROR */}

      {errorMessage ? (
        <Text style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {/* ANALYZE BUTTON */}

      <TouchableOpacity
        style={[
          styles.button,
          loading &&
            styles.buttonDisabled,
        ]}
        onPress={analyzeJD}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View
            style={styles.loadingRow}
          >
            <ActivityIndicator
              color="#FFFFFF"
            />

            <Text
              style={styles.buttonText}
            >
              Analyzing...
            </Text>
          </View>
        ) : (
          <Text
            style={styles.buttonText}
          >
            🤖 Analyze Job Description
          </Text>
        )}
      </TouchableOpacity>

      {/* RESULTS */}

      {analysis ? (
        <View
          style={
            styles.resultsContainer
          }
        >
          <Text
            style={styles.analysisTitle}
          >
            🤖 AI Career Analysis
          </Text>

          <Text
            style={
              styles.analysisSubtitle
            }
          >
            Tap any section to view the
            details.
          </Text>

          {sections.map((section) => {
            const isOpen =
              openSection ===
              section.id;

            return (
              <View
                key={section.id}
                style={
                  styles.sectionWrapper
                }
              >
                <TouchableOpacity
                  style={[
                    styles.sectionHeader,
                    isOpen &&
                      styles.sectionHeaderOpen,
                  ]}
                  onPress={() =>
                    toggleSection(
                      section.id
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={
                      styles.sectionLeft
                    }
                  >
                    <Text
                      style={
                        styles.sectionIcon
                      }
                    >
                      {section.icon}
                    </Text>

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      {section.title}
                    </Text>
                  </View>

                  <Text
                    style={styles.arrow}
                  >
                    {isOpen
                      ? "⌃"
                      : "›"}
                  </Text>
                </TouchableOpacity>

                {isOpen ? (
                  <View
                    style={
                      styles.sectionContent
                    }
                  >
                    {renderSectionContent(
                      section.id
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

/* =========================================================
   TEXT INPUT
========================================================= */

function JDTextInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (
    text: string
  ) => void;
}) {
  return (
    <TextInput
      style={styles.textArea}
      placeholder="Paste the complete job description here..."
      placeholderTextColor="#94A3B8"
      multiline
      textAlignVertical="top"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },

    content: {
      padding: 20,
      paddingBottom: 50,
    },

    backButton: {
      marginBottom: 16,
    },

    backText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#2563EB",
    },

    title: {
      fontSize: 26,
      fontWeight: "800",
      color: "#0F172A",
      marginBottom: 8,
    },

    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: "#64748B",
      marginBottom: 24,
    },

    restoreBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EFF6FF",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
      gap: 9,
    },

    restoreText: {
      flex: 1,
      fontSize: 13,
      color: "#2563EB",
      fontWeight: "600",
    },

    label: {
      fontSize: 16,
      fontWeight: "700",
      color: "#0F172A",
      marginBottom: 5,
    },

    helperText: {
      fontSize: 13,
      color: "#64748B",
      marginBottom: 10,
    },

    actualInputContainer: {
      marginBottom: 14,
    },

    textArea: {
      minHeight: 190,
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
      padding: 15,
      fontSize: 15,
      color: "#0F172A",
      textAlignVertical: "top",
    },

    errorText: {
      color: "#DC2626",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },

    button: {
      backgroundColor: "#2563EB",
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginBottom: 28,
    },

    buttonDisabled: {
      opacity: 0.7,
    },

    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    resultsContainer: {
      marginTop: 4,
    },

    analysisTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#0F172A",
      marginBottom: 5,
    },

    analysisSubtitle: {
      fontSize: 14,
      color: "#64748B",
      marginBottom: 16,
    },

    /* =====================================================
       MAIN SECTION ACCORDIONS
    ===================================================== */

    sectionWrapper: {
      marginBottom: 12,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    sectionHeader: {
      minHeight: 64,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    sectionHeaderOpen: {
      backgroundColor: "#EFF6FF",
    },

    sectionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    sectionIcon: {
      fontSize: 22,
      marginRight: 12,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#0F172A",
      flex: 1,
    },

    arrow: {
      fontSize: 25,
      color: "#64748B",
      marginLeft: 10,
    },

    sectionContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },

    /* =====================================================
       COMMON
    ===================================================== */

    subheading: {
      fontSize: 17,
      fontWeight: "800",
      color: "#0F172A",
      marginTop: 18,
      marginBottom: 10,
    },

    smallHeading: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1E293B",
      marginBottom: 7,
    },

    /* =====================================================
       SYLLABUS
    ===================================================== */

    syllabusIntro: {
      fontSize: 14,
      lineHeight: 21,
      color: "#475569",
      backgroundColor: "#EFF6FF",
      borderRadius: 10,
      padding: 12,
      marginBottom: 14,
    },

    syllabusHint: {
      fontSize: 13,
      lineHeight: 20,
      color: "#475569",
      backgroundColor: "#F8FAFC",
      borderRadius: 10,
      padding: 11,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    syllabusSubjectWrapper: {
      marginBottom: 12,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    syllabusSubjectHeader: {
      minHeight: 58,
      paddingHorizontal: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#FFFFFF",
    },

    syllabusSubjectHeaderOpen: {
      backgroundColor: "#EFF6FF",
    },

    syllabusSubjectTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "800",
      color: "#0F172A",
    },

    syllabusSubjectArrow: {
      fontSize: 25,
      color: "#64748B",
      marginLeft: 10,
    },

    syllabusSubjectContent: {
      padding: 10,
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },

    /* =====================================================
       TECHNICAL COURSE
    ===================================================== */

    courseCard: {
      backgroundColor: "#F8FAFC",
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      overflow: "hidden",
    },

    courseHeader: {
      minHeight: 58,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#FFFFFF",
    },

    courseHeaderOpen: {
      backgroundColor: "#F1F5F9",
    },

    courseHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    courseNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "#DBEAFE",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    courseNumberText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#1D4ED8",
    },

    courseTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
      color: "#0F172A",
    },

    courseArrow: {
      fontSize: 25,
      color: "#64748B",
      marginLeft: 10,
    },

    courseContent: {
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },

    courseTopicCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    courseTopicTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#1E293B",
      lineHeight: 21,
    },

    topicCard: {
      backgroundColor: "#F8FAFC",
      borderRadius: 12,
      padding: 13,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    topicTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#1E293B",
      lineHeight: 21,
    },

    modelsContainer: {
      marginTop: 9,
    },

    modelRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 7,
    },

    modelNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#E2E8F0",
      textAlign: "center",
      lineHeight: 22,
      fontSize: 12,
      fontWeight: "700",
      color: "#334155",
      marginRight: 8,
    },

    modelText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: "#475569",
    },

    /* =====================================================
       BULLETS
    ===================================================== */

    bulletList: {
      marginBottom: 6,
    },

    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },

    bullet: {
      fontSize: 17,
      lineHeight: 21,
      color: "#2563EB",
      marginRight: 8,
    },

    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: "#334155",
    },

    emptyText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#64748B",
    },

    /* =====================================================
       JOB OVERVIEW
    ===================================================== */

    infoGrid: {
      marginBottom: 5,
    },

    infoItem: {
      backgroundColor: "#F8FAFC",
      borderRadius: 10,
      padding: 12,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    infoLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#64748B",
      marginBottom: 4,
    },

    infoValue: {
      fontSize: 15,
      fontWeight: "600",
      color: "#0F172A",
      lineHeight: 21,
    },

    /* =====================================================
       SKILLS
    ===================================================== */

    skillCard: {
      backgroundColor: "#F8FAFC",
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    skillHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    skillName: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
      color: "#0F172A",
    },

    priorityBadge: {
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
      backgroundColor: "#E0E7FF",
    },

    priorityText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#3730A3",
    },

    skillReason: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: "#475569",
    },

    /* =====================================================
       ROADMAP
    ===================================================== */

    roadmapIntro: {
      fontSize: 14,
      lineHeight: 21,
      color: "#475569",
      backgroundColor: "#EFF6FF",
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },

    weekAccordion: {
      marginBottom: 12,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },

    weekHeader: {
      minHeight: 60,
      paddingHorizontal: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#FFFFFF",
    },

    weekHeaderOpen: {
      backgroundColor: "#EFF6FF",
    },

    weekHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    weekIcon: {
      fontSize: 20,
      marginRight: 10,
    },

    weekTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#0F172A",
      flex: 1,
    },

    weekArrow: {
      fontSize: 25,
      color: "#64748B",
      marginLeft: 10,
    },

    weekContent: {
      padding: 10,
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },

    /* =====================================================
       DAY CARD
    ===================================================== */

    dayCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      padding: 13,
      marginBottom: 10,
    },

    dayTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: "#2563EB",
      marginBottom: 12,
    },

    dailySubject: {
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
      paddingTop: 11,
      marginTop: 10,
    },

    dailySubjectTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#0F172A",
      marginBottom: 5,
    },

    dailyCourse: {
      fontSize: 13,
      fontWeight: "700",
      color: "#2563EB",
      marginBottom: 4,
    },

    dailyTopic: {
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      color: "#334155",
      marginBottom: 5,
    },

    taskText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#475569",
      marginBottom: 5,
    },

    practiceInfo: {
      fontSize: 13,
      lineHeight: 20,
      color: "#64748B",
      marginTop: 3,
    },

    /* =====================================================
       DAILY PRACTICE
    ===================================================== */

    timeCard: {
      backgroundColor: "#F8FAFC",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      marginBottom: 8,
    },

    timeRow: {
      fontSize: 14,
      lineHeight: 24,
      color: "#334155",
      fontWeight: "600",
    },

    totalTimeBox: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#CBD5E1",
    },

    totalTimeText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#0F172A",
    },

    practiceHeading: {
      fontSize: 15,
      fontWeight: "800",
      color: "#1E293B",
      marginTop: 10,
      marginBottom: 7,
    },
  });