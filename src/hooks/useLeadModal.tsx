import { useState, useCallback } from "react";
import LeadModal, { LeadModalProps } from "@/components/LeadModal";

type OpenOpts = Omit<LeadModalProps, "open" | "onClose">;

export function useLeadModal(defaults?: Partial<OpenOpts>) {
  const [state, setState] = useState<{ open: boolean; opts: OpenOpts }>({
    open: false,
    opts: { title: "Оставить заявку", source: "Сайт", ...defaults },
  });

  const open  = useCallback((opts?: Partial<OpenOpts>) => {
    setState(s => ({
      open: true,
      opts: { ...s.opts, ...(defaults || {}), ...(opts || {}) },
    }));
  }, [defaults]);

  const close = useCallback(() => setState(s => ({ ...s, open: false })), []);

  const node = (
    <LeadModal {...state.opts} open={state.open} onClose={close} />
  );

  return { open, close, node };
}
