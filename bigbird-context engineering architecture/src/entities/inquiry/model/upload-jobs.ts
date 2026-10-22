import { tryit } from "radash";
import { mutate } from "swr";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import {
  sendInquiryMessage,
  uploadInquiryAttachment,
} from "../api/inquiry-api";

export type UploadJobStatus = "uploading" | "failed";

export interface UploadJob {
  files: File[];
  /** 올리고 메시지까지 보낸 파일 수. 실패하면 이 다음 파일부터 이어서 보냄. */
  sentCount: number;
  status: UploadJobStatus;
}

interface UploadJobsState {
  /** 문의(threadIdx)별 백그라운드 첨부 업로드. 대화 화면이 진행 표시를 그림. */
  jobs: Record<number, UploadJob>;
  start: (threadIdx: number, files: File[]) => void;
  retry: (threadIdx: number) => void;
}

// 같은 문의에서 업로드가 겹쳐 돌지 않게 함.
const running = new Set<number>();

// 대화 캐시를 다시 받음(키: ["bigbird-inquiries", threadUserIdx, status], ["purchaser-messages", …]).
const CONVERSATION_KEYS = ["bigbird-inquiries", "purchaser-messages"];
const revalidateInquiries = () =>
  void mutate(
    (key) => Array.isArray(key) && CONVERSATION_KEYS.includes(String(key[0])),
  );

export const useInquiryUploadStore = create<UploadJobsState>()(
  devtools(
    (set, get) => {
      const patch = (threadIdx: number, next: Partial<UploadJob>) =>
        set((state) => {
          const job = state.jobs[threadIdx];
          return job
            ? { jobs: { ...state.jobs, [threadIdx]: { ...job, ...next } } }
            : state;
        });

      // 파일을 하나씩 올려 메시지로 보냄. 한꺼번에 보이도록 대화 갱신은 끝나거나 멈출 때 한 번만 함.
      // ponytail: 메시지 저장 응답만 유실돼 다시 시도하면 같은 파일이 한 번 더 올라감(REST 중복 방지 수단 없음).
      // 페이지를 새로고침하면 진행 중인 업로드는 사라짐.
      async function run(threadIdx: number) {
        if (running.has(threadIdx)) return;
        running.add(threadIdx);
        try {
          patch(threadIdx, { status: "uploading" });
          for (;;) {
            const job = get().jobs[threadIdx];
            const file = job?.files[job.sentCount];
            if (!job || !file) break;
            const [error] = await tryit(async () => {
              const uploaded = await uploadInquiryAttachment(file);
              await sendInquiryMessage({
                threadIdx,
                body: uploaded.url,
                attachmentIdx: uploaded.attachmentIdx,
              });
            })();
            if (error) {
              console.error("첨부 업로드 실패", error);
              patch(threadIdx, { status: "failed" });
              revalidateInquiries();
              return;
            }
            patch(threadIdx, { sentCount: job.sentCount + 1 });
          }
          set((state) => {
            const jobs = { ...state.jobs };
            delete jobs[threadIdx];
            return { jobs };
          });
          revalidateInquiries();
        } finally {
          running.delete(threadIdx);
        }
      }

      return {
        jobs: {},
        start: (threadIdx, files) => {
          if (files.length === 0) return;
          set((state) => ({
            jobs: {
              ...state.jobs,
              [threadIdx]: { files, sentCount: 0, status: "uploading" },
            },
          }));
          void run(threadIdx);
        },
        retry: (threadIdx) => void run(threadIdx),
      };
    },
    { name: "inquiry-uploads" },
  ),
);

export const startInquiryUploads = (threadIdx: number, files: File[]) =>
  useInquiryUploadStore.getState().start(threadIdx, files);

export const retryInquiryUploads = (threadIdx: number) =>
  useInquiryUploadStore.getState().retry(threadIdx);

/** 이 문의에서 진행 중이거나 실패한 첨부 업로드. 없으면 undefined. */
export const useInquiryUploadJob = (threadIdx: number) =>
  useInquiryUploadStore((state) => state.jobs[threadIdx]);
