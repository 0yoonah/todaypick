import { INTERESTS, type InterestId } from "@/config/interests";
import { cn } from "@/lib/utils";

interface InterestFilterProps {
  value?: InterestId;
  onChange: (interest?: InterestId) => void;
}

export default function InterestFilter({ value, onChange }: InterestFilterProps) {
  return (
    <div
      className="mb-7 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
      role="group"
      aria-label="관심 분야 필터"
    >
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={!value}
        className={cn(
          "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          !value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:text-foreground"
        )}
      >
        전체
      </button>
      {INTERESTS.map((interest) => (
        <button
          key={interest.id}
          type="button"
          onClick={() => onChange(interest.id)}
          aria-pressed={value === interest.id}
          className={cn(
            "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            value === interest.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          {interest.label}
        </button>
      ))}
    </div>
  );
}
