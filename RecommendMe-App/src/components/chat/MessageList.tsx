import { useRef, useEffect } from "react";
import { Message } from "@/services/api";
import UserMessage from "@/components/chat/UserMessage";
import AIMessage from "@/components/chat/AIMessage";
import LoadingIndicator from "@/components/chat/LoadingIndicator";
import { Plus } from "lucide-react";

interface MessageListProps {
  sessionId?: string | null;
  messages: Message[];
  isLoading: boolean;
  loadingPhase?: "understanding" | "generating" | "fetching";
  onNewChat?: () => void;
  onSendMessage?: (msg: string) => void;
  onSubmitAnswers?: (answers: { question: string; answer: string }[]) => void;
  chatModeEnabled?: boolean;
  onEnableChatMode?: () => void;
  onDisableChatMode?: () => void;
}

export default function MessageList({
  sessionId,
  messages,
  isLoading,
  loadingPhase,
  onNewChat,
  onSendMessage,
  onSubmitAnswers,
  chatModeEnabled,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Check if the last message is a recommendation (conversation complete)
  const lastMsg = messages[messages.length - 1];
  const showNewSearch = lastMsg?.type === "recommendations" && !isLoading;

  // Determine which message is the latest question (for interactive answer submission)
  const lastQuestionIndex = messages.reduceRight((found, msg, i) => {
    if (found >= 0) return found;
    if ((msg.type === "followup" || msg.type === "pre_clarification") && msg.questions?.length) {
      return i;
    }
    return found;
  }, -1);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-8 sm:pt-10 pb-5 space-y-1">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AIMessage
              key={message.id}
              message={message}
              sessionId={sessionId || undefined}
              onSendMessage={onSendMessage}
              onSubmitAnswers={
                index === lastQuestionIndex && onSubmitAnswers
                  ? onSubmitAnswers
                  : undefined
              }
            />
          )
        )}
        {isLoading && <LoadingIndicator phase={loadingPhase} />}

        {/* Chat mode auto-activates after recommendations — show a subtle indicator */}
        {showNewSearch && chatModeEnabled && (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Chat mode is active.</span>{" "}
              Ask follow-up questions about these recommendations below.
            </p>
          </div>
        )}

        {/* New search prompt after recommendations */}
        {showNewSearch && onNewChat && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={onNewChat}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4" />
              Start a new search
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
