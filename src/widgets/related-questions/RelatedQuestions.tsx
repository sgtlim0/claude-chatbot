import type { RelatedQuestion } from "@/entities/message/model";
import { ArrowRight } from "lucide-react";

interface RelatedQuestionsProps {
  questions: RelatedQuestion[];
  onQuestionClick: (text: string) => void;
}

export function RelatedQuestions({ questions, onQuestionClick }: RelatedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border-light">
      <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
        Related
      </h4>
      <div className="flex flex-col gap-1">
        {questions.map((q, idx) => (
          <button
            key={idx}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-border rounded-xl text-[13px] text-text-primary text-left cursor-pointer hover:bg-bg-secondary hover:border-text-muted/30 transition-all group"
            onClick={() => onQuestionClick(q.text)}
            aria-label={`Ask: ${q.text}`}
          >
            <span className="flex-1">{q.text}</span>
            <ArrowRight size={13} className="text-text-muted group-hover:text-accent transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
