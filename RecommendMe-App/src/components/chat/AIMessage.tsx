import { Message } from "@/services/api";
import RecommendationResults from "@/components/products/CategoryList";
import QuestionRound from "@/components/chat/QuestionRound";
import { saveSessionRecommendation, submitSessionFeedback } from "@/services/api";
import { Bot, AlertCircle, Copy, Check, Share2, ThumbsDown, ThumbsUp, Star, SlidersHorizontal, MessageCircleMore, BookmarkPlus } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode, useState } from "react";

interface AIMessageProps {
  message: Message;
  sessionId?: string;
  onSendMessage?: (msg: string) => void;
  onSubmitAnswers?: (answers: { question: string; answer: string }[]) => void;
}

function trimUrlForDisplay(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
    const shortenedPath = path.length > 20 ? `${path.slice(0, 20)}...` : path;
    return `${host}${shortenedPath}`;
  } catch {
    return rawUrl.length > 42 ? `${rawUrl.slice(0, 42)}...` : rawUrl;
  }
}

function renderLineWithLinks(line: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /https?:\/\/[^\s<>()]+/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let segmentIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    const rawMatch = match[0];
    const cleanedUrl = rawMatch.replace(/[),.;!?]+$/, "");
    const trailing = rawMatch.slice(cleanedUrl.length);

    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-text-${segmentIndex++}`}>
          {line.slice(lastIndex, match.index)}
        </span>
      );
    }

    nodes.push(
      <a
        key={`${keyPrefix}-link-${segmentIndex++}`}
        href={cleanedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 text-primary hover:text-primary/80 break-all"
      >
        {trimUrlForDisplay(cleanedUrl)}
      </a>
    );

    if (trailing) {
      nodes.push(
        <span key={`${keyPrefix}-trailing-${segmentIndex++}`}>
          {trailing}
        </span>
      );
    }

    lastIndex = match.index + rawMatch.length;
  }

  if (lastIndex < line.length) {
    nodes.push(
      <span key={`${keyPrefix}-text-tail`}>
        {line.slice(lastIndex)}
      </span>
    );
  }

  if (nodes.length === 0) {
    nodes.push(<span key={`${keyPrefix}-empty`}>{line}</span>);
  }

  return nodes;
}

function renderRichMessageContent(content: string): ReactNode[] {
  const lines = content.split("\n");
  const rendered: ReactNode[] = [];

  lines.forEach((line, index) => {
    rendered.push(...renderLineWithLinks(line, `line-${index}`));
    if (index < lines.length - 1) {
      rendered.push(<br key={`line-break-${index}`} />);
    }
  });

  return rendered;
}

export default function AIMessage({ message, sessionId, onSendMessage, onSubmitAnswers }: AIMessageProps) {
  const isError = message.type === "text" && message.content.toLowerCase().includes("wrong");
  const [copied, setCopied] = useState(false);
  const [feedbackState, setFeedbackState] = useState<{ sentiment?: "up" | "down"; rating?: number; saving: boolean }>({ saving: false });
  const [saveState, setSaveState] = useState<{ saving: boolean; saved: boolean }>({ saving: false, saved: false });

  // New format: product types
  const hasProductTypes = message.type === "recommendations" && (message.productTypes || []).length > 0;
  // Legacy: categories
  const hasLegacyCategories = message.type === "recommendations"
    && !hasProductTypes
    && (message.categories || []).filter((c) => (c.products || []).length > 0).length > 0;
  const isRecommendation = hasProductTypes || hasLegacyCategories;

  // Questions
  const isQuestionMessage = (message.type === "followup" || message.type === "pre_clarification")
    && message.questions
    && message.questions.length > 0;

  const handleCopy = async () => {
    let text = message.content;
    if (hasProductTypes && message.productTypes) {
      text += "\n\n";
      message.productTypes.forEach((pt) => {
        text += `\n${pt.productType}\n`;
        pt.productItems.forEach((item, j) => {
          text += `  ${j + 1}. ${item.productName} — ${item.priceInr}`;
          if (item.rating) text += ` (${item.rating}★)`;
          if (item.source) text += ` ${item.source}`;
          text += `\n     ${item.buyLink}\n`;
        });
      });
    } else if (hasLegacyCategories && message.categories) {
      text += "\n\n";
      message.categories.forEach((cat) => {
        text += `\n${cat.name}\n`;
        cat.products.forEach((p, j) => {
          text += `  ${j + 1}. ${p.title} — ${p.price} (${p.rating}★) ${p.source}\n     ${p.link}\n`;
        });
      });
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    let text = "Check out these product recommendations from RecommendMe:\n\n";
    if (hasProductTypes && message.productTypes) {
      message.productTypes.forEach((pt) => {
        text += `${pt.productType}:\n`;
        pt.productItems.forEach((item, j) => {
          text += `  ${j + 1}. ${item.productName} — ${item.priceInr}\n`;
        });
        text += "\n";
      });
    } else if (hasLegacyCategories && message.categories) {
      message.categories.forEach((cat) => {
        text += `${cat.name}:\n`;
        cat.products.forEach((p, j) => {
          text += `  ${j + 1}. ${p.title} — ${p.price}\n`;
        });
        text += "\n";
      });
    }

    if (navigator.share) {
      await navigator.share({ title: "RecommendMe Picks", text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFeedback = async (sentiment: "up" | "down", rating?: number) => {
    if (!sessionId || feedbackState.saving) return;
    setFeedbackState({ sentiment, rating, saving: true });
    try {
      await submitSessionFeedback(sessionId, { sentiment, rating });
    } finally {
      setFeedbackState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleSave = async () => {
    if (!sessionId || saveState.saving) return;
    setSaveState({ saving: true, saved: false });
    try {
      await saveSessionRecommendation(sessionId);
      setSaveState({ saving: false, saved: true });
    } catch {
      setSaveState({ saving: false, saved: false });
    }
  };

  const handleRefine = () => {
    onSendMessage?.("Refine these recommendations with stricter value-for-money and quality constraints.");
  };

  const handleAskFollowUp = () => {
    onSendMessage?.("Help me compare the top 3 options and tell me which one best matches my needs.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 py-3"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
        isError ? "bg-destructive/10" : "bg-secondary"
      }`}>
        {isError ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Bot className="h-4 w-4 text-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Message text */}
        {message.content && !isQuestionMessage && (
          <div className={`rounded-2xl rounded-tl-md px-4 py-3 ${
            isError
              ? "bg-destructive/5 border border-destructive/20 text-foreground"
              : "bg-chat-ai text-chat-ai-foreground border border-border/50"
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderRichMessageContent(message.content)}</p>
          </div>
        )}

        {/* Question round (new format) */}
        {isQuestionMessage && message.questions && onSubmitAnswers && (
          <QuestionRound
            questions={message.questions}
            roundNumber={message.type === "pre_clarification" ? 0 : 1}
            totalQuestions={5}
            answeredSoFar={0}
            onSubmitAnswers={onSubmitAnswers}
          />
        )}

        {/* If question message but no onSubmitAnswers, show as text */}
        {isQuestionMessage && message.questions && !onSubmitAnswers && (
          <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-chat-ai text-chat-ai-foreground border border-border/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderRichMessageContent(message.content)}</p>
          </div>
        )}

        {/* Recommendations */}
        {isRecommendation && (
          <>
            <RecommendationResults
              category={message.category}
              productTypes={message.productTypes}
              categories={message.categories}
            />
            <div className="flex items-center gap-2 pl-1">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Copy recommendations"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Share recommendations"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-3">
              <p className="text-xs font-semibold text-foreground">Was this recommendation helpful?</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedback("up")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${feedbackState.sentiment === "up" ? "bg-emerald-500/15 text-emerald-600" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback("down")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${feedbackState.sentiment === "down" ? "bg-red-500/15 text-red-600" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Needs work
                </button>
                <div className="ml-auto flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => handleFeedback(feedbackState.sentiment || "up", value)}
                      className="p-1"
                      aria-label={`Rate ${value} stars`}
                    >
                      <Star className={`h-3.5 w-3.5 ${feedbackState.rating && value <= feedbackState.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRefine}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Refine Results
                </button>
                <button
                  type="button"
                  onClick={handleAskFollowUp}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  Ask Follow-up
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveState.saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  {saveState.saved ? "Saved" : "Save Recommendation"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
