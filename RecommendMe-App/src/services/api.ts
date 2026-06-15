

import { getApiUrl, getEnvironmentConfig, logEnvironmentInfo } from '@/config/environments';

// Log environment info on module load (development only)
if (import.meta.env.DEV) {
  logEnvironmentInfo();
}

const API_BASE_URL = getApiUrl();
const ENVIRONMENT_CONFIG = getEnvironmentConfig();
const parsedTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT || String(ENVIRONMENT_CONFIG.apiTimeout), 10);
const API_TIMEOUT = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : ENVIRONMENT_CONFIG.apiTimeout;
const DEBUG_API = import.meta.env.VITE_DEBUG_API === 'true' || ENVIRONMENT_CONFIG.debugApi;

// ── Backend Response Types ──────────────────────────────────────────────────

interface BackendProductItem {
  product_name?: string;
  image_url?: string | null;
  price_inr?: string | null;
  short_description?: string | null;
  buy_link?: string | null;
  rating?: number | null;
  brand?: string | null;
  reviews_count?: number | null;
  delivery_info?: string | null;
  availability?: string | null;
  source?: string | null;
}

interface BackendProductType {
  product_type?: string;
  description?: string;
  product_items?: BackendProductItem[];
  serp_error?: boolean;
  serp_error_message?: string | null;
}

interface BackendQuestionOption {
  question?: string;
  options?: string[];
}

interface BackendQueryResponse {
  status?: "clarification_needed" | "recommendations" | "out_of_scope" | "pre_clarification" | "error";
  message?: string;
  summary?: string;
  category?: string;
  product_types?: BackendProductType[];
  questions?: BackendQuestionOption[];
  clarification_round?: number;
  asked_questions?: number;
  max_total_questions?: number;
  session_id?: string;
  // Legacy fields
  categories?: BackendCategory[];
  type?: "followup" | "recommendations";
}

// Legacy backend types for backward compat
interface BackendCategory {
  category?: string;
  tagline?: string;
  why_needed?: string;
  products?: BackendLegacyProduct[];
}

interface BackendLegacyProduct {
  title?: string;
  price?: string | null;
  rating?: number | null;
  reviews?: number | null;
  source?: string | null;
  url?: string;
  image_url?: string | null;
  explanation?: string | null;
  label?: string | null;
  brand?: string | null;
  delivery_info?: string | null;
  availability?: string | null;
}

interface BackendAuthUser {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  created_at: string;
}

interface BackendLoginResponse {
  message: string;
  token: string;
  user: BackendAuthUser;
  session_id?: string | null;
  profile?: BackendProfile;
}

interface BackendSignupResponse {
  message: string;
  token: string;
  user: BackendAuthUser;
  session_id?: string | null;
  profile?: BackendProfile;
}

interface BackendAvatarOption {
  id: string;
  gender: string;
  url: string;
}

