import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatSessionState as BackendChatSessionState,
  Message,
  QuestionOption,
  generateSessionId,
  getChatSession,
  sendChatModeQuery,
  sendQuery,
} from "@/services/api";
import { getAuthSession } from "@/services/authStorage";

const CHAT_STORAGE_KEY = "recommendme-chat-state-v2";
const PENDING_RECOMMENDATION_KEY = "recommendme-pending-recommendation-session-v2";

type ConversationStatus = "asking" | "ready" | "loading" | "complete";
type LoadingPhase = "understanding" | "generating" | "fetching";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  status: ConversationStatus;
  createdAt: Date;
  originalQuery?: string;
  clarificationRound?: number; // 0=pre, 1=round1, 2=round2
  clarificationAnswers?: { question: string; answer: string }[];
  awaitingClarificationAnswer?: boolean;
}

interface StoredChatSession {
  id: string;
  title: string;
  messages: Array<Omit<Message, "timestamp"> & { timestamp: string }>;
  status: ConversationStatus;
  createdAt: string;
  originalQuery?: string;
  clarificationRound?: number;
  clarificationAnswers?: { question: string; answer: string }[];
  awaitingClarificationAnswer?: boolean;
}

interface StoredChatState {
  sessions: StoredChatSession[];
  activeSessionId: string | null;
}

interface UseChatOptions {
  isAuthenticated?: () => boolean;
  onAuthRequired?: () => void;
}

function deserializeSessions(stored: StoredChatSession[]): ChatSession[] {
  return stored.map((session) => ({
    ...session,
    status: session.status || "ready",
    createdAt: new Date(session.createdAt),
    messages: session.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
  }));
}

function serializeSessions(sessions: ChatSession[]): StoredChatSession[] {
  return sessions.map((session) => ({
    ...session,
    createdAt: session.createdAt.toISOString(),
    messages: session.messages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    })),
  }));
}

function readChatState(): StoredChatState {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      return { sessions: [], activeSessionId: null };
    }
    const parsed = JSON.parse(raw) as StoredChatState;
    return {
      sessions: parsed.sessions || [],
      activeSessionId: parsed.activeSessionId || null,
    };
  } catch {
    return { sessions: [], activeSessionId: null };
  }
}

function persistChatState(state: StoredChatState): void {
  sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
}

function readPendingRecommendationSessionId(): string | null {
  try {
    return sessionStorage.getItem(PENDING_RECOMMENDATION_KEY);
  } catch {
    return null;
  }
}

function persistPendingRecommendationSessionId(sessionId: string | null): void {
  if (!sessionId) {
    sessionStorage.removeItem(PENDING_RECOMMENDATION_KEY);
    return;
  }
  sessionStorage.setItem(PENDING_RECOMMENDATION_KEY, sessionId);
}

function mapBackendConversationStatus(status: BackendChatSessionState["status"]): ConversationStatus {
  if (status === "clarification_needed") return "asking";
  if (status === "recommendations") return "complete";
  return "ready";
}

