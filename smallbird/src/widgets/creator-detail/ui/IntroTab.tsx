import {
  Baby,
  Blend,
  BriefcaseBusiness,
  PawPrint,
  PersonStanding,
  Smile,
} from "lucide-react";

import {
  LoadError,
  useCreatorIntro,
  useCreatorTerms,
} from "@/entities/creator";
import { InfoCard } from "@/shared/components/cards";
import { KoreaMap } from "@/shared/components/korea-map";
import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";

import { getKoreaRegion } from "../lib/korea-region";
import { MetricCard } from "./MetricCard";
import { TabLoading } from "./TabStatus";

import type { CreatorTarget } from "@/entities/creator";
import type { ReactNode } from "react";

interface IntroTabProps {
  target: CreatorTarget;
}

function ProfileItem({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: (string | false | null)[];
}) {
  const texts = lines.filter((line): line is string => Boolean(line));

  return (
    <InfoCard icon={icon} title={title} interactive={false} className="min-w-0">
      {(texts.length > 0 ? texts : [EMPTY_VALUE]).map((line) => (
        <p key={line} className="ds-text-sm-5-normal wrap-anywhere">
          {line}
        </p>
      ))}
    </InfoCard>
  );
}

function TagCard({ title, tags }: { title: string; tags: string[] }) {
  return (
    <MetricCard title={title}>
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge variant="blue" size="md">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ds-text-sm-5-normal text-foreground">{EMPTY_VALUE}</p>
      )}
    </MetricCard>
  );
}

export function IntroTab({ target }: IntroTabProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { term } = useCreatorTerms();
  const { intro, isLoading, isError, reload } = useCreatorIntro(target);

  if (isError) return <LoadError onClickRetry={() => void reload()} />;
  if (isLoading || !intro) return <TabLoading className="h-98 w-full" />;

  const { label: areaLabel, region } = getKoreaRegion(intro);

  function joinJobs(key: "intro.currentJob" | "intro.pastJob", jobs: string[]) {
    return jobs.length > 0 && t(key, { value: jobs.join(", ") });
  }

  function getChoiceText(value: boolean | null, yes: string, no: string) {
    if (value === null) return null;
    return value ? yes : no;
  }

  return (
    <div className="flex flex-col gap-3 tablet:gap-4">
      <div className="grid grid-cols-1 gap-3 tablet:gap-4 desktop:grid-cols-[328fr_608fr]">
        <MetricCard title={t("intro.region")}>
          <div className="flex min-h-83.5 flex-1 items-center justify-center p-4">
            <KoreaMap
              label={t("intro.map")}
              selected={region}
              selectedLabel={areaLabel}
              className="w-66 max-w-full"
            />
          </div>
        </MetricCard>
        <MetricCard title={t("intro.profile")}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 *:min-h-27.5 tablet:gap-y-3 desktop:*:nth-last-[-n+2]:min-h-22.5">
            <ProfileItem
              icon={<BriefcaseBusiness aria-hidden />}
              title={t("intro.job")}
              lines={[
                joinJobs("intro.currentJob", intro.currentJobs),
                joinJobs("intro.pastJob", intro.pastJobs),
              ]}
            />
            <ProfileItem
              icon={<PersonStanding aria-hidden />}
              title={t("intro.genderAge")}
              lines={[
                intro.gender,
                [intro.age, intro.ageGroup].filter(Boolean).join(" "),
              ]}
            />
            <ProfileItem
              icon={<Blend aria-hidden />}
              title={t("intro.marriage")}
              lines={[
                getChoiceText(
                  intro.isMarried,
                  t("intro.married"),
                  t("intro.single"),
                ),
              ]}
            />
            <ProfileItem
              icon={<Baby aria-hidden />}
              title={t("intro.children")}
              lines={[
                getChoiceText(
                  intro.hasChildren,
                  t("intro.hasChildren"),
                  t("intro.noChildren"),
                ),
              ]}
            />
            <ProfileItem
              icon={<PawPrint aria-hidden />}
              title={t("intro.pet")}
              lines={[intro.pet]}
            />
            <ProfileItem
              icon={<Smile aria-hidden />}
              title={t("intro.skinType")}
              lines={[intro.skinType]}
            />
          </div>
        </MetricCard>
      </div>
      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 tablet:gap-4">
        <TagCard title={term("hopeProducts")} tags={intro.hopeProducts} />
        <TagCard title={t("intro.interests")} tags={intro.interests} />
      </div>
    </div>
  );
}
