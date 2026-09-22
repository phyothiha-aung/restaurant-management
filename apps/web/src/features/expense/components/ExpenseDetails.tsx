import type { Expense, ExpenseStatus } from "@restaurant-management/shared";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Download, FileText, Image } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../../lib/api-error";
import { getExpenseAttachmentAccessUrl } from "../expense-api";
import {
  formatExpenseAmount,
  formatExpenseCategory,
} from "../expense-options";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusTone: Record<ExpenseStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  VOIDED: "neutral",
};

export function ExpenseDetails({ expense }: { expense: Expense }) {
  const [openingAttachmentId, setOpeningAttachmentId] = useState<number | null>(null);

  const openAttachment = async (attachmentId: number) => {
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    setOpeningAttachmentId(attachmentId);
    try {
      const access = await getExpenseAttachmentAccessUrl(expense.id, attachmentId);
      if (preview) preview.location.href = access.url;
      else window.open(access.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      preview?.close();
      toast.error(getApiErrorMessage(error, "Could not open attachment."));
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-ink">{expense.title}</h3>
            <p className="mt-1 text-xl font-extrabold text-brand-red">
              {formatExpenseAmount(expense.amount)}
            </p>
          </div>
          <Badge tone={statusTone[expense.status]}>{expense.status}</Badge>
        </div>
        {expense.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">
            {expense.description}
          </p>
        )}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Category" value={formatExpenseCategory(expense.category)} />
        <Detail label="Expense date" value={dateFormatter.format(new Date(`${expense.expenseDate}T00:00:00`))} />
        <Detail label="Branch" value={expense.branch?.name ?? "Restaurant-wide"} />
        <Detail label="Created by" value={expense.createdBy.name} />
        <Detail label="Created" value={dateTimeFormatter.format(new Date(expense.createdAt))} />
        <Detail label="Last updated by" value={expense.updatedBy.name} />
        <Detail label="Last updated" value={dateTimeFormatter.format(new Date(expense.updatedAt))} />
      </dl>

      <section>
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-muted">
          Attachments ({expense.attachmentCount})
        </h4>
        {expense.attachments.length === 0 ? (
          <p className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            No files are attached to this expense.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {expense.attachments.map((attachment) => (
              <li
                className="flex items-center gap-3 rounded-xl border border-line p-3"
                key={attachment.id}
              >
                {attachment.mimeType === "application/pdf" ? (
                  <FileText className="shrink-0 text-brand-red" size={20} />
                ) : (
                  <Image className="shrink-0 text-brand-red" size={20} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {attachment.originalName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {(attachment.sizeBytes / 1024 / 1024).toFixed(2)} MB · Added by {attachment.attachedBy.name}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={openingAttachmentId === attachment.id}
                  loadingLabel="Opening..."
                  onClick={() => void openAttachment(attachment.id)}
                >
                  <Download size={15} /> Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {expense.status === "VOIDED" && (
        <div className="rounded-2xl border border-danger/20 bg-brand-red-soft p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-brand-red">
            Void information
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-ink">
            {expense.voidReason}
          </p>
          <p className="mt-3 text-xs text-muted">
            Voided by {expense.voidedBy?.name ?? "Unknown"}
            {expense.voidedAt
              ? ` on ${dateTimeFormatter.format(new Date(expense.voidedAt))}`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