function buildSessionTitle(query: string, maxLen: number = 48): string {
  const cleaned = (query || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "New Chat";
  if (cleaned.length <= maxLen) return cleaned;

  const boundary = cleaned.lastIndexOf(" ", maxLen);
  const cut = boundary > Math.floor(maxLen * 0.6) ? boundary : maxLen;
  return `${cleaned.slice(0, cut).trim()}...`;
}

function toChatSession(snapshot: BackendChatSessionState): ChatSession {
  const hasPendingClarification = Boolean(snapshot.pendingQuestions && snapshot.pendingQuestions.length > 0);

  return {
    id: snapshot.sessionId,
    title: snapshot.title || buildSessionTitle(snapshot.originalQuery || ""),
    messages: snapshot.messages,
    status: hasPendingClarification ? "asking" : mapBackendConversationStatus(snapshot.status),
    createdAt: snapshot.createdAt,
    originalQuery: snapshot.originalQuery || undefined,
    clarificationRound: snapshot.clarificationRound ?? undefined,
    clarificationAnswers: snapshot.clarificationAnswers || undefined,
    awaitingClarificationAnswer: hasPendingClarification,
  };
}

function upsertSession(sessions: ChatSession[], nextSession: ChatSession): ChatSession[] {
  const index = sessions.findIndex((session) => session.id === nextSession.id);
  if (index === -1) {
    return [nextSession, ...sessions];
  }
  const updated = [...sessions];
  updated[index] = nextSession;
  return updated;
}

function createMessageId(suffix: string): string {
  const base = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `msg-${base}-${suffix}`;
}

function areEquivalentMessages(previous: Message, next: Message): boolean {
  if (previous.role !== next.role || previous.type !== next.type) return false;
  if (previous.content.trim() !== next.content.trim()) return false;
  return true;
}

function appendMessageIfNotDuplicate(messages: Message[], nextMessage: Message): Message[] {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && areEquivalentMessages(lastMessage, nextMessage)) {
    return messages;
  }
  return [...messages, nextMessage];
}

function buildProfileContextMessage(): { role: "assistant"; content: string } | null {
  const auth = getAuthSession();
  const profile = auth?.profile;
  if (!profile) return null;

  const details: string[] = [];
  if (profile.gender) details.push(`Gender: ${profile.gender}`);
  if (profile.age != null) details.push(`Age: ${profile.age}`);
  if (profile.interests?.length) details.push(`Interests: ${profile.interests.join(", ")}`);
  if (profile.about) details.push(`About: ${profile.about}`);

  if (!details.length) return null;

  return {
    role: "assistant",
    content: `User Profile Context (for personalization): ${details.join(" | ")}`,
  };
}

function buildHistoryWithProfileContext(
  baseHistory: { role: "user" | "assistant"; content: string }[]
): { role: "user" | "assistant"; content: string }[] {
  const profileContext = buildProfileContextMessage();
  if (!profileContext) return baseHistory;
  return [...baseHistory, profileContext];
}

function deriveRecommendationSummary(
  summary: string | undefined,
  productTypes: Message["productTypes"] | undefined,
  categories: Message["categories"] | undefined
): string {
  const trimmedSummary = (summary || "").trim();
  if (trimmedSummary) return trimmedSummary;

  if (productTypes && productTypes.length > 0) {
    return productTypes.map((pt) => pt.productType).join(" • ");
  }

  const categoryNames = (categories || [])
    .map((category) => (category.name || "").trim())
    .filter(Boolean);

  if (categoryNames.length > 0) return categoryNames.join(" • ");

  return "";
}

