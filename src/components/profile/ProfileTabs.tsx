import { FiBookmark, FiTarget, FiBarChart, FiClock, FiEdit3 } from "react-icons/fi";
import { PROFILE_TAB, ProfileTabType } from "@/config/constants";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  handleChangeTab: (tab: ProfileTabType) => void;
}

export default function ProfileTabs({
  activeTab,
  handleChangeTab,
}: ProfileTabsProps) {
  const tabs = [
    {
      id: PROFILE_TAB.SCRAPED_FEEDS,
      label: "스크랩한 피드",
      icon: FiBookmark,
    },
    {
      id: PROFILE_TAB.READING_HISTORY,
      label: "읽은 글",
      icon: FiClock,
    },
    {
      id: PROFILE_TAB.QUIZ_RECORDS,
      label: "퀴즈 기록",
      icon: FiTarget,
    },
    {
      id: PROFILE_TAB.SCRAPED_QUOTES,
      label: "스크랩한 명언",
      icon: FiBookmark,
    },
    {
      id: PROFILE_TAB.WRITING,
      label: "내가 쓴 글",
      icon: FiEdit3,
    },
    {
      id: PROFILE_TAB.LEARNING_STATISTICS,
      label: "학습 통계",
      icon: FiBarChart,
    },
  ];

  return (
    <div
      className="mb-7 mt-10 flex gap-6 overflow-x-auto overflow-y-hidden border-b border-border pr-5 sm:pr-0"
      role="tablist"
      aria-label="프로필 메뉴"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleChangeTab(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
