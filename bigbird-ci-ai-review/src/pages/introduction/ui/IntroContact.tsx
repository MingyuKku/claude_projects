import { useState, type ChangeEvent, type SubmitEvent } from "react";

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
  message: string;
}

const SEND_UNAVAILABLE_MESSAGE =
  "문의 전송 설정이 없습니다. 관리자에게 문의해 주세요.";

// The design removed the input border and focus ring, so shadcn's Input/Textarea
// would need every default border/ring/height undone - and they are one native
// element deep anyway. Utilities go straight on the native elements instead.
const INPUT =
  "h-12 rounded-[4px] border-0 bg-white px-4 py-3 text-base leading-6 font-medium text-[#222] placeholder:text-[#adb5bd] focus:outline-none focus-visible:outline-none";

function createEmptyForm(): FormState {
  return Object.fromEntries(contact.fields.map((field) => [field.key, ""]));
}

export function IntroContact({ className }: Props) {
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [isAgreed, setIsAgreed] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  // The submit button stays disabled until every required (*) field is filled.
  // Format errors (email '@', phone length) are left to native browser validation
  // once the button is enabled.
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

  // Sending is not wired up yet. The legacy Vue version used @emailjs/browser,
  // which this app has neither as a dependency nor keys for. Until a sender is
  // chosen, the form does not pretend to succeed and shows the same "not
  // configured" notice as the legacy no-config branch.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "error", message: SEND_UNAVAILABLE_MESSAGE });
  }

  return (
    // The background is a gradient plane plus 3 arcs as one SVG (1.8KB vs 690KB as
    // PNG). On PC it stretches to the screen width; the SVG is
    // preserveAspectRatio="none", so only the horizontal axis stretches. TAB and
    // MO center the shape and crop the sides (TAB at the 1440 PC size, MO at 1.2129x).
    // gap is 36px on PC and TAB, 24px on MO.
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
        {contact.title}
      </h2>

      {/* No noValidate on purpose: required/type/pattern use the native validation
          bubble, and the submit handler only runs on a valid form.
          max-w-[792px] is the PC form width; TAB and MO are sized by padding. */}
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
                {field.label}
                {field.required && (
                  <span className="font-normal text-[#ff9087]">*</span>
                )}
              </label>

              {field.multiline ? (
                <textarea
                  id={`contact-${field.key}`}
                  className={cn(INPUT, "h-[116px] resize-none")}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={form[field.key]}
                  onChange={(event) => handleChangeField(field.key, event)}
                />
              ) : (
                <input
                  id={`contact-${field.key}`}
                  className={INPUT}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  required={field.required}
                  pattern={field.pattern}
                  title={field.title}
                  value={form[field.key]}
                  onChange={(event) => handleChangeField(field.key, event)}
                />
              )}
            </div>
          ))}
        </div>

        {/* The legacy global `input[type=checkbox] + label` styled a custom
            checkbox, so the label wraps the input with the text in a span. That
            global is gone, but the markup stays as designed. MO text wraps to 2
            lines, so it aligns to the top. */}
        <label className="flex w-full cursor-pointer items-center gap-3 max-mo:items-start">
          <input
            className="m-0 size-5 flex-none rounded-[4px] border border-[#c8c9cc] accent-[#4b80c2]"
            type="checkbox"
            required
            checked={isAgreed}
            onChange={(event) => setIsAgreed(event.target.checked)}
          />
          <span className="min-w-0 flex-1 text-base leading-6 font-medium break-keep text-black">
            {contact.agreeLabel}
          </span>
        </label>

        {/* mt-5 plus the form gap of 20 is the design's 40px. */}
        <button
          className="mt-5 flex h-12 min-w-[78px] cursor-pointer items-center justify-center gap-2 rounded-[4px] border-0 bg-[#222] px-6 text-base leading-6 font-medium text-white disabled:cursor-default disabled:bg-[#adb5bd] disabled:text-[#343a40]"
          type="submit"
          disabled={!canSubmit}
        >
          {contact.submitLabel}
          {/* The arrow changes color between enabled and disabled (white -> #343a40),
              but the asset svg has a fixed white fill that <img> cannot override.
              The same path is inlined with currentColor to follow the button text.
              mx-[5px] pads it out to the design's 16px icon slot. */}
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
            {status.message}
          </p>
        )}
      </form>
    </section>
  );
}
