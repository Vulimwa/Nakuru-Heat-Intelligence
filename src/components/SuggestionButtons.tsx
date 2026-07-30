import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SuggestionButtonsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const STARTER_QUESTIONS = [
  'What was the mean SIUHI in 2026?',
  'How did Very High heat area change from 2021 to 2026?',
  'How many people were exposed to Very High heat in 2026?',
  'Which land-cover type was hottest in 2026?',
  'What does the Lake Nakuru cooling analysis show?',
  'What urban cooling interventions are recommended?',
  'What guides exist for urban heat management?',
];

export const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({
  onSelectQuestion,
  disabled,
}) => {
  return (
    <div className="my-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
        <span>Recommended Starter Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STARTER_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            disabled={disabled}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 text-left focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
