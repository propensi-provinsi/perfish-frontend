"use client";

import FloatingFeedbackBot from "@/components/chatbot/FloatingFeedbackBot";
import FloatingNavBot from "@/components/chatbot/FloatingNavBot";
import { useAuth } from "@/context/AuthContext";

interface ChatbotWidgetsProps {
  sidebarCollapsed: boolean;
}

export default function ChatbotWidgets({ sidebarCollapsed }: ChatbotWidgetsProps) {
  const { user } = useAuth();

  if (!user) return null;

  const chatbotUser = {
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return (
    <>
      <FloatingFeedbackBot
        user={chatbotUser}
        leftClassName={
          sidebarCollapsed ? "left-4 md:left-20" : "left-4 md:left-[17rem]"
        }
      />
      <FloatingNavBot user={chatbotUser} />
    </>
  );
}
