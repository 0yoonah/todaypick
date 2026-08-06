interface FeedListStateProps {
  type: "empty" | "error";
  onRetry?: () => void;
  interestLabel?: string;
}

export default function FeedListState({
  type,
  onRetry,
  interestLabel,
}: FeedListStateProps) {
  const isError = type === "error";

  return (
    <div
      className="col-span-full rounded-lg bg-muted/50 px-6 py-12 text-center"
      role={isError ? "alert" : "status"}
    >
      <p className="font-semibold text-foreground">
        {isError
          ? "피드를 불러오지 못했어요."
          : interestLabel
            ? `${interestLabel} 분야의 피드가 아직 없어요.`
            : "아직 표시할 피드가 없어요."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {isError
          ? "잠시 후 다시 시도해주세요."
          : "새로운 콘텐츠가 들어오면 이곳에 보여드릴게요."}
      </p>
      {isError && onRetry && (
        <button
          type="button"
          className="mt-5 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={onRetry}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
