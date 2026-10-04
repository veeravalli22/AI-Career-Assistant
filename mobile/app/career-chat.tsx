import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Markdown from "react-native-markdown-display";

type ChatMessage = {
  id?: number;
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: number;
  title: string;
  created_at?: string;
  updated_at?: string;
};

const API_BASE_URL = "http://127.0.0.1:8001";

const WELCOME_MESSAGE =
  "Hi! 👋 I am your AI Career Assistant. Ask me anything about your career, resume, skills, interviews, jobs, or placement preparation.";

const cleanMarkdown = (text: string) => {
  return text
    .replace(/\\\*\\\*/g, "**")
    .replace(/\\\*/g, "*")
    .replace(/\\_/g, "_");
};

const markdownStyles = {
  body: {
    color: "#1F2937",
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 9,
  },
  heading1: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700" as const,
    marginTop: 5,
    marginBottom: 9,
  },
  heading2: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700" as const,
    marginTop: 5,
    marginBottom: 8,
  },
  heading3: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700" as const,
    marginTop: 4,
    marginBottom: 7,
  },
  strong: {
    color: "#111827",
    fontWeight: "700" as const,
  },
  em: {
    fontStyle: "italic" as const,
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 7,
  },
  ordered_list: {
    marginTop: 2,
    marginBottom: 7,
  },
  list_item: {
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: "#F3F4F6",
    color: "#111827",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fence: {
    backgroundColor: "#111827",
    color: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  link: {
    color: "#4F46E5",
    textDecorationLine: "underline" as const,
  },
};

export default function CareerChatScreen() {
  // ============================================================
  // CHAT STATE
  // ============================================================

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: WELCOME_MESSAGE,
    },
  ]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState<number | null>(
    null
  );

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  // ============================================================
  // EDIT STATE
  // ============================================================

  const [editingMessageId, setEditingMessageId] = useState<number | null>(
    null
  );

  const [editingText, setEditingText] = useState("");

  const scrollViewRef = useRef<ScrollView>(null);

  // ============================================================
  // LOAD CHAT HISTORY ON SCREEN OPEN
  // ============================================================

  useEffect(() => {
    loadChatSessions();
  }, []);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [messages, loading]);

  // ============================================================
  // GET LOGIN TOKEN
  // ============================================================

  const getToken = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          return window.localStorage.getItem("access_token");
        }

        return null;
      }

      return await AsyncStorage.getItem("access_token");
    } catch {
      return null;
    }
  };

  // ============================================================
  // LOAD CHAT SESSIONS
  // ============================================================

  const loadChatSessions = async () => {
    const token = await getToken();

    if (!token) {
      return;
    }

    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/career-chat/sessions`,
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
          data?.detail || "Failed to load chat history."
        );
      }

      setSessions(data?.sessions || []);
    } catch (error) {
      console.log("Chat history error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============================================================
  // OPEN PREVIOUS CHAT
  // ============================================================

  const openChatSession = async (sessionId: number) => {
    const token = await getToken();

    if (!token) {
      return;
    }

    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/career-chat/sessions/${sessionId}`,
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
          data?.detail || "Failed to open chat."
        );
      }

      const loadedMessages: ChatMessage[] = (
        data?.messages || []
      ).map((item: any) => ({
        id: item.id,
        role: item.role,
        content: item.content,
      }));

      setCurrentSessionId(sessionId);

      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      } else {
        setMessages([
          {
            role: "assistant",
            content: WELCOME_MESSAGE,
          },
        ]);
      }

      setInput("");
      setEditingMessageId(null);
      setEditingText("");

      setShowHistory(false);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message ||
            "Unable to open this chat. Please try again.",
        },
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============================================================
  // NEW CHAT
  // ============================================================

  const startNewChat = () => {
    // IMPORTANT:
    // We are NOT deleting the previous chat.
    // We are only removing the current session from the screen.
    setCurrentSessionId(null);

    setMessages([
      {
        role: "assistant",
        content: WELCOME_MESSAGE,
      },
    ]);

    setInput("");

    setEditingMessageId(null);

    setEditingText("");

    setShowHistory(false);
  };

  // ============================================================
  // SEND NORMAL MESSAGE
  // ============================================================

  const sendMessage = async (messageText?: string) => {
    const message = (messageText ?? input).trim();

    if (!message || loading) {
      return;
    }

    const token = await getToken();

    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Please login first before using AI Career Chat.",
        },
      ]);

      return;
    }

    // Show user message immediately.
    const temporaryUserMessage: ChatMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [
      ...prev,
      temporaryUserMessage,
    ]);

    setInput("");

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/career-chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            message,
            session_id: currentSessionId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to get AI response."
        );
      }

      if (!data?.answer) {
        throw new Error(
          "AI returned an empty response."
        );
      }

      // Save session ID returned by backend.
      if (data?.session_id) {
        setCurrentSessionId(
          data.session_id
        );
      }

      // Replace temporary user message with
      // database message containing its real ID.
      setMessages((prev) => {
        const updated = [...prev];

        const lastUserIndex =
          updated.length - 1;

        if (
          lastUserIndex >= 0 &&
          updated[lastUserIndex].role === "user"
        ) {
          updated[lastUserIndex] = {
            id: data?.user_message?.id,
            role: "user",
            content:
              data?.user_message?.content ||
              message,
          };
        }

        // Add AI response.
        updated.push({
          id:
            data?.assistant_message?.id,
          role: "assistant",
          content: data.answer,
        });

        return updated;
      });

      // Refresh history list.
      await loadChatSessions();
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message ||
            "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // START EDIT
  // ============================================================

  const beginEditMessage = (
    message: ChatMessage
  ) => {
    if (
      !message.id ||
      message.role !== "user"
    ) {
      return;
    }

    setEditingMessageId(message.id);

    setEditingText(message.content);
  };

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  const cancelEdit = () => {
    setEditingMessageId(null);

    setEditingText("");
  };

  // ============================================================
  // SAVE EDITED MESSAGE
  // ============================================================

  const saveEditedMessage = async () => {
    const newText = editingText.trim();

    const editedMessageId =
      editingMessageId;

    if (
      !newText ||
      !editedMessageId ||
      loading
    ) {
      return;
    }

    const token = await getToken();

    if (!token) {
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // 1. Update existing user message
      // --------------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/api/v1/career-chat/messages/${editedMessageId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            content: newText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to edit message."
        );
      }

      // --------------------------------------------------------
      // 2. Update frontend message
      //
      // IMPORTANT:
      // Remove everything after the edited message.
      // This removes old AI response from the screen.
      // --------------------------------------------------------

      setMessages((prev) => {
        const index = prev.findIndex(
          (item) =>
            item.id === editedMessageId
        );

        if (index === -1) {
          return prev;
        }

        const updated = prev
          .slice(0, index + 1)
          .map((item, itemIndex) => {
            if (itemIndex === index) {
              return {
                ...item,
                id: editedMessageId,
                role: "user" as const,
                content: newText,
              };
            }

            return item;
          });

        return updated;
      });

      // --------------------------------------------------------
      // 3. Close edit modal
      // --------------------------------------------------------

      setEditingMessageId(null);

      setEditingText("");

      // --------------------------------------------------------
      // 4. Ask AI using the SAME message ID
      // --------------------------------------------------------

      await sendEditedMessage(
        newText,
        editedMessageId
      );
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message ||
            "Unable to edit the message. Please try again.",
        },
      ]);

      setLoading(false);
    }
  };

  // ============================================================
  // SEND EDITED MESSAGE TO AI
  // ============================================================

  const sendEditedMessage = async (
    editedText: string,
    editedMessageId: number
  ) => {
    const token = await getToken();

    if (
      !token ||
      !currentSessionId
    ) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/career-chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            message: editedText,

            session_id:
              currentSessionId,

            // IMPORTANT:
            // Tell backend this is an edited
            // existing user message.
            message_id:
              editedMessageId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to generate updated AI response."
        );
      }

      if (!data?.answer) {
        throw new Error(
          "AI returned an empty response."
        );
      }

      // Add ONLY the NEW AI response.
      // The old AI response was already removed
      // from the frontend and database.
      setMessages((prev) => [
        ...prev,
        {
          id:
            data?.assistant_message?.id,
          role: "assistant",
          content: data.answer,
        },
      ]);

      // Refresh history.
      await loadChatSessions();
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message ||
            "Unable to generate updated AI response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DELETE CHAT
  // ============================================================

  const deleteChat = async (
    sessionId: number
  ) => {
    const token = await getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/career-chat/sessions/${sessionId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to delete chat."
        );
      }

      setSessions((prev) =>
        prev.filter(
          (session) =>
            session.id !== sessionId
        )
      );

      if (
        currentSessionId === sessionId
      ) {
        startNewChat();
      }
    } catch (error) {
      console.log(
        "Delete chat error:",
        error
      );
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            AI Career Chat
          </Text>

          <Text style={styles.headerSubtitle}>
            Your personal career assistant
          </Text>
        </View>

        <View style={styles.headerButtons}>
          {/* HISTORY */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              setShowHistory(true);

              loadChatSessions();
            }}
          >
            <Text
              style={
                styles.historyButtonText
              }
            >
              History
            </Text>
          </TouchableOpacity>

          {/* NEW CHAT */}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={startNewChat}
          >
            <Text
              style={styles.newChatText}
            >
              New Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ====================================================== */}
      {/* CHAT AREA */}
      {/* ====================================================== */}

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={
          styles.chatContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {messages.map(
          (message, index) => {
            const isUser =
              message.role === "user";

            return (
              <View
                key={`${message.id || message.role}-${index}`}
                style={[
                  styles.messageRow,

                  isUser
                    ? styles.userRow
                    : styles.assistantRow,
                ]}
              >
                {/* AI ICON */}
                {!isUser && (
                  <View
                    style={styles.aiIcon}
                  >
                    <Text
                      style={
                        styles.aiIconText
                      }
                    >
                      AI
                    </Text>
                  </View>
                )}

                {/* MESSAGE BUBBLE */}
                <View
                  style={[
                    styles.messageBubble,

                    isUser
                      ? styles.userBubble
                      : styles.assistantBubble,
                  ]}
                >
                  {/* AI LABEL */}
                  {!isUser && (
                    <Text
                      style={
                        styles.assistantLabel
                      }
                    >
                      AI Career Assistant
                    </Text>
                  )}

                  {/* USER MESSAGE */}
                  {isUser ? (
                    <>
                      <Text
                        style={[
                          styles.messageText,
                          styles.userMessageText,
                        ]}
                      >
                        {message.content}
                      </Text>

                      {/* EDIT BUTTON */}
                      {message.id && (
                        <TouchableOpacity
                          style={
                            styles.editButton
                          }
                          onPress={() =>
                            beginEditMessage(
                              message
                            )
                          }
                        >
                          <Text
                            style={
                              styles.editButtonText
                            }
                          >
                            ✏️ Edit
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    /* AI MESSAGE */
                    <Markdown
                      style={
                        markdownStyles
                      }
                    >
                      {cleanMarkdown(
                        message.content
                      )}
                    </Markdown>
                  )}
                </View>
              </View>
            )
          }
        )}

        {/* ==================================================== */}
        {/* LOADING MESSAGE */}
        {/* ==================================================== */}

        {loading && (
          <View
            style={styles.messageRow}
          >
            <View
              style={styles.aiIcon}
            >
              <Text
                style={
                  styles.aiIconText
                }
              >
                AI
              </Text>
            </View>

            <View
              style={[
                styles.messageBubble,
                styles.assistantBubble,
                styles.loadingBubble,
              ]}
            >
              <Text
                style={
                  styles.assistantLabel
                }
              >
                AI Career Assistant
              </Text>

              <View
                style={styles.loadingRow}
              >
                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Thinking...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ====================================================== */}
      {/* INPUT AREA */}
      {/* ====================================================== */}

      <View
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask about your career..."
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          editable={!loading}
          onSubmitEditing={() => {
            if (Platform.OS !== "web") {
              sendMessage();
            }
          }}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,

            (!input.trim() ||
              loading) &&
              styles.sendButtonDisabled,
          ]}
          onPress={() =>
            sendMessage()
          }
          disabled={
            !input.trim() ||
            loading
          }
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.sendButtonText
              }
            >
              ➤
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ====================================================== */}
      {/* EDIT MESSAGE MODAL */}
      {/* ====================================================== */}

      <Modal
        visible={
          editingMessageId !== null
        }
        transparent
        animationType="fade"
        onRequestClose={
          cancelEdit
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.editModal
            }
          >
            <Text
              style={
                styles.editModalTitle
              }
            >
              Edit Message
            </Text>

            <TextInput
              style={
                styles.editInput
              }
              value={editingText}
              onChangeText={
                setEditingText
              }
              multiline
              autoFocus
              maxLength={1000}
              placeholder="Edit your message..."
              placeholderTextColor="#9CA3AF"
            />

            <View
              style={
                styles.editActions
              }
            >
              {/* CANCEL */}
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  cancelEdit
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* SAVE */}
              <TouchableOpacity
                style={[
                  styles.saveEditButton,

                  !editingText.trim() &&
                    styles.saveEditButtonDisabled,
                ]}
                onPress={
                  saveEditedMessage
                }
                disabled={
                  !editingText.trim() ||
                  loading
                }
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveEditButtonText
                    }
                  >
                    Save & Ask AI
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================== */}
      {/* CHAT HISTORY MODAL */}
      {/* ====================================================== */}

      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowHistory(false)
        }
      >
        <View
          style={
            styles.historyOverlay
          }
        >
          <View
            style={
              styles.historyModal
            }
          >
            {/* HISTORY HEADER */}
            <View
              style={
                styles.historyHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.historyTitle
                  }
                >
                  Chat History
                </Text>

                <Text
                  style={
                    styles.historySubtitle
                  }
                >
                  Your previous conversations
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowHistory(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.closeButton
                  }
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* LOADING */}
            {historyLoading ? (
              <View
                style={
                  styles.historyLoading
                }
              >
                <ActivityIndicator
                  size="large"
                />

                <Text
                  style={
                    styles.historyLoadingText
                  }
                >
                  Loading chats...
                </Text>
              </View>
            ) : sessions.length === 0 ? (
              /* EMPTY */
              <View
                style={
                  styles.emptyHistory
                }
              >
                <Text
                  style={
                    styles.emptyHistoryIcon
                  }
                >
                  💬
                </Text>

                <Text
                  style={
                    styles.emptyHistoryTitle
                  }
                >
                  No previous chats
                </Text>

                <Text
                  style={
                    styles.emptyHistoryText
                  }
                >
                  Start a conversation and
                  it will appear here.
                </Text>
              </View>
            ) : (
              /* CHAT LIST */
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.historyList
                }
              >
                {sessions.map(
                  (session) => (
                    <View
                      key={
                        session.id
                      }
                      style={
                        styles.sessionCard
                      }
                    >
                      {/* OPEN CHAT */}
                      <TouchableOpacity
                        style={
                          styles.sessionMain
                        }
                        onPress={() =>
                          openChatSession(
                            session.id
                          )
                        }
                      >
                        <View
                          style={
                            styles.sessionIcon
                          }
                        >
                          <Text>
                            💬
                          </Text>
                        </View>

                        <View
                          style={
                            styles.sessionInfo
                          }
                        >
                          <Text
                            style={
                              styles.sessionTitle
                            }
                            numberOfLines={
                              2
                            }
                          >
                            {
                              session.title
                            }
                          </Text>

                          <Text
                            style={
                              styles.sessionDate
                            }
                          >
                            {session.updated_at
                              ? new Date(
                                  session.updated_at
                                ).toLocaleString()
                              : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* DELETE CHAT */}
                      <TouchableOpacity
                        style={
                          styles.deleteButton
                        }
                        onPress={() =>
                          deleteChat(
                            session.id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.deleteButtonText
                          }
                        >
                          🗑️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flex: 1,
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111827",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },

  historyButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#F3F4F6",
    marginRight: 7,
  },

  historyButtonText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
  },

  newChatButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#EEF2FF",
  },

  newChatText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "600",
  },

  // ----------------------------------------------------------
  // CHAT
  // ----------------------------------------------------------

  chatArea: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 14,
    paddingVertical: 18,
    paddingBottom: 25,
  },

  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  assistantRow: {
    justifyContent: "flex-start",
  },

  aiIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
  },

  aiIconText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  messageBubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  userBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
  },

  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  assistantLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
    marginBottom: 5,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  editButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  loadingBubble: {
    minWidth: 150,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  loadingText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 14,
  },

  // ----------------------------------------------------------
  // INPUT
  // ----------------------------------------------------------

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 11,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
  },

  // ----------------------------------------------------------
  // EDIT MODAL
  // ----------------------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  editModal: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },

  editModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },

  editInput: {
    minHeight: 120,
    maxHeight: 220,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
  },

  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },

  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },

  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },

  saveEditButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    minWidth: 125,
    alignItems: "center",
  },

  saveEditButtonDisabled: {
    opacity: 0.5,
  },

  saveEditButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // ----------------------------------------------------------
  // HISTORY MODAL
  // ----------------------------------------------------------

  historyOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  historyModal: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: "82%",
    paddingTop: 18,
    paddingHorizontal: 16,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  historyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  historySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  closeButton: {
    fontSize: 22,
    color: "#6B7280",
    padding: 6,
  },

  historyLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  historyLoadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  emptyHistory: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyHistoryIcon: {
    fontSize: 45,
    marginBottom: 12,
  },

  emptyHistoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  emptyHistoryText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 6,
    lineHeight: 20,
  },

  historyList: {
    paddingTop: 14,
    paddingBottom: 30,
  },

  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  sessionMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sessionInfo: {
    flex: 1,
  },

  sessionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  sessionDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  deleteButtonText: {
    fontSize: 15,
  },
});