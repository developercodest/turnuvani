"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KnockoutRules, LeagueRules, TournamentFormat, TournamentRules } from "@/types";
import type { FriendsPlayer } from "@/lib/friends-league/engine";

export type WizardFormat = TournamentFormat | "MULTI_TEAM";

export type WizardParticipantDraft = {
  id: string;
  name: string;
};

export type TournamentWizardDraft = {
  basicInfo: {
    name: string;
    description: string;
    category: string;
    startDate: string;
    endDate: string;
  };
  format: WizardFormat | null;
  participants: WizardParticipantDraft[];
  players: FriendsPlayer[];
  rules: TournamentRules | null;
};

export type TournamentWizardState = {
  currentStep: number;
  draft: TournamentWizardDraft;
  isDirty: boolean;
};

export const INITIAL_TOURNAMENT_WIZARD_DRAFT: TournamentWizardDraft = {
  basicInfo: {
    name: "",
    description: "",
    category: "",
    startDate: "",
    endDate: "",
  },
  format: null,
  participants: [],
  players: [],
  rules: null,
};

const INITIAL_TOURNAMENT_WIZARD_STATE: TournamentWizardState = {
  currentStep: 0,
  draft: INITIAL_TOURNAMENT_WIZARD_DRAFT,
  isDirty: false,
};

const WIZARD_SESSION_STORAGE_KEY = "turnuvani:tournament-wizard";
const LAST_WIZARD_STEP_INDEX = 4;
const DEFAULT_LEAGUE_RULES: LeagueRules = { winPoints: 3, drawPoints: 1, lossPoints: 0, drawAllowed: true, homeAway: false };
const DEFAULT_KNOCKOUT_RULES: KnockoutRules = { singleMatch: true, bracketType: "STANDARD", tieBreaker: "EXTRA_TIME" };

function isStoredWizardState(value: unknown): value is TournamentWizardState {
  if (!value || typeof value !== "object") return false;

  const state = value as Partial<TournamentWizardState>;
  return typeof state.currentStep === "number"
    && typeof state.isDirty === "boolean"
    && Boolean(state.draft)
    && typeof state.draft?.basicInfo?.name === "string"
    && Array.isArray(state.draft?.participants);
}

export function useTournamentWizardState() {
  const [state, setState] = useState<TournamentWizardState>(INITIAL_TOURNAMENT_WIZARD_STATE);
  const hasRestoredSession = useRef(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const serializedState = window.sessionStorage.getItem(WIZARD_SESSION_STORAGE_KEY);
        if (serializedState) {
          const parsedState: unknown = JSON.parse(serializedState);
          if (isStoredWizardState(parsedState)) {
            setState({
              ...parsedState,
              draft: { ...parsedState.draft, players: parsedState.draft.players ?? [] },
              currentStep: parsedState.draft.format ? Math.min(Math.max(0, parsedState.currentStep), LAST_WIZARD_STEP_INDEX) : 0,
            });
          }
        }
      } catch {
        // Storage can be disabled by the browser. The wizard remains fully usable in memory.
      } finally {
        hasRestoredSession.current = true;
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hasRestoredSession.current) return;

    try {
      window.sessionStorage.setItem(WIZARD_SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be disabled by the browser. The wizard remains fully usable in memory.
    }
  }, [state]);

  function setCurrentStep(currentStep: number) {
    setState((value) => ({ ...value, currentStep: Math.min(Math.max(0, currentStep), LAST_WIZARD_STEP_INDEX) }));
  }

  function updateDraft(update: Partial<TournamentWizardDraft>) {
    setState((value) => ({
      ...value,
      draft: { ...value.draft, ...update },
      isDirty: true,
    }));
  }

  function updateBasicInfo(update: Partial<TournamentWizardDraft["basicInfo"]>) {
    setState((value) => ({
      ...value,
      draft: {
        ...value.draft,
        basicInfo: { ...value.draft.basicInfo, ...update },
      },
      isDirty: true,
    }));
  }

  function updateFormat(format: WizardFormat) {
    setState((value) => {
      const hasCompatibleRules = format !== "KNOCKOUT"
        ? Boolean(value.draft.rules && "drawAllowed" in value.draft.rules)
        : Boolean(value.draft.rules && "bracketType" in value.draft.rules);
      return {
        ...value,
        draft: {
          ...value.draft,
          format,
          // Visible defaults are now persisted to the draft on format selection,
          // so advancing without touching the form remains valid.
          rules: format === "MULTI_TEAM" ? { ...(hasCompatibleRules ? value.draft.rules as LeagueRules : DEFAULT_LEAGUE_RULES), drawAllowed: true, homeAway: false } : hasCompatibleRules ? value.draft.rules : format === "LEAGUE" ? DEFAULT_LEAGUE_RULES : DEFAULT_KNOCKOUT_RULES,
        },
        isDirty: true,
      };
    });
  }

  function updateLeagueRules(rules: LeagueRules) {
    updateDraft({ rules });
  }

  function updateKnockoutRules(rules: KnockoutRules) {
    updateDraft({ rules });
  }

  function addParticipant(name: string) {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    setState((value) => ({
      ...value,
      draft: {
        ...value.draft,
        participants: [
          ...value.draft.participants,
          { id: `participant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: normalizedName },
        ],
      },
      isDirty: true,
    }));
  }

  function updateParticipant(id: string, name: string) {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    setState((value) => ({
      ...value,
      draft: {
        ...value.draft,
        participants: value.draft.participants.map((participant) => participant.id === id ? { ...participant, name: normalizedName } : participant),
      },
      isDirty: true,
    }));
  }

  function removeParticipant(id: string) {
    setState((value) => ({
      ...value,
      draft: { ...value.draft, participants: value.draft.participants.filter((participant) => participant.id !== id) },
      isDirty: true,
    }));
  }

  const clearSessionDraft = useCallback(() => {
    try {
      window.sessionStorage.removeItem(WIZARD_SESSION_STORAGE_KEY);
    } catch {
      // Storage can be disabled by the browser. Resetting the in-memory state is still sufficient.
    }
    setState(INITIAL_TOURNAMENT_WIZARD_STATE);
  }, []);

  return { ...state, setCurrentStep, updateDraft, updateBasicInfo, updateFormat, updateLeagueRules, updateKnockoutRules, addParticipant, updateParticipant, removeParticipant, clearSessionDraft };
}