export function useChat(options?: UseChatOptions) {
  const initial = readChatState();
  const [sessions, setSessions] = useState<ChatSession[]>(deserializeSessions(initial.sessions));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initial.activeSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("understanding");
  const [error, setError] = useState<string | null>(null);
  const [pendingRecommendationSessionId, setPendingRecommendationSessionId] = useState<string | null>(
    readPendingRecommendationSessionId()
  );

  const sessionsRef = useRef(sessions);
  const activeSessionIdRef = useRef(activeSessionId);
  const unavailableSessionIdsRef = useRef<Set<string>>(new Set());
  const currentRequestIdRef = useRef<string | null>(null);
  const inFlightSessionIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  sessionsRef.current = sessions;
  activeSessionIdRef.current = activeSessionId;
  isLoadingRef.current = isLoading;

  useEffect(() => {
    persistChatState({
      sessions: serializeSessions(sessions),
      activeSessionId,
    });
  }, [sessions, activeSessionId]);

  useEffect(() => {
    persistPendingRecommendationSessionId(pendingRecommendationSessionId);
  }, [pendingRecommendationSessionId]);

  const syncSessionFromBackend = useCallback(async (sessionId: string) => {
    if (unavailableSessionIdsRef.current.has(sessionId)) return null;

    try {
      const snapshot = await getChatSession(sessionId);
      const nextSession = toChatSession(snapshot);
      setSessions((prev) => upsertSession(prev, nextSession));
      unavailableSessionIdsRef.current.delete(sessionId);
      setError(null);
      return nextSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load session.";
      if (message.toLowerCase().includes("not found")) {
        unavailableSessionIdsRef.current.add(sessionId);
        setError("This conversation is no longer available. Start a new chat.");
        setPendingRecommendationSessionId((prev) => (prev === sessionId ? null : prev));
        return null;
      }
      if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("network") || message.toLowerCase().includes("timed out")) {
        return null;
      }
      setError(message);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;
    if (isLoadingRef.current || inFlightSessionIdRef.current === activeSessionId) return;
    void syncSessionFromBackend(activeSessionId);
  }, [activeSessionId, syncSessionFromBackend]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) || null;

  // Auto-enable chat mode after recommendations
  const chatModeEnabled = Boolean(
    activeSession?.messages.some((msg) => msg.type === "recommendations") &&
    activeSession?.status === "complete"
  );

  const createNewSession = useCallback(() => {
    const id = generateSessionId();
    const session: ChatSession = {
      id,
      title: "New Chat",
      messages: [],
      status: "ready",
      createdAt: new Date(),
      awaitingClarificationAnswer: false,
    };
    setSessions((prev) => [session, ...prev.filter((item) => item.id !== id)]);
    setActiveSessionId(id);
    unavailableSessionIdsRef.current.delete(id);
    setPendingRecommendationSessionId(null);
    setError(null);
    return id;
  }, []);

  const selectSession = useCallback(
    (sessionId: string | null) => {
      setActiveSessionId(sessionId);
      if (sessionId && !unavailableSessionIdsRef.current.has(sessionId)) {
        void syncSessionFromBackend(sessionId);
      }
    },
    [syncSessionFromBackend]
  );

  // ── Submit round answers (batch question submission) ──
  const submitRoundAnswers = useCallback(
    async (answers: { question: string; answer: string }[]) => {
      if (isLoadingRef.current) return;

      const sessionId = activeSessionIdRef.current;
      if (!sessionId) return;

      const session = sessionsRef.current.find((s) => s.id === sessionId);
      if (!session) return;

      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      currentRequestIdRef.current = requestId;

      // Merge new answers with existing
      const allAnswers = [...(session.clarificationAnswers || []), ...answers];

      // Determine which round we're completing
      const completingRound = session.clarificationRound ?? 0;
      let nextRound: number;

      if (completingRound === 0) {
        // Pre-clarification answered → proceed to Round 1
        nextRound = 0; // Backend will see 1 answer and generate Round 1
      } else if (completingRound === 1 || allAnswers.length <= 3) {
        // Round 1 completed → need Round 2
        nextRound = 1;
      } else {
        // Round 2 completed → recommendations
        nextRound = 2;
      }

      // Create a user message showing the answers
      const answerSummary = answers.map((a) => a.answer).join("; ");
      const userMessage: Message = {
        id: createMessageId("user-answers"),
        role: "user",
        content: answerSummary,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                messages: appendMessageIfNotDuplicate(item.messages, userMessage),
                status: "loading",
                clarificationAnswers: allAnswers,
                awaitingClarificationAnswer: false,
              }
            : item
        )
      );

      setIsLoading(true);
      setLoadingPhase(nextRound === 2 ? "generating" : "understanding");
      inFlightSessionIdRef.current = sessionId;
      setError(null);

      try {
        const history = [
          ...session.messages.map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user" as const, content: answerSummary },
        ];
        const historyWithProfile = buildHistoryWithProfileContext(history);

        const response = await sendQuery({
          session_id: sessionId,
          user_message: session.originalQuery || answerSummary,
          conversation_history: historyWithProfile,
          clarification: allAnswers,
          clarification_round: nextRound,
          request_id: requestId,
        });

        if (currentRequestIdRef.current !== requestId) return;

        if (response.type === "followup" || response.type === "pre_clarification") {
          // More questions
          const questions = response.questions || [];
          const round = response.clarificationRound ?? (questions.length === 3 ? 1 : 2);

          const aiMessage: Message = {
            id: createMessageId("assistant-followup"),
            role: "assistant",
            content: questions.map((q) => `• ${q.question}`).join("\n"),
            type: response.type,
            questions,
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "asking",
                    clarificationRound: round,
                    clarificationAnswers: allAnswers,
                    awaitingClarificationAnswer: true,
                  }
                : item
            )
          );
        } else if (response.type === "out_of_scope") {
          const aiMessage: Message = {
            id: createMessageId("assistant-oos"),
            role: "assistant",
            content: response.message || "This query is outside my recommendation scope.",
            type: "out_of_scope",
            timestamp: new Date(),
          };
          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "ready",
                  }
                : item
            )
          );
        } else {
          // Recommendations
          setLoadingPhase("fetching");

          const contentSummary = deriveRecommendationSummary(
            response.summary,
            response.productTypes,
            response.categories,
          );

          const aiMessage: Message = {
            id: createMessageId("assistant-recommendations"),
            role: "assistant",
            content: contentSummary,
            type: "recommendations",
            summary: response.summary,
            category: response.category,
            productTypes: response.productTypes,
            categories: response.categories,
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "complete",
                    awaitingClarificationAnswer: false,
                  }
                : item
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setSessions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  messages: appendMessageIfNotDuplicate(item.messages, {
                    id: createMessageId("assistant-error"),
                    role: "assistant",
                    content: err instanceof Error ? err.message : "Something went wrong.",
                    type: "text",
                    timestamp: new Date(),
                  }),
                  status: "ready",
                  awaitingClarificationAnswer: false,
                }
              : item
          )
        );
      } finally {
        if (inFlightSessionIdRef.current === sessionId) inFlightSessionIdRef.current = null;
        if (currentRequestIdRef.current === requestId) currentRequestIdRef.current = null;
        setIsLoading(false);
      }
    },
    []
  );

  // ── Send free-text message (initial query or chat mode follow-up) ──
  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoadingRef.current) return;

      setIsLoading(true);
      setLoadingPhase("understanding");

      let sessionId = activeSessionIdRef.current;
      if (!sessionId) {
        sessionId = createNewSession();
      }

      inFlightSessionIdRef.current = sessionId;

      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      currentRequestIdRef.current = requestId;

      const userMessage: Message = {
        id: createMessageId("user"),
        role: "user",
        content,
        timestamp: new Date(),
      };

      const currentSessions = sessionsRef.current;
      const session = currentSessions.find((item) => item.id === sessionId);
      const currentMessages = session?.messages || [];

      setSessions((prev) =>
        prev.map((item) => {
          if (item.id !== sessionId) return item;
          const updated = {
            ...item,
            status: "loading" as ConversationStatus,
            messages: appendMessageIfNotDuplicate(item.messages, userMessage),
          };
          if (item.messages.length === 0) {
            updated.title = buildSessionTitle(content);
            updated.originalQuery = content;
          }
          return updated;
        })
      );

      setError(null);

      try {
        // Chat mode: if recommendations exist, use chat mode API
        const hasRecommendationContext = currentMessages.some((msg) => msg.type === "recommendations");
        if (chatModeEnabled && hasRecommendationContext) {
          const response = await sendChatModeQuery({
            session_id: sessionId,
            user_message: content,
          });

          const aiMessage: Message = {
            id: createMessageId("assistant-chatmode"),
            role: "assistant",
            content: response.message,
            type: "text",
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "complete",
                  }
                : item
            )
          );
          void syncSessionFromBackend(sessionId);
          return;
        }

        // Initial query
        const history = [
          ...currentMessages.map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user" as const, content },
        ];
        const historyWithProfile = buildHistoryWithProfileContext(history);
        const response = await sendQuery({
          session_id: sessionId,
          user_message: content,
          conversation_history: historyWithProfile,
          request_id: requestId,
        });

        if (currentRequestIdRef.current !== requestId) return;

        if (response.type === "followup" || response.type === "pre_clarification") {
          const questions = response.questions || [];
          const round = response.clarificationRound ?? (response.type === "pre_clarification" ? 0 : 1);

          const aiMessage: Message = {
            id: createMessageId("assistant-followup"),
            role: "assistant",
            content: questions.map((q) => `• ${q.question}`).join("\n"),
            type: response.type,
            questions,
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "asking",
                    originalQuery: content,
                    clarificationRound: round,
                    clarificationAnswers: [],
                    awaitingClarificationAnswer: true,
                  }
                : item
            )
          );
        } else if (response.type === "out_of_scope") {
          const aiMessage: Message = {
            id: createMessageId("assistant-oos"),
            role: "assistant",
            content: response.message || "This query is outside my recommendation scope.",
            type: "out_of_scope",
            timestamp: new Date(),
          };
          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "ready",
                  }
                : item
            )
          );
        } else {
          // Direct recommendations (CLEAR query with enough context)
          setLoadingPhase("fetching");

          const contentSummary = deriveRecommendationSummary(
            response.summary,
            response.productTypes,
            response.categories,
          );

          const aiMessage: Message = {
            id: createMessageId("assistant-recommendations"),
            role: "assistant",
            content: contentSummary,
            type: "recommendations",
            summary: response.summary,
            category: response.category,
            productTypes: response.productTypes,
            categories: response.categories,
            domain: response.domain,
            clarificationRound: response.clarificationRound,
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((item) =>
              item.id === sessionId
                ? {
                    ...item,
                    messages: appendMessageIfNotDuplicate(item.messages, aiMessage),
                    status: "complete",
                    awaitingClarificationAnswer: false,
                  }
                : item
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setSessions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  messages: appendMessageIfNotDuplicate(item.messages, {
                    id: createMessageId("assistant-error"),
                    role: "assistant",
                    content: err instanceof Error ? err.message : "Something went wrong.",
                    type: "text",
                    timestamp: new Date(),
                  }),
                  status: "ready",
                  awaitingClarificationAnswer: false,
                }
              : item
          )
        );
      } finally {
        if (inFlightSessionIdRef.current === sessionId) inFlightSessionIdRef.current = null;
        if (currentRequestIdRef.current === requestId) currentRequestIdRef.current = null;
        setIsLoading(false);
        setLoadingStage(null);
      }
    },
    [chatModeEnabled, createNewSession, syncSessionFromBackend]
  );

  const resumePendingRecommendation = useCallback(() => {
    if (!pendingRecommendationSessionId) return;
    if (!(options?.isAuthenticated?.() ?? false)) return;

    void syncSessionFromBackend(pendingRecommendationSessionId).then(() => {
      setPendingRecommendationSessionId(null);
    });
  }, [options, pendingRecommendationSessionId, syncSessionFromBackend]);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((session) => session.id !== id));
      unavailableSessionIdsRef.current.delete(id);
      if (activeSessionIdRef.current === id) {
        setActiveSessionId(null);
      }
      if (pendingRecommendationSessionId === id) {
        setPendingRecommendationSessionId(null);
      }
    },
    [pendingRecommendationSessionId]
  );

  return {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    loadingPhase,
    error,
    isDemoMode: false,
    setActiveSessionId: selectSession,
    createNewSession,
    sendMessage,
    submitRoundAnswers,
    deleteSession,
    chatModeEnabled,
    enableChatMode: () => {},  // No-op — chat mode auto-activates
    disableChatMode: () => {}, // No-op — chat mode auto-activates
    hasPendingRecommendation: Boolean(pendingRecommendationSessionId),
    resumePendingRecommendation,
  };
}