interface BackendProfile {
  user_id: string;
  username: string;
  email: string;
  gender: string;
  age?: number | null;
  interests?: string[];
  about: string;
  avatar_url: string;
  avatar_file_path?: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendProfileResponse {
  profile: BackendProfile;
}

interface BackendAvatarResponse {
  avatars: BackendAvatarOption[];
}

interface BackendPasswordResetResponse {
  message: string;
  reset_token?: string | null;
}

interface BackendChatMessageState {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "followup" | "recommendations" | "text" | "pre_clarification" | "out_of_scope";
  questions?: BackendQuestionOption[];
  summary?: string;
  category?: string;
  product_types?: BackendProductType[];
  // Legacy
  categories?: BackendCategory[];
  timestamp: string;
}

interface BackendChatSessionState {
  session_id: string;
  status: "new" | "clarification_needed" | "recommendations";
  title: string;
  user_id?: string | null;
  messages: BackendChatMessageState[];
  created_at: string;
  updated_at: string;
  original_query?: string | null;
  pending_questions?: BackendQuestionOption[] | string[] | null;
  clarification_round?: number | null;
  current_question_index?: number | null;
  clarification_answers?: { question: string; answer: string }[] | null;
  latest_response?: BackendQueryResponse | null;
  feedback_count?: number;
  saved_count?: number;
}

interface BackendChatModeResponse {
  session_id: string;
  message: string;
}

interface BackendSessionFeedbackResponse {
  session_id: string;
  message: string;
  feedback_count: number;
}

interface BackendSessionSaveResponse {
  session_id: string;
  message: string;
  saved_count: number;
}

// ── Frontend Types ──────────────────────────────────────────────────────────

export interface ProductItem {
  productName: string;
  imageUrl: string;
  priceInr: string;
  shortDescription: string;
  buyLink: string;
  rating: number | null;
  brand: string | null;
  reviewsCount: number | null;
  deliveryInfo: string | null;
  availability: string | null;
  source: string | null;
}

export interface ProductType {
  productType: string;
  description: string;
  productItems: ProductItem[];
  serpError: boolean;
  serpErrorMessage: string | null;
}

export interface QuestionOption {
  question: string;
  options: string[];
}

// Legacy types (kept for backward compat)
export interface Category {
  /** Display name for the product type section heading. */
  name: string;
  tagline?: string;
  /** Unique context-aware description for this product type (Flow.md §58-80). */
  why_needed: string;
  budget_allocation: string;
  products: Product[];
  expert_tip?: string;
  /** True when SERP fetch failed for this product type — show failure banner. */
  serp_failed?: boolean;
}

export interface Product {
  title: string;
  price: string;
  rating: number;
  reviews: string;
  source: string;
  link: string;
  thumbnail: string;
  reason: string;
  label?: string;
  brand?: string;
  delivery_info?: string;
  availability?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "followup" | "recommendations" | "text" | "pre_clarification" | "out_of_scope";
  questions?: QuestionOption[];
  summary?: string;
  category?: string;
  productTypes?: ProductType[];
  // Legacy
  categories?: Category[];
  timestamp: Date;
}

export interface QueryRequest {
  session_id: string;
  user_message: string;
  conversation_history: { role: string; content: string }[];
  clarification?: { question: string; answer: string }[];
  clarification_round?: number;
  request_id?: string;
}

export interface QueryResponse {
  type: "followup" | "recommendations" | "out_of_scope" | "pre_clarification" | "error";
  questions?: QuestionOption[];
  summary?: string;
  category?: string;
  productTypes?: ProductType[];
  message?: string;
  clarificationRound?: number;
  askedQuestions?: number;
  maxTotalQuestions?: number;
  // Legacy
  categories?: Category[];
  /** Domain detected by the backend intent engine. */
  domain?: string;
  /** Clarification round number (1-indexed). */
  clarificationRound?: number;
}

export interface AuthUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface AvatarOption {
  id: string;
  gender: string;
  url: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  gender: string;
  age?: number | null;
  interests: string[];
  about: string;
  avatarUrl: string;
  avatarFilePath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  gender?: string;
  age?: number | null;
  interests?: string[];
  about?: string;
  avatar_url?: string;
  avatar_file_path?: string | null;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}

export interface LoginRequest {
  identifier?: string | null;
  password?: string | null;
  session_id?: string;
}

export interface SignupRequest {
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  password: string;
  session_id?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
  profile?: UserProfile;
}

export interface SignupResponse {
  message: string;
  token: string;
  user: AuthUser;
  profile?: UserProfile;
}

export interface ChatSessionState {
  sessionId: string;
  status: "new" | "clarification_needed" | "recommendations";
  title: string;
  userId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  originalQuery?: string;
  pendingQuestions?: QuestionOption[];
  clarificationRound?: number;
  currentQuestionIndex?: number;
  clarificationAnswers?: { question: string; answer: string }[];
  latestResponse?: QueryResponse;
  feedbackCount?: number;
  savedCount?: number;
}

export interface ChatModeRequest {
  session_id: string;
  user_message: string;
}

export interface ChatModeResponse {
  sessionId: string;
  message: string;
}

export interface SessionFeedbackRequest {
  sentiment: "up" | "down";
  rating?: number;
  comment?: string;
}

export interface SessionFeedbackResponse {
  sessionId: string;
  message: string;
  feedbackCount: number;
}

export interface SessionSaveRequest {
  note?: string;
}

export interface SessionSaveResponse {
  sessionId: string;
  message: string;
  savedCount: number;
}

// ── Normalization Helpers ───────────────────────────────────────────────────

function normalizeProfile(profile: BackendProfile): UserProfile {
  return {
    userId: profile.user_id,
    username: profile.username,
    email: profile.email,
    gender: profile.gender,
    age: profile.age ?? null,
    interests: profile.interests || [],
    about: profile.about,
    avatarUrl: profile.avatar_url,
    avatarFilePath: profile.avatar_file_path || undefined,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

function normalizeAuthUser(user: BackendAuthUser): AuthUser {
  return {
    userId: user.user_id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email || undefined,
    phone: user.phone || undefined,
    createdAt: user.created_at,
  };
}

function normalizePriceToInr(rawPrice: string | null | undefined): string {
  const value = (rawPrice || "").trim();
  if (!value) return "";

  if (/price unavailable/i.test(value)) return "Price unavailable";

  const numericMatch = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (numericMatch) {
    const amount = Number(numericMatch[0]);
    if (Number.isFinite(amount)) {
      const formatted = amount.toLocaleString("en-IN", {
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      });
      return `₹${formatted}`;
    }
  }

  return value
    .replace(/\$/g, "₹")
    .replace(/\bUSD\b/gi, "INR")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProductItem(item: BackendProductItem): ProductItem {
  return {
    productName: item.product_name || "Product",
    imageUrl: item.image_url || "",
    priceInr: normalizePriceToInr(item.price_inr),
    shortDescription: item.short_description || "",
    buyLink: item.buy_link || "#",
    rating: typeof item.rating === "number" ? item.rating : null,
    brand: item.brand || null,
    reviewsCount: typeof item.reviews_count === "number" ? item.reviews_count : null,
    deliveryInfo: item.delivery_info || null,
    availability: item.availability || null,
    source: item.source || null,
  };
}

function normalizeProductType(pt: BackendProductType): ProductType {
  return {
    productType: pt.product_type || "Recommended Products",
    description: pt.description || "",
    productItems: (pt.product_items || []).map(normalizeProductItem),
    serpError: pt.serp_error || false,
    serpErrorMessage: pt.serp_error_message || null,
  };
}

function normalizeQuestionOption(q: BackendQuestionOption | string): QuestionOption {
  if (typeof q === "string") {
    return { question: q.trim(), options: [] };
  }
  return {
    question: (q.question || "").trim(),
    options: (q.options || []).map((o) => String(o).trim()).filter(Boolean),
  };
}

// Legacy normalization for backward compat
export function normalizeBackendCategory(category: BackendCategory): Category {
  // Support both new schema (product_type/description/product_items)
  // and old schema (category/why_needed/products)
  const name =
    category.product_type || category.category || "Recommended products";
  const whyNeeded =
    category.description ||
    category.why_needed ||
    "Selected by the recommendation engine based on your request.";
  const rawProducts =
    category.product_items || category.products || [];

  return {
    name: category.category || "Recommended products",
    tagline: category.tagline || "",
    why_needed: category.why_needed || "",
    budget_allocation: "",
    serp_failed: category.serp_failed ?? false,
    products: rawProducts.map((product) => ({
      title: product.title || "Product",
      price: normalizePriceToInr(product.price || "Price unavailable"),
      rating: typeof product.rating === "number" ? product.rating : 0,
      reviews: product.reviews != null ? String(product.reviews) : "",
      source: product.source || "Web",
      link: product.url || "#",
      thumbnail: product.image_url || "",
      reason: product.explanation || "",
      label: product.label || undefined,
      brand: product.brand || undefined,
    })),
  };
}

function normalizeQueryResponse(payload: BackendQueryResponse): QueryResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid response format: expected object');
  }

  const status = payload.status;

  // OUT_OF_SCOPE
  if (status === "out_of_scope") {
    return {
      type: "out_of_scope",
      message: payload.message || "This query is outside the recommendation scope.",
    };
  }

  // PRE_CLARIFICATION (Step 2.5)
  if (status === "pre_clarification") {
    const questions = (payload.questions || []).map(normalizeQuestionOption);
    return {
      type: "pre_clarification",
      questions: questions.length > 0 ? questions : [{ question: payload.message || "", options: [] }],
      message: payload.message,
      clarificationRound: 0,
      askedQuestions: 0,
      maxTotalQuestions: payload.max_total_questions || 5,
    };
  }

  // ERROR
  if (status === "error") {
    return {
      type: "error",
      message: payload.message || "Something went wrong.",
    };
  }

  // CLARIFICATION NEEDED (Round 1 or Round 2)
  if (status === "clarification_needed") {
    const questions = (payload.questions || []).map(normalizeQuestionOption);

    // Fallback: if no structured questions, try message
    if (questions.length === 0 && payload.message) {
      questions.push({ question: payload.message, options: [] });
    }

    if (questions.length === 0) {
      throw new Error("Invalid clarification response: missing questions.");
    }

    return {
      type: "followup",
      questions,
      clarificationRound: payload.clarification_round,
      askedQuestions: payload.asked_questions,
      maxTotalQuestions: payload.max_total_questions || 5,
    };
  }

  // RECOMMENDATIONS
  if (status === "recommendations") {
    // New format: product_types
    if (payload.product_types && payload.product_types.length > 0) {
      return {
        type: "recommendations",
        summary: payload.summary,
        category: payload.category,
        productTypes: payload.product_types.map(normalizeProductType),
      };
    }

    // Legacy format: categories
    if (payload.categories && payload.categories.length > 0) {
      return {
        type: "recommendations",
        summary: payload.summary,
        categories: payload.categories.map(normalizeBackendCategory),
      };
    }

    console.warn('[API] Recommendations status but no product_types or categories');
    return {
      type: "recommendations",
      summary: payload.summary,
      category: payload.category,
      productTypes: [],
    };
  }

  // Legacy type-based responses
  if (payload.type === "followup") {
    const questions = (payload.questions || []).map(normalizeQuestionOption);
    if (questions.length === 0) {
      throw new Error("Invalid follow-up response: missing questions.");
    }
    return {
      type: "followup",
      questions,
      clarificationRound: payload.clarification_round,
      askedQuestions: payload.asked_questions,
      maxTotalQuestions: payload.max_total_questions || 5,
    };
  }

  if (payload.type === "recommendations") {
    if (payload.product_types) {
      return {
        type: "recommendations",
        summary: payload.summary,
        category: payload.category,
        productTypes: payload.product_types.map(normalizeProductType),
      };
    }
    return {
      type: "recommendations",
      summary: payload.summary,
      categories: (payload.categories || []).map(normalizeBackendCategory),
    };
  }

  throw new Error(`Unexpected response format from server (status: ${payload.status}, type: ${payload.type}).`);
}

function normalizeChatSessionState(payload: BackendChatSessionState): ChatSessionState {
  return {
    sessionId: payload.session_id,
    status: payload.status,
    title: payload.title,
    userId: payload.user_id || undefined,
    messages: (payload.messages || []).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      type: message.type,
      questions: message.questions?.map(normalizeQuestionOption),
      summary: message.summary,
      category: message.category,
      productTypes: message.product_types?.map(normalizeProductType),
      categories: message.categories?.map(normalizeBackendCategory),
      timestamp: new Date(message.timestamp),
    })),
    createdAt: new Date(payload.created_at),
    updatedAt: new Date(payload.updated_at),
    originalQuery: payload.original_query || undefined,
    pendingQuestions: payload.pending_questions?.map(normalizeQuestionOption),
    clarificationRound: payload.clarification_round ?? undefined,
    currentQuestionIndex: payload.current_question_index ?? undefined,
    clarificationAnswers: payload.clarification_answers || undefined,
    latestResponse: payload.latest_response ? normalizeQueryResponse(payload.latest_response) : undefined,
    feedbackCount: payload.feedback_count,
    savedCount: payload.saved_count,
  };
}

