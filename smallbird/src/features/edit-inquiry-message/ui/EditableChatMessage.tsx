import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteInquiryMessage, editInquiryMessage } from "@/entities/inquiry";
import { isApiError } from "@/shared/api";
import { ChatMessage, MessageEditor } from "@/shared/components/chat-message";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { InquiryMessageViewModel } from "@/entities/inquiry";
import type { MessageSize } from "@/shared/components/chat-message";

const MAX_LENGTH = 3000;

interface EditableChatMessageProps {
  message: InquiryMessageViewModel;
  name: string;
  avatarSrc?: string;
  avatarClassName?: string;
  time: string;
  /** 말풍선 크기. 대화 패널 폭에 따라 시안이 다릅니다(구매자 문의 PC 340 = md). */
  size?: MessageSize;
  /** ChatMessage의 rowClassName(아바타 간격). */
  rowClassName?: string;
  /** 이 대화에서 메시지 수정·삭제를 허용하는지(REST 대화만. 실시간 상담은 Firestore라 허용하지 않습니다). */
  canModify: boolean;
  /** 수정·삭제가 끝나거나 서버 상태와 어긋났을 때 대화를 다시 받습니다. */
  onChanged: () => void;
  /** 수정 저장·삭제 확인을 다른 API로 처리하는 대화(상품 Q&A 답변). 없으면 문의 메시지 API를 씁니다. */
  onSubmitEdit?: (body: string) => Promise<void>;
  onConfirmDelete?: () => Promise<void>;
}

// 서버 규칙: 본인이 보낸 메시지를 상대가 읽기 전에만 고치거나 지울 수 있습니다. 첨부·캠페인 카드·자동 메시지는
// 본문 수정 대상이 아니라 텍스트 메시지만 다룹니다. 서버 id가 아닌 임시 메시지(id ≤ 0)도 제외합니다.
function isModifiable(message: InquiryMessageViewModel) {
  return (
    message.isMine &&
    message.kind === "text" &&
    !message.isRead &&
    !message.isDeleted &&
    message.id > 0
  );
}

// Figma 메시지 수정·삭제(6772:53815): 내 말풍선 hover(터치는 탭) 툴바의 수정·삭제, 수정 시 말풍선이 편집 입력으로 바뀝니다.
// 답장 아이콘은 API가 없어 그리지 않습니다.
export function EditableChatMessage({
  message,
  name,
  avatarSrc,
  avatarClassName,
  time,
  size,
  rowClassName,
  canModify,
  onChanged,
  onSubmitEdit = (body) => editInquiryMessage(message.id, body),
  onConfirmDelete = () => deleteInquiryMessage(message.id),
}: EditableChatMessageProps) {
  const { t } = useTranslation("features/edit-inquiry-message");
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(message.body);
  const [isBusy, setIsBusy] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const side = message.isMine ? "me" : "other";
  const editedLabel = message.isEdited ? t("edited") : undefined;

  async function run(action: () => Promise<void>, onSucceeded?: () => void) {
    setIsBusy(true);
    try {
      await action();
      setIsEditing(false);
      onChanged();
      onSucceeded?.();
    } catch (error) {
      console.error("메시지 수정·삭제 실패", error);
      // 읽힌 메시지(409)는 서버 상태와 화면이 어긋난 것이라 안내 없이 대화를 다시 받아 수정·삭제 버튼이 사라지게 합니다.
      if (isApiError(error) && error.status === 409) {
        onChanged();
        return;
      }
      toast.error(t("failed"));
    } finally {
      setIsBusy(false);
    }
  }

  function handleSubmitEdit() {
    const body = text.trim();
    if (!body || isBusy) return;
    if (body === message.body) {
      setIsEditing(false);
      return;
    }
    void run(() => onSubmitEdit(body));
  }

  if (!canModify || !isModifiable(message)) {
    return (
      <ChatMessage
        name={name}
        avatarSrc={avatarSrc}
        avatarClassName={avatarClassName}
        side={side}
        message={message.body}
        time={time}
        size={size}
        rowClassName={rowClassName}
        editedLabel={editedLabel}
      />
    );
  }

  if (isEditing) {
    return (
      <MessageEditor
        name={name}
        avatarSrc={avatarSrc}
        value={text}
        onChangeValue={setText}
        maxLength={MAX_LENGTH}
        inputLabel={t("editLabel")}
        cancelLabel={t("cancel")}
        onClickCancel={() => setIsEditing(false)}
        submitLabel={t("save")}
        onClickSubmit={handleSubmitEdit}
        className="w-full self-end"
      />
    );
  }

  return (
    <>
      <ChatMessage
        name={name}
        avatarSrc={avatarSrc}
        avatarClassName={avatarClassName}
        side={side}
        message={message.body}
        time={time}
        size={size}
        rowClassName={rowClassName}
        editedLabel={editedLabel}
        toolbar={
          <>
            <Button
              variant="ghost-foreground"
              size="icon"
              aria-label={t("edit")}
              onClick={() => {
                setText(message.body);
                setIsEditing(true);
              }}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost-foreground"
              size="icon"
              aria-label={t("delete")}
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 />
            </Button>
          </>
        }
      />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                // 삭제가 끝나면 공통 토스트로 알림(REQ-24-0045, REQ-34-0031). 수정에는 띄우지 않음.
                void run(onConfirmDelete, () => toast(t("deleted")))
              }
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
