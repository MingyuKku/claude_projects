import { CreatorFullScreen } from "@/entities/creator";

import { RecommendAssistant } from "./RecommendAssistant";

interface RecommendAssistantFullScreenProps {
  userName: string;
  onClose: () => void;
}

// TAB·MO에서 둥근 버튼으로 여는 화면.
export function RecommendAssistantFullScreen(
  props: RecommendAssistantFullScreenProps,
) {
  return (
    <CreatorFullScreen>
      <div className="flex h-full px-(--ds-p-5) pt-(--ds-p-0_5) pb-(--ds-p-5)">
        <RecommendAssistant {...props} className="flex-1" />
      </div>
    </CreatorFullScreen>
  );
}