// ── HTTP Utilities ──────────────────────────────────────────────────────────

async function requestJson<TResponse>(
  path: string,
  options: RequestInit,
): Promise<TResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as { detail?: string; message?: string }).detail || (payload as { detail?: string; message?: string }).message || `Server error: ${response.status}`;
    throw new Error(message);
  }
  return payload as TResponse;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId: number | null = null;
    try {
      if (DEBUG_API) {
        console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1}: ${options.method} ${url}`);
      }

      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new Error("Request timed out. Please try again.");
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      if (DEBUG_API) {
        console.log(`[API] Attempt ${attempt + 1} failed:`, lastError.message);
      }

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function sendQuery(request: QueryRequest): Promise<QueryResponse> {
  const requestBody = JSON.stringify(request);
  const url = `${API_BASE_URL}/query`;

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });

    const payload: BackendQueryResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        payload.message ||
        (payload as { detail?: string }).detail ||
        `Server error: ${response.status} ${response.statusText}`;

      console.error('[API] Error response:', {
        status: response.status,
        url: API_BASE_URL,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }

    if (DEBUG_API) {
      console.log('[API] Query successful:', { status: payload.status, type: payload.type });
    }

    return normalizeQueryResponse(payload);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Request failed:', {
      url: API_BASE_URL,
      error: errorMsg,
    });
    throw error;
  }
}

export async function checkHealth(): Promise<{ status: string; ollama: string; openai: string }> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/health`, { method: "GET" });
    return response.json();
  } catch (error) {
    console.error('[API] Health check failed:', error);
    throw error;
  }
}

