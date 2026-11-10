import type { TournamentFormat } from "@/types";

/** Presentation metadata is independent of each format's rules and persistence. */
export const TOURNAMENT_FORMAT_INFO: Record<TournamentFormat, { title: string; description: string; points: string[]; icon: string }> = {
  LEAGUE: { title: "Lig", description: "Tüm katılımcılar birbirleriyle oynar.", points: ["Herkes birbirine karşı oynar", "Puan durumu oluşur", "Daha fazla maç yapılır"], icon: "🏆" },
  KNOCKOUT: { title: "Eleme (Knockout)", description: "Kaybeden elenir, kazanan bir üst tura çıkar.", points: ["Tek maçlı eleme sistemi", "Daha kısa sürede tamamlanır", "Kupa turnuvaları için idealdir"], icon: "🏁" },
};
