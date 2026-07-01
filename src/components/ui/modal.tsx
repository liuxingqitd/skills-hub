"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { useI18n } from "@/src/lib/i18n";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width,
}: ModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={width ? { width, maxWidth: "90vw" } : undefined}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: description ? 0 : 16 }}>
            <div>
              <div className="modal-title">{title}</div>
              {description && <div className="modal-desc">{description}</div>}
            </div>
            <button
              className="btn-icon-sm"
              onClick={onClose}
              aria-label={t("common.close")}
              style={{ marginTop: -4, marginRight: -4 }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}

/* ---- Confirm dialog ---- */

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-text">{text}</div>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            className={"btn " + (danger ? "btn-danger" : "btn-primary")}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
