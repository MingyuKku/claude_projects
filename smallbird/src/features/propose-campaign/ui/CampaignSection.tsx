import { Plus } from "lucide-react";
import { Link } from "react-router";

import { SelectableCard } from "@/entities/creator";
import { EmptyState } from "@/shared/components/empty-state";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";

import type { ProposalCampaign } from "@/entities/creator";

const CAROUSEL_OPTIONS = {
  align: "start",
  containScroll: "trimSnaps",
} as const;

// 선택 링이 뷰포트에 잘리지 않게 뷰포트를 링 폭만큼 넓힘.
const VIEWPORT_RING_ROOM_CLASS_NAME =
  "[&_[data-slot=carousel-content]]:-m-1 [&_[data-slot=carousel-content]]:p-1";

interface CampaignSectionProps {
  campaigns: ProposalCampaign[];
  selectedIdx: number | undefined;
  onSelectCampaign: (campaign: ProposalCampaign) => void;
}

export function CampaignSection({
  campaigns,
  selectedIdx,
  onSelectCampaign,
}: CampaignSectionProps) {
  const { t } = useTranslation("features/propose-campaign");

  return (
    <section className="flex min-w-0 shrink-0 flex-col gap-4">
      <h3 className="ds-text-sm-none-semibold text-foreground">
        {t("campaign.title")}
      </h3>
      {campaigns.length === 0 ? (
        <EmptyState
          type="no-list"
          title={t("campaign.empty.title")}
          description={t("campaign.empty.description")}
          className="py-0"
          action={
            <Button variant="outline" asChild>
              <Link to={ROUTES.campaignCreate}>
                <Plus />
                {t("campaign.empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <Carousel
          opts={CAROUSEL_OPTIONS}
          className={VIEWPORT_RING_ROOM_CLASS_NAME}
        >
          <CarouselContent
            role="radiogroup"
            aria-label={t("campaign.title")}
            className="-ml-(--ds-gap-3)"
          >
            {campaigns.map((campaign) => (
              <CarouselItem
                key={campaign.campaignIdx}
                className="basis-1/2 pl-(--ds-gap-3)"
              >
                <SelectableCard
                  role="radio"
                  className="h-full"
                  title={
                    <span className="block truncate">{campaign.name}</span>
                  }
                  isSelected={campaign.campaignIdx === selectedIdx}
                  onSelect={() => onSelectCampaign(campaign)}
                >
                  {campaign.typeName && (
                    <Badge
                      variant="blue"
                      size="sm"
                      className="max-tablet:leading-4"
                    >
                      {campaign.typeName}
                    </Badge>
                  )}
                </SelectableCard>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            aria-label={t("campaign.previous")}
            className="left-0 disabled:hidden"
          />
          <CarouselNext
            aria-label={t("campaign.next")}
            className="right-0 disabled:hidden"
          />
        </Carousel>
      )}
    </section>
  );
}
