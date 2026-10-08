"use client";

import { create } from "zustand";
import type { Appointment } from "@/lib/data/types";

export interface AppointmentDraft {
  start?: string;
  staffId?: string;
  clientId?: string;
}

interface UiState {
  commandOpen: boolean;
  shortcutsOpen: boolean;
  appointmentDialog: { open: boolean; appointment: Appointment | null; draft: AppointmentDraft | null };
  clientDialogOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  openNewAppointment: (draft?: AppointmentDraft) => void;
  openEditAppointment: (appointment: Appointment) => void;
  closeAppointmentDialog: () => void;
  setClientDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  commandOpen: false,
  shortcutsOpen: false,
  appointmentDialog: { open: false, appointment: null, draft: null },
  clientDialogOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  openNewAppointment: (draft) =>
    set({ appointmentDialog: { open: true, appointment: null, draft: draft ?? null }, commandOpen: false }),
  openEditAppointment: (appointment) =>
    set({ appointmentDialog: { open: true, appointment, draft: null }, commandOpen: false }),
  closeAppointmentDialog: () => set((s) => ({ appointmentDialog: { ...s.appointmentDialog, open: false } })),
  setClientDialogOpen: (open) => set({ clientDialogOpen: open, commandOpen: false }),
}));