export function generateSessionId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function postJson<TPayload extends object, TResponse>(
  path: string,
  body: TPayload
): Promise<TResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload as { detail?: string; message?: string }).detail ||
      (payload as { detail?: string; message?: string }).message ||
      `Server error: ${response.status}`;
    throw new Error(message);
  }

  return payload as TResponse;
}

export async function loginUser(request: LoginRequest): Promise<LoginResponse> {
  const payload = await postJson<LoginRequest, BackendLoginResponse>("/auth/login", request);
  return {
    message: payload.message,
    token: payload.token,
    user: normalizeAuthUser(payload.user),
    profile: payload.profile ? normalizeProfile(payload.profile) : undefined,
  };
}

export async function signupUser(request: SignupRequest): Promise<SignupResponse> {
  const payload = await postJson<SignupRequest, BackendSignupResponse>("/auth/signup", request);
  return {
    message: payload.message,
    token: payload.token,
    user: normalizeAuthUser(payload.user),
    profile: payload.profile ? normalizeProfile(payload.profile) : undefined,
  };
}

export async function getProfile(token: string): Promise<UserProfile> {
  const payload = await requestJson<BackendProfileResponse>("/profile", {
    method: "GET",
    headers: authHeaders(token),
  });
  return normalizeProfile(payload.profile);
}

