import { useState } from "react";
import { useCreateReport } from "@/lib/react-query/queries";
import { useToast } from "@/components/ui/use-toast";

const REASONS = [
  "Spam or misleading",
  "Nudity or sexual content",
  "Hate speech or harassment",
  "Violence or dangerous content",
  "Misinformation",
  "Other",
];

type ReportModalProps = {
  targetType: "post" | "user" | "comment";
  targetId: string;
  onClose: () => void;
};

const ReportModal = ({ targetType, targetId, onClose }: ReportModalProps) => {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const { mutate: createReport, isPending } = useCreateReport();
  const { toast } = useToast();

  const handleSubmit = () => {
    const reason = selected === "Other" ? custom.trim() : selected;
    if (!reason) return;
    createReport(
      { targetType, targetId, reason },
      {
        onSuccess: () => {
          toast({ title: "Report submitted. Thank you." });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: err.message === "Already reported" ? "You already reported this." : "Could not submit report." });
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="body-bold text-light-1">Report {targetType}</h3>
          <button onClick={onClose} className="text-light-4 hover:text-light-2 transition text-xl leading-none">×</button>
        </div>

        <p className="small-regular text-light-3">Why are you reporting this?</p>

        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelected(r)}
              className={`text-left px-4 py-2.5 rounded-lg small-regular transition border ${
                selected === r
                  ? "border-primary-500 bg-primary-600/20 text-light-1"
                  : "border-[var(--color-glass-border)] text-light-3 hover:border-primary-500/40 hover:text-light-2"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {selected === "Other" && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Please describe the issue…"
            maxLength={500}
            rows={3}
            className="bg-dark-4 border border-[var(--color-glass-border)] rounded-lg px-4 py-2 text-light-1 small-regular placeholder:text-light-4 focus:outline-none focus:border-primary-500/50 transition resize-none"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected || (selected === "Other" && !custom.trim()) || isPending}
          className="shad-button_primary w-full py-2.5 rounded-lg small-semibold disabled:opacity-40"
        >
          {isPending ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </div>
  );
};

export default ReportModal;
