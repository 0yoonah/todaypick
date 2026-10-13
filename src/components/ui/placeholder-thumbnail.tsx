import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import type { PlaceholderTone } from "@/utils/thumbnailUtils";

interface PlaceholderThumbnailProps {
  title: string;
  caption?: string;
  icon: IconType;
  tone: PlaceholderTone;
  className?: string;
}

/**
 * 이미지가 없는 카드에 외부 사진 대신 쓰는 썸네일.
 * 카드 제목과 같은 정보를 되풀이하므로 보조기기에는 숨긴다.
 */
export function PlaceholderThumbnail({
  title,
  caption,
  icon: Icon,
  tone,
  className,
}: PlaceholderThumbnailProps) {
  return (
    <div
      aria-hidden
      data-testid="placeholder-thumbnail"
      className={cn(
        "absolute inset-0 flex flex-col justify-between overflow-hidden p-5",
        tone,
        className
      )}
    >
      {/* 카드 오른쪽 위의 인용·스크랩 버튼과 겹치지 않게 비워 둔다. */}
      <div className="min-w-0 pr-24 sm:pr-20">
        <p className="truncate text-xl font-bold tracking-[-0.02em]">{title}</p>
        {caption && (
          <p className="mt-1 truncate text-sm font-medium opacity-80">
            {caption}
          </p>
        )}
      </div>
      <Icon className="size-10 self-end opacity-30" />
    </div>
  );
}