export async function updateProfile(token: string, request: ProfileUpdateRequest): Promise<UserProfile> {
  const payload = await requestJson<BackendProfileResponse>("/profile/update", {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return normalizeProfile(payload.profile);
}

export async function createProfile(token: string, request: ProfileUpdateRequest): Promise<UserProfile> {
  const payload = await requestJson<BackendProfileResponse>("/profile", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return normalizeProfile(payload.profile);
}

export async function getAvatarOptions(): Promise<AvatarOption[]> {
  const payload = await requestJson<BackendAvatarResponse>("/profile/avatars", {
    method: "GET",
  });
  return payload.avatars;
}

export async function uploadAvatar(token: string, file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("image", file);
  const payload = await requestJson<BackendProfileResponse>("/profile/avatar/upload", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return normalizeProfile(payload.profile);
}

export async function requestPasswordReset(request: ForgotPasswordRequest): Promise<BackendPasswordResetResponse> {
  return requestJson<BackendPasswordResetResponse>("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function resetPassword(request: ResetPasswordRequest): Promise<BackendPasswordResetResponse> {
  return requestJson<BackendPasswordResetResponse>("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function getChatSession(sessionId: string): Promise<ChatSessionState> {
  const response = await fetchWithRetry(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "GET",
  });

  const payload: BackendChatSessionState = await response.json().catch(() => ({} as BackendChatSessionState));

  if (!response.ok) {
    const message = (payload as { detail?: string }).detail || `Server error: ${response.status}`;
    throw new Error(message);
  }

  return normalizeChatSessionState(payload);
}

export async function sendChatModeQuery(request: ChatModeRequest): Promise<ChatModeResponse> {
  const payload = await postJson<ChatModeRequest, BackendChatModeResponse>("/chat/mode", request);
  return {
    sessionId: payload.session_id,
    message: payload.message,
  };
}

export async function submitSessionFeedback(
  sessionId: string,
  request: SessionFeedbackRequest,
): Promise<SessionFeedbackResponse> {
  const payload = await postJson<SessionFeedbackRequest, BackendSessionFeedbackResponse>(
    `/sessions/${sessionId}/feedback`,
    request,
  );
  return {
    sessionId: payload.session_id,
    message: payload.message,
    feedbackCount: payload.feedback_count,
  };
}

export async function saveSessionRecommendation(
  sessionId: string,
  request: SessionSaveRequest = {},
): Promise<SessionSaveResponse> {
  const payload = await postJson<SessionSaveRequest, BackendSessionSaveResponse>(
    `/sessions/${sessionId}/save`,
    request,
  );
  return {
    sessionId: payload.session_id,
    message: payload.message,
    savedCount: payload.saved_count,
  };
}
