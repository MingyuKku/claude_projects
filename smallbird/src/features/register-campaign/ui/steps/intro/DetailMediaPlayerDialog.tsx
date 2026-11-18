import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

interface DetailMediaPlayerDialogProps {
  /** 재생할 동영상 주소. null이면 닫힘. */
  url: string | null;
  title: string;
  onClose: () => void;
}

export function DetailMediaPlayerDialog({
  url,
  title,
  onClose,
}: DetailMediaPlayerDialogProps) {
  return (
    <Dialog open={url !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-fit max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {url && (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="max-h-[80dvh] w-full bg-black"
          >
            <track kind="captions" />
          </video>
        )}
      </DialogContent>
    </Dialog>
  );
}
