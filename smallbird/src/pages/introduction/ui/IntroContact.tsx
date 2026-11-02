import { useState, type ChangeEvent, type SubmitEvent } from "react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import CONTACT_BG from "../assets/contact-bg.svg";
import { REVEAL } from "../lib/tw";
import { contact } from "../model/data";

interface Props {
  className?: string;
}

type FormState = Record<string, string>;

interface Status {
  type: "success" | "error";
  /** 번역 키 `contact.{message}`. */
  message: "unavailable";
}

// 디자인에서 입력창의 테두리와 포커스 링을 없앴으므로 shadcn 의 Input/Textarea 를 쓰면 기본 테두리·링·높이를
// 모두 되돌려야 하고, 어차피 네이티브 요소 한 겹일 뿐. 그래서 유틸리티를 네이티브 요소에 바로 붙임.
const INPUT =
  "h-12 rounded-[4px] border-0 bg-white px-4 py-3 text-base leading-6 font-medium text-[#222] placeholder:text-[#adb5bd] focus:outline-none focus-visible:outline-none";

function createEmptyForm(): FormState {
  return Object.fromEntries(contact.fields.map((field) => [field.key, ""]));
}

export function IntroContact({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [isAgreed, setIsAgreed] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  // 필수(*) 항목을 모두 채우기 전까지 제출 버튼은 비활성.
  // 형식 오류(이메일 '@', 전화번호 길이)는 버튼이 활성화된 뒤 브라우저 기본 검증에 맡김.
  const canSubmit =
    contact.fields
      .filter((field) => field.required)
      .every((field) => String(form[field.key]).trim() !== "") && isAgreed;

  function handleChangeField(
    key: string,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm({ ...form, [key]: event.target.value });
  }

  // 전송은 아직 연결되지 않음. 기존 Vue 버전은 @emailjs/browser 를 썼는데, 이 앱에는 그 의존성도 키도 없음.
  // 전송 수단이 정해질 때까지 성공한 척하지 않고, 기존의 설정 없음 분기와 같은 "미설정" 안내를 보여 줌.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "error", message: "unavailable" });
  }

  return (
    // 배경은 그라데이션 면과 호 3개를 한 SVG 로 만듦(PNG 690KB 대비 1.8KB). PC 에서는 화면 폭에 맞춰 늘어나며,
    // SVG 가 preserveAspectRatio="none" 이라 가로축만 늘어남. TAB·MO 는 도형을 가운데에 두고 양옆을 자름
    // (TAB 은 PC 크기 1440, MO 는 1.2129배). gap 은 PC·TAB 36px, MO 24px.
    <section
      id="contact"
      className={cn(
        "flex min-h-[846px] flex-col items-center gap-9 [background-size:100%_846px] bg-top bg-no-repeat px-5 pt-25 max-introtab:[background-size:1440px_846px] max-introtab:px-10 max-introtab:pt-20 max-mo:min-h-[991px] max-mo:gap-6 max-mo:[background-size:1746.64px_1026.15px] max-mo:px-5 max-mo:pt-20",
        className,
      )}
      style={{ backgroundImage: `url(${CONTACT_BG})` }}
    >
      <img
        className={cn(REVEAL, "h-[51px] w-[230px]")}
        src={contact.logo}
        alt="Bigbird"
        loading="lazy"
        data-reveal
      />
      <h2
        className={cn(
          REVEAL,
          "m-0 text-[32px] leading-[1.4] font-bold text-black max-mo:text-2xl",
        )}
        data-reveal
      >
        {t("contact.title")}
      </h2>

      {/* noValidate 를 일부러 쓰지 않음: required/type/pattern 은 브라우저 기본 검증 말풍선을 쓰고,
          제출 핸들러는 유효한 폼에서만 실행됨.
          max-w-[792px] 는 PC 폼 폭이며 TAB·MO 는 패딩으로 크기를 정함. */}
      <form
        className={cn(
          REVEAL,
          "flex w-full max-w-[792px] flex-col items-center gap-5 max-introtab:max-w-none",
        )}
        onSubmit={handleSubmit}
        data-reveal
      >
        <div className="flex w-full flex-wrap gap-x-6 gap-y-4">
          {contact.fields.map((field) => (
            <div
              key={field.key}
              className={cn(
                "flex min-w-0 flex-[1_0_calc(50%-12px)] flex-col gap-2.5 max-mo:flex-[1_0_100%]",
                field.multiline && "flex-[1_0_100%]",
              )}
            >
              <label
                className="flex gap-1 text-base leading-6 font-medium text-black"
                htmlFor={`contact-${field.key}`}
              >
                {t(`contact.fields.${field.key}.label`)}
                {field.required && (
                  <span className="font-normal text-[#ff9087]">*</span>
                )}
              </label>

              {field.multiline ? (
                <textarea
                  id={`contact-${field.key}`}
                  className={cn(INPUT, "h-[116px] resize-none")}
                  placeholder={t(`contact.fields.${field.key}.placeholder`)}
                  required={field.required}
                  value={form[field.key]}
                  onChange={(event) => handleChangeField(field.key, event)}
                />
              ) : (
                <input
                  id={`contact-${field.key}`}
                  className={INPUT}
                  type={field.type || "text"}
                  placeholder={t(`contact.fields.${field.key}.placeholder`)}
                  required={field.required}
                  pattern={field.pattern}
                  title={field.titleKey ? t(field.titleKey) : undefined}
                  value={form[field.key]}
                  onChange={(event) => handleChangeField(field.key, event)}
                />
              )}
            </div>
          ))}
        </div>

        {/* 기존의 전역 `input[type=checkbox] + label` 이 커스텀 체크박스를 꾸몄기 때문에 label 이 input 을 감싸고
            글자는 span 에 둠. 그 전역 스타일은 사라졌지만 마크업은 디자인대로 둠.
            MO 에서는 글자가 2줄로 줄바꿈되므로 위쪽 정렬. */}
        <label className="flex w-full cursor-pointer items-center gap-3 max-mo:items-start">
          <input
            className="m-0 size-5 flex-none rounded-[4px] border border-[#c8c9cc] accent-[#4b80c2]"
            type="checkbox"
            required
            checked={isAgreed}
            onChange={(event) => setIsAgreed(event.target.checked)}
          />
          <span className="min-w-0 flex-1 text-base leading-6 font-medium text-black ko:break-keep">
            {t("contact.agree")}
          </span>
        </label>

        {/* mt-5 에 폼 gap 20 을 더하면 디자인의 40px. */}
        <button
          className="mt-5 flex h-12 min-w-[78px] cursor-pointer items-center justify-center gap-2 rounded-[4px] border-0 bg-[#222] px-6 text-base leading-6 font-medium text-white disabled:cursor-default disabled:bg-[#adb5bd] disabled:text-[#343a40]"
          type="submit"
          disabled={!canSubmit}
        >
          {t("contact.submit")}
          {/* 화살표는 활성과 비활성에서 색이 바뀌지만(흰색 -> #343a40) 에셋 svg 는 흰색 fill 이 고정이라
              <img> 로는 덮어쓸 수 없음. 같은 path 를 currentColor 로 인라인해 버튼 글자색을 따라가게 함.
              mx-[5px] 로 디자인의 16px 아이콘 슬롯을 채움. */}
          <svg
            className="mx-[5px] block h-[10.665px] w-[5.99px] flex-none"
            width="5.99348"
            height="10.665"
            viewBox="0 0 5.99348 10.665"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0.140615 0.152316C0.332633 -0.0460852 0.649214 -0.0513672 0.847647 0.140597L5.84114 4.97328C5.93838 5.06746 5.99348 5.19727 5.99348 5.33265C5.99345 5.46805 5.93843 5.59786 5.84114 5.69203L0.847647 10.5241C0.649235 10.7161 0.332664 10.7114 0.140615 10.513C-0.051414 10.3146 -0.0460491 9.99801 0.152334 9.80596L4.77343 5.33265L0.152334 0.859347C-0.0460667 0.667329 -0.0513487 0.350749 0.140615 0.152316Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {status && (
          <p
            className={cn(
              "m-0 text-center text-base leading-[1.4] font-medium",
              status.type === "success" ? "text-[#4b80c2]" : "text-[#ff9087]",
            )}
            role="status"
          >
            {t(`contact.${status.message}`)}
          </p>
        )}
      </form>
    </section>
  );
}
