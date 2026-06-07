import axios from "axios";

const chatbotBaseUrl =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL || "http://localhost:8000";

const chatbotClient = axios.create({
  baseURL: chatbotBaseUrl.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ChatbotUser {
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  session_id: string;
  user: ChatbotUser;
  history?: ChatHistoryMessage[];
  current_path?: string;
}

export interface RetrievedChunk {
  id: string;
  source: string;
  title: string;
  content: string;
  score: number;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  retrieved_chunks: RetrievedChunk[];
}

export interface FeedbackRequest {
  feedback: string;
  user: ChatbotUser;
  current_path?: string;
}

export interface FeedbackResponse {
  interpretation: string;
}

export function getChatbotErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function sendChatMessage(payload: ChatRequest) {
  const { data } = await chatbotClient.post<ChatResponse>("/api/chat", payload);
  return data;
}

export async function submitFeedback(payload: FeedbackRequest) {
  const { data } = await chatbotClient.post<FeedbackResponse>(
    "/api/feedback",
    payload
  );
  return data;
}
