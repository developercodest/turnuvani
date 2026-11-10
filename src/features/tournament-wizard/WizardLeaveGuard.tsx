"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type WizardRegistration = { isDirty: boolean; discard: () => void } | null;

type WizardLeaveGuardContextValue = {
  registerWizard: (registration: WizardRegistration) => void;
  requestLeave: (leave: () => void) => void;
};

const WizardLeaveGuardContext = createContext<WizardLeaveGuardContextValue | undefined>(undefined);

export function WizardLeaveGuardProvider({ children }: { children: ReactNode }) {
  const [wizard, setWizard] = useState<WizardRegistration>(null);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  const registerWizard = useCallback((registration: WizardRegistration) => {
    setWizard((current) => current?.isDirty === registration?.isDirty && current?.discard === registration?.discard ? current : registration);
  }, []);
  const requestLeave = useCallback((leave: () => void) => {
    if (wizard?.isDirty) {
      setPendingLeave(() => leave);
      return;
    }
    leave();
  }, [wizard]);

  function discardAndLeave() {
    wizard?.discard();
    const leave = pendingLeave;
    setPendingLeave(null);
    leave?.();
  }

  return (
    <WizardLeaveGuardContext.Provider value={{ registerWizard, requestLeave }}>
      {children}
      <Modal open={Boolean(pendingLeave)} title="Sayfadan ayrılıyorsunuz" onClose={() => setPendingLeave(null)}>
        <p>Turnuva oluşturma adımlarındaki kaydedilmemiş bilgileriniz silinecek. Ayrılmak istiyor musunuz?</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setPendingLeave(null)}>Devam Et</Button>
          <Button variant="danger" onClick={discardAndLeave}>Ayrıl</Button>
        </div>
      </Modal>
    </WizardLeaveGuardContext.Provider>
  );
}

export function useWizardLeaveGuard() {
  const context = useContext(WizardLeaveGuardContext);
  if (!context) throw new Error("useWizardLeaveGuard WizardLeaveGuardProvider içinde kullanılmalı.");
  return context;
}
