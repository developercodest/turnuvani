"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useWizardLeaveGuard } from "./WizardLeaveGuard";
import type { TournamentWizardDraft, WizardFormat } from "./useTournamentWizardState";
import { MultiTeamPlayers } from "./MultiTeamPlayers";
import { hasValidKnockoutRules, hasValidLeagueRules, hasValidPlayerNames, hasValidPlayers, normalizeParticipantName, validateBasicInfo, type BasicInfoErrors } from "./validation";
import { useTournamentWizardState } from "./useTournamentWizardState";
import type { KnockoutRules, LeagueRules, TournamentFormat } from "@/types";
import { startKnockoutTournament, startLeagueTournament, startMultiTeamTournament } from "@/app/(admin)/dashboard/tournaments/new/actions";
import { TOURNAMENT_FORMAT_INFO } from "@/lib/tournament-formats";
import { TOURNAMENT_DESCRIPTION_MAX_LENGTH, TOURNAMENT_NAME_MAX_LENGTH } from "@/lib/tournament-text-limits";
import styles from "./tournament-wizard.module.css";

const WIZARD_STEPS = [
  { title: "Format", description: "Turnuva formatını seçin." },
  { title: "Temel Bilgiler", description: "Turnuvanın temel bilgilerini girerek başlayalım." },
  { title: "Katılımcılar", description: "Katılımcıları turnuvaya ekleyin." },
  { title: "Kurallar", description: "Turnuva kurallarını belirleyin." },
  { title: "Önizleme", description: "Bilgileri son kez gözden geçirin." },
] as const;

const DEFAULT_LEAGUE_RULES: LeagueRules = { winPoints: 3, drawPoints: 1, lossPoints: 0, drawAllowed: true, homeAway: false };
const DEFAULT_KNOCKOUT_RULES: KnockoutRules = { singleMatch: true, bracketType: "STANDARD", tieBreaker: "EXTRA_TIME" };

type WizardStep = (typeof WIZARD_STEPS)[number];
function StepPlaceholder({ step, stepNumber }: { step: WizardStep; stepNumber: number }) {
  return (
    <section className={styles.stepPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIcon} aria-hidden="true">{stepNumber}</div>
      <div>
        <p className={styles.stepEyebrow}>Adım {stepNumber}</p>
        <h2 id="wizard-step-title">{step.title}</h2>
        <p>{step.description}</p>
      </div>
      <div className={styles.placeholder}>
        <strong>Bu adım hazırlanıyor</strong>
        <p>Bu alanın form ve doğrulama ayrıntıları ilgili wizard kartlarında eklenecek.</p>
      </div>
    </section>
  );
}

function BasicInfoForm({ basicInfo, errors, onChange }: {
  basicInfo: TournamentWizardDraft["basicInfo"];
  errors: BasicInfoErrors;
  onChange: (update: Partial<TournamentWizardDraft["basicInfo"]>) => void;
}) {
  return (
    <section className={styles.basicInfoPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIntro}>
        <div className={styles.stepIcon} aria-hidden="true">2</div>
        <div>
          <h2 id="wizard-step-title">Temel Bilgiler</h2>
          <p>Turnuvanızla ilgili temel bilgileri girerek başlayalım.</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fullField}>
          <Input id="tournament-name" label="Turnuva Adı *" error={errors.name} maxLength={TOURNAMENT_NAME_MAX_LENGTH} value={basicInfo.name} onChange={(event) => onChange({ name: event.target.value })} />
          <p className={styles.fieldHint}>{basicInfo.name.length}/{TOURNAMENT_NAME_MAX_LENGTH}</p>
        </div>
        <label className={`${styles.textareaField} ${styles.fullField}`} htmlFor="tournament-description">
          <span>Açıklama</span>
          <textarea id="tournament-description" maxLength={TOURNAMENT_DESCRIPTION_MAX_LENGTH} value={basicInfo.description} onChange={(event) => onChange({ description: event.target.value })} rows={4} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "tournament-description-error" : undefined} />
          {errors.description ? <small id="tournament-description-error" role="alert">{errors.description}</small> : null}
          <small>{basicInfo.description.length}/{TOURNAMENT_DESCRIPTION_MAX_LENGTH}</small>
        </label>
        <label className={styles.selectField} htmlFor="tournament-category">
          <span>Spor / Kategori</span>
          <select id="tournament-category" value={basicInfo.category} onChange={(event) => onChange({ category: event.target.value })}>
            <option value="">Kategori seçin</option>
            <option value="Futbol">Futbol</option>
            <option value="Basketbol">Basketbol</option>
            <option value="Voleybol">Voleybol</option>
            <option value="Diğer">Diğer</option>
          </select>
        </label>
        <div className={styles.categoryHint}><strong>Bilgi</strong><span>Spor kategorisi yalnızca bilgilendirme amaçlıdır.</span></div>
        <Input id="tournament-start-date" label="Başlangıç Tarihi *" error={errors.startDate} type="date" value={basicInfo.startDate} onChange={(event) => onChange({ startDate: event.target.value })} />
        <Input id="tournament-end-date" label="Bitiş Tarihi" error={errors.endDate} type="date" min={basicInfo.startDate || undefined} value={basicInfo.endDate} onChange={(event) => onChange({ endDate: event.target.value })} />
      </div>
    </section>
  );
}

function FormatSelection({ value, error, onChange }: { value: WizardFormat | null; error?: string; onChange: (format: WizardFormat) => void }) {
  const formats = [...(Object.keys(TOURNAMENT_FORMAT_INFO) as TournamentFormat[]).map((format) => ({ value: format as WizardFormat, ...TOURNAMENT_FORMAT_INFO[format] })), { value: "MULTI_TEAM" as const, title: "Çok Takımlı Lig", description: "Oyuncuların seçtiği takımlar eşleşir, puanlar oyuncularda toplanır.", points: ["Her oyuncu eşit sayıda takım seçer", "Her oyuncu çifti rastgele eşleşir", "Puanlar takım sahiplerine yazılır"], icon: "🎮" }];

  return (
    <section className={styles.formatPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIntro}>
        <div className={styles.stepIcon} aria-hidden="true">1</div>
        <div><h2 id="wizard-step-title">Turnuva Formatı</h2><p>Turnuvan için en uygun formatı seç.</p></div>
      </div>
      <div className={styles.formatChoices} role="radiogroup" aria-label="Turnuva formatı" aria-invalid={Boolean(error)} aria-describedby={error ? "format-error" : undefined}>
        {formats.map((format) => (
          <label className={styles.formatChoice} data-selected={value === format.value} key={format.value}>
            <input type="radio" name="tournament-format" value={format.value} checked={value === format.value} onChange={() => onChange(format.value)} />
            <span className={styles.formatIcon} aria-hidden="true">{format.icon}</span>
            <strong>{format.title}</strong>
            <p>{format.description}</p>
            <ul>{format.points.map((point) => <li key={point}>✓ {point}</li>)}</ul>
          </label>
        ))}
      </div>
      {error ? <p id="format-error" className={styles.formatError} role="alert">{error}</p> : null}
      <p className={styles.formatNotice}><strong>Bilgi</strong> Turnuva başladıktan sonra format değiştirilemez.</p>
    </section>
  );
}

function ParticipantStep({ participants, error, onAdd, onUpdate, onRemove, isPlayer = false }: {
  participants: TournamentWizardDraft["participants"];
  error?: string;
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  isPlayer?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [participantError, setParticipantError] = useState<string>();
  const normalizedName = participantName.trim();
  const editingParticipant = participants.find((participant) => participant.id === editingParticipantId);

  function closeModal() {
    setIsModalOpen(false);
    setParticipantName("");
    setEditingParticipantId(null);
    setParticipantError(undefined);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedName) return;

    const duplicate = participants.some((participant) => participant.id !== editingParticipantId && normalizeParticipantName(participant.name) === normalizeParticipantName(normalizedName));
    if (duplicate) {
      setParticipantError(isPlayer ? "Bu isimle bir oyuncu zaten eklenmiş." : "Bu isimle bir katılımcı zaten eklenmiş.");
      return;
    }

    if (editingParticipantId) onUpdate(editingParticipantId, normalizedName);
    else onAdd(normalizedName);
    closeModal();
  }

  function openEditModal(id: string) {
    const participant = participants.find((item) => item.id === id);
    if (!participant) return;
    setEditingParticipantId(id);
    setParticipantName(participant.name);
    setParticipantError(undefined);
    setOpenMenuId(null);
    setIsModalOpen(true);
  }

  return (
    <section className={styles.participantPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIntro}>
        <div className={styles.stepIcon} aria-hidden="true">3</div>
        <div>
          <h2 id="wizard-step-title">{isPlayer ? "Oyuncular" : "Katılımcılar"}</h2>
          <p>{isPlayer ? "Turnuvada yer alacak oyuncuları ekleyin. Takımları sonraki adımda belirleyeceksiniz." : "Turnuvada yer alacak katılımcıları ekleyin."}</p>
        </div>
      </div>

      <div className={styles.participantContent}>
        <div className={styles.participantMain}>
          {error ? <p className={styles.participantStepError} role="alert">{error}</p> : null}
          <button type="button" className={styles.addParticipantButton} onClick={() => setIsModalOpen(true)}>
            <span aria-hidden="true">＋</span>
            <strong>{isPlayer ? "Oyuncu Ekle" : "Katılımcı Ekle"}</strong>
          </button>

          {participants.length > 0 ? (
            <ol className={styles.participantList} aria-label="Eklenen katılımcılar">
              {participants.map((participant, index) => (
                <li key={participant.id} className={styles.participantRow}>
                  <span className={styles.dragHandle} aria-hidden="true">⠿</span>
                  <span className={styles.participantOrder}>{index + 1}</span>
                  <span className={styles.participantAvatar} aria-hidden="true">{participant.name.charAt(0).toLocaleUpperCase("tr-TR")}</span>
                  <strong>{participant.name}</strong>
                  <div className={styles.participantMenuWrap}>
                    <button type="button" className={styles.participantMenuButton} aria-label={`${participant.name} seçenekleri`} aria-expanded={openMenuId === participant.id} onClick={() => setOpenMenuId((id) => id === participant.id ? null : participant.id)}>⋮</button>
                    {openMenuId === participant.id ? (
                      <div className={styles.participantMenu} role="menu">
                        <button type="button" role="menuitem" onClick={() => openEditModal(participant.id)}>✎ Düzenle</button>
                        <button type="button" role="menuitem" className={styles.deleteMenuItem} onClick={() => { onRemove(participant.id); setOpenMenuId(null); }}>⌫ Sil</button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <aside className={styles.participantInfoWidget} aria-label={isPlayer ? "Oyuncular hakkında" : "Katılımcılar hakkında"}>
          <span aria-hidden="true">ⓘ</span>
          <div>
            <strong>{isPlayer ? "Oyuncular hakkında" : "Katılımcılar hakkında"}</strong>
            <ul>
              <li>{isPlayer ? "Oyuncuları turnuvayı başlatana kadar düzenleyebilir veya silebilirsiniz." : "Katılımcıları turnuvayı başlatana kadar düzenleyebilir veya silebilirsiniz."}</li>
              <li>Logo ya da görsel eklemeniz gerekmez; yalnızca isim yeterlidir.</li>
            </ul>
          </div>
        </aside>
      </div>

      <Modal open={isModalOpen} title={editingParticipant ? (isPlayer ? "Oyuncuyu Düzenle" : "Katılımcıyı Düzenle") : (isPlayer ? "Oyuncu Ekle" : "Katılımcı Ekle")} onClose={closeModal}>
        <form className={styles.participantForm} onSubmit={handleSubmit}>
          <label htmlFor="participant-name">{isPlayer ? "Oyuncu Adı" : "Katılımcı Adı"} <span aria-hidden="true">*</span></label>
          <input
            id="participant-name"
            autoFocus
            maxLength={50}
            placeholder={isPlayer ? "Örn: Deniz" : "Örn: Kartallar FC"}
            value={participantName}
            aria-invalid={Boolean(participantError)}
            aria-describedby={participantError ? "participant-name-error" : undefined}
            onChange={(event) => { setParticipantName(event.target.value); setParticipantError(undefined); }}
          />
          <p className={styles.characterCount}>{participantName.length}/50</p>
          {participantError ? <p id="participant-name-error" className={styles.participantError} role="alert">{participantError}</p> : null}
          <div className={styles.participantPreview} aria-live="polite">
            <span className={styles.participantAvatar} aria-hidden="true">{normalizedName ? normalizedName.charAt(0).toLocaleUpperCase("tr-TR") : "?"}</span>
            <div><small>Önizleme</small><strong>{normalizedName || (isPlayer ? "Oyuncu adı" : "Katılımcı adı")}</strong></div>
          </div>
          <div className={styles.participantModalActions}>
            <Button type="button" variant="secondary" onClick={closeModal}>Vazgeç</Button>
            <Button type="submit" disabled={!normalizedName}>{editingParticipant ? "Kaydet" : isPlayer ? "Oyuncuyu Ekle" : "Katılımcıyı Ekle"}</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

function MultiTeamRulesForm({ rules, error, onChange }: { rules: LeagueRules; error?: string; onChange: (rules: LeagueRules) => void }) {
  return <section className={styles.rulesPanel}><div className={styles.stepIntro}><div className={styles.stepIcon}>4</div><div><h2 id="wizard-step-title">Puanlama Kuralları</h2><p>Her maçın sonucunda takım sahibine verilecek puanları belirleyin.</p></div></div><div className={styles.rulesCard}>{error ? <p role="alert">{error}</p> : null}<div className={styles.pointsGrid}>{([["winPoints", "Galibiyet"], ["drawPoints", "Beraberlik"], ["lossPoints", "Mağlubiyet"]] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={rules[key]} onChange={(event) => onChange({ ...rules, [key]: Number(event.target.value), drawAllowed: true, homeAway: false })} /></label>)}</div><p>Oyuncu çiftleri arasındaki her takım eşleşmesi bir kez oynanır.</p></div></section>;
}

function LeagueRulesForm({ rules, error, onChange }: { rules: LeagueRules; error?: string; onChange: (rules: LeagueRules) => void }) {
  const tieBreakers = ["Averaj (Atılan - Yenilen)", "Atılan Gol / Sayı", "İkili Averaj", "En Fazla Galibiyet", "Fair Play (En Az Kart)"];

  function updateRule(update: Partial<LeagueRules>) {
    onChange({ ...rules, ...update });
  }

  return (
    <section className={styles.rulesPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIntro}>
        <div className={styles.stepIcon} aria-hidden="true">4</div>
        <div><h2 id="wizard-step-title">Lig Kuralları</h2><p>Turnuvanın puanlama ve sıralama kurallarını belirleyin.</p></div>
      </div>
      <div className={styles.rulesContent}>
        <div className={styles.rulesCard}>
          {error ? <p className={styles.rulesError} role="alert">{error}</p> : null}
          <div><h3>Puanlama Sistemi</h3><p>Maç sonuçlarına göre verilecek puanları belirleyin.</p></div>
          <div className={styles.pointsGrid}>
            <label>Galibiyet Puanı<input type="number" min="0" value={rules.winPoints} onChange={(event) => updateRule({ winPoints: Number(event.target.value) })} /></label>
            <label>Beraberlik Puanı<input type="number" min="0" value={rules.drawPoints} disabled={!rules.drawAllowed} onChange={(event) => updateRule({ drawPoints: Number(event.target.value) })} /></label>
            <label>Mağlubiyet Puanı<input type="number" min="0" value={rules.lossPoints} onChange={(event) => updateRule({ lossPoints: Number(event.target.value) })} /></label>
          </div>
          <label className={styles.toggleRow}><span><strong>Beraberliğe izin ver</strong><small>Maçların berabere bitmesine izin ver.</small></span><input type="checkbox" checked={rules.drawAllowed} onChange={(event) => updateRule({ drawAllowed: event.target.checked })} /></label>
          {!rules.drawAllowed ? <p className={styles.rulesNotice}>Beraberliğe izin verilmezse tüm maçların kazananı olmak zorundadır.</p> : null}
          <div className={styles.fixtureStructure}>
            <div><h3>Fikstür Yapısı</h3><p>Maçlar tek sahada mı, yoksa ev sahibi–deplasman rövanşlarıyla mı oynanacak?</p></div>
            <div className={styles.fixtureStructureChoices} role="radiogroup" aria-label="Lig fikstür yapısı">
              <label className={styles.fixtureStructureChoice} data-selected={!rules.homeAway}>
                <input type="radio" name="league-fixture-structure" checked={!rules.homeAway} onChange={() => updateRule({ homeAway: false })} />
                <strong>Tek devre</strong><small>Her eşleşme bir kez oynanır. Tüm maçlar tek saha veya belirlenen sahada yapılabilir.</small>
              </label>
              <label className={styles.fixtureStructureChoice} data-selected={rules.homeAway}>
                <input type="radio" name="league-fixture-structure" checked={rules.homeAway} onChange={() => updateRule({ homeAway: true })} />
                <strong>Çift devre · Ev sahibi / deplasman</strong><small>Süper Lig usulü: ikinci devrede aynı eşleşme saha tarafları ters çevrilerek rövanş oynanır.</small>
              </label>
            </div>
          </div>
        </div>
        <div className={styles.rulesCard}>
          <div><h3>Puan Eşitliğinde Sıralama Kriterleri</h3><p>Öncelik sırasına göre düzenleyin.</p></div>
          <ol className={styles.tieBreakerList}>{tieBreakers.map((item, index) => <li key={item}><span aria-hidden="true">⠿</span><b>{index + 1}</b><strong>{item}</strong></li>)}</ol>
        </div>
        <aside className={styles.rulesInfo}><strong>Lig Formatı Hakkında</strong><p>Lig formatında tüm katılımcılar birbirleriyle oynar ve puan durumuna göre sıralanır.</p><ul><li>Tüm katılımcılar daha fazla maç yapar</li><li>Puan durumu sürekli güncel kalır</li><li>Uzun soluklu turnuvalar için idealdir</li></ul></aside>
      </div>
    </section>
  );
}

function KnockoutRulesForm({ rules, error, onChange }: { rules: KnockoutRules; error?: string; onChange: (rules: KnockoutRules) => void }) {
  function updateRule(update: Partial<KnockoutRules>) {
    onChange({ ...rules, ...update });
  }

  const tieBreakers: Array<{ value: KnockoutRules["tieBreaker"]; title: string; description: string }> = [
    { value: "EXTRA_TIME", title: "Uzatma oynansın", description: "Beraberlik durumunda uzatma süresi oynanır." },
    { value: "PENALTIES", title: "Direkt penaltılara geçilsin", description: "Beraberlik durumunda doğrudan penaltı atışları oynanır." },
    { value: "ORGANIZER", title: "Yönetici belirlesin", description: "Beraberlik durumunda kazananı turnuva yöneticisi belirler." },
  ];

  return (
    <section className={styles.rulesPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIntro}><div className={styles.stepIcon} aria-hidden="true">4</div><div><h2 id="wizard-step-title">Eleme Kuralları</h2><p>Turnuvanın eleme formatı kurallarını belirleyin.</p></div></div>
      <div className={styles.rulesContent}>
        <div className={styles.knockoutMain}>
          {error ? <p className={styles.rulesError} role="alert">{error}</p> : null}
          <p className={styles.rulesNotice}>Her maçın kazananı bir üst tura çıkar, kaybeden turnuvaya veda eder.</p>
          <div className={styles.knockoutSection}><h3>Turnuva Yapısı</h3><p>Eleme ağacı katılımcı sayısına göre otomatik oluşturulur. Sayı 2’nin kuvveti değilse sistem gerekli turda BYE atamasını kendisi yapar.</p></div>
          <div className={styles.knockoutSection}><h3>Beraberlik Durumunda</h3><p>Normal sürede beraberlik olursa kazanan nasıl belirlensin?</p><div className={styles.tieChoices}>{tieBreakers.map((option) => <label key={option.value}><input type="radio" name="knockout-tie-breaker" checked={rules.tieBreaker === option.value} onChange={() => updateRule({ tieBreaker: option.value })} /><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}</div></div>
        </div>
        <aside className={styles.rulesInfo}><strong>Eleme Formatı Hakkında</strong><p>Eleme formatında maçları kazanan takımlar bir üst tura çıkar, kaybeden takımlar turnuvaya veda eder.</p><ul><li>Daha kısa sürede tamamlanır</li><li>Heyecanlı ve çekişmeli maçlar</li><li>Farklı katılımcı sayıları ile oynanabilir</li><li>Kupa turnuvaları için ideal formattır</li></ul></aside>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  if (!value) return "Belirtilmedi";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function TournamentPreview({ draft, onEditStep }: { draft: TournamentWizardDraft; onEditStep: (step: number) => void }) {
  const isLeague = draft.format === "LEAGUE" || draft.format === "MULTI_TEAM";
  const isMultiTeam = draft.format === "MULTI_TEAM";
  const leagueRules = draft.rules && "drawAllowed" in draft.rules ? draft.rules : DEFAULT_LEAGUE_RULES;
  const knockoutRules = draft.rules && "bracketType" in draft.rules ? draft.rules : DEFAULT_KNOCKOUT_RULES;
  const formatName = isMultiTeam ? "Çok Takımlı Lig" : isLeague ? "Lig (Lig Usulü)" : draft.format === "KNOCKOUT" ? "Eleme (Knockout)" : "Belirtilmedi";
  const rulesReady = isLeague ? Boolean(draft.rules && "drawAllowed" in draft.rules && hasValidLeagueRules(draft.rules)) : Boolean(draft.rules && "bracketType" in draft.rules && hasValidKnockoutRules(draft.rules));
  const readinessItems = [
    { label: "Turnuva bilgileri doğru", complete: Boolean(draft.basicInfo.name && draft.basicInfo.startDate && (!draft.basicInfo.endDate || draft.basicInfo.endDate >= draft.basicInfo.startDate)) },
    { label: "Format seçildi", complete: Boolean(draft.format) },
    { label: "Katılımcılar eklendi", complete: isMultiTeam ? hasValidPlayers(draft.players) : draft.participants.length >= 2 },
    { label: "Kurallar belirlendi", complete: rulesReady },
  ];
  const isReady = readinessItems.every((item) => item.complete);

  return (
    <section className={styles.previewPanel} aria-labelledby="wizard-step-title">
      <div className={styles.stepIntro}><div className={styles.stepIcon} aria-hidden="true">5</div><div><h2 id="wizard-step-title">Önizleme</h2><p>Turnuvayı başlatmadan önce tüm bilgileri kontrol edin.</p></div></div>
      <div className={styles.previewGrid}>
        <article className={styles.previewCard}><header><h3>Temel Bilgiler</h3><button type="button" onClick={() => onEditStep(1)}>Düzenle</button></header><dl><div><dt>Turnuva Adı</dt><dd>{draft.basicInfo.name || "Belirtilmedi"}</dd></div><div><dt>Açıklama</dt><dd>{draft.basicInfo.description || "Belirtilmedi"}</dd></div><div><dt>Spor Dalı</dt><dd>{draft.basicInfo.category || "Belirtilmedi"}</dd></div><div><dt>Başlangıç Tarihi</dt><dd>{formatDate(draft.basicInfo.startDate)}</dd></div><div><dt>Bitiş Tarihi</dt><dd>{formatDate(draft.basicInfo.endDate)}</dd></div></dl></article>
        <article className={styles.previewCard}><header><h3>Format</h3><button type="button" onClick={() => onEditStep(0)}>Düzenle</button></header><dl><div><dt>Turnuva Formatı</dt><dd><span className={styles.formatBadge}>{formatName}</span></dd></div><div><dt>Katılımcı Sayısı</dt><dd>{isMultiTeam ? draft.players.length : draft.participants.length} katılımcı</dd></div><div><dt>Açıklama</dt><dd>{isMultiTeam ? "Oyuncuların takımları eşleşir; puanlar oyuncularda toplanır." : isLeague ? "Tüm katılımcılar birbirleriyle oynar ve puan durumuna göre sıralanır." : "Kaybeden elenir, kazanan bir üst tura çıkar."}</dd></div></dl></article>
        <article className={styles.previewCard}><header><h3>Katılımcılar</h3><button type="button" onClick={() => onEditStep(2)}>Düzenle</button></header>{isMultiTeam ? <ol className={styles.previewParticipants}>{draft.players.map((player) => <li key={player.id}><strong>{player.name}: {player.teams.map((team) => team.name).join(", ")}</strong></li>)}</ol> : draft.participants.length ? <ol className={styles.previewParticipants}>{draft.participants.map((participant, index) => <li key={participant.id}><b>{index + 1}</b><span>{participant.name.charAt(0).toLocaleUpperCase("tr-TR")}</span><strong>{participant.name}</strong></li>)}</ol> : <p className={styles.previewEmpty}>Henüz katılımcı eklenmedi.</p>}</article>
        <article className={styles.previewCard}><header><h3>{isLeague ? "Lig Kuralları" : "Eleme Kuralları"}</h3><button type="button" onClick={() => onEditStep(3)}>Düzenle</button></header>{isLeague ? <dl><div><dt>Galibiyet Puanı</dt><dd>{leagueRules.winPoints}</dd></div><div><dt>Beraberlik Puanı</dt><dd>{leagueRules.drawAllowed ? leagueRules.drawPoints : "Kapalı"}</dd></div><div><dt>Mağlubiyet Puanı</dt><dd>{leagueRules.lossPoints}</dd></div><div><dt>Beraberliğe İzin</dt><dd>{leagueRules.drawAllowed ? "Evet" : "Hayır"}</dd></div><div><dt>Fikstür Yapısı</dt><dd>{leagueRules.homeAway ? "Çift devre (ev/deplasman)" : "Tek devre"}</dd></div></dl> : <dl><div><dt>Eleme Ağacı</dt><dd>{(draft.participants.length & (draft.participants.length - 1)) === 0 ? "Standart Eleme" : "Gerekli turda otomatik BYE"}</dd></div><div><dt>Beraberlik Çözümü</dt><dd>{({ EXTRA_TIME: "Uzatma", PENALTIES: "Penaltılar", ORGANIZER: "Yönetici" })[knockoutRules.tieBreaker]}</dd></div></dl>}</article>
      </div>
      <aside className={styles.readinessCard} aria-live="polite"><div><span aria-hidden="true" data-ready={isReady}>{isReady ? "✓" : "!"}</span><div><strong>{isReady ? "Turnuvanız hazır!" : "Son kontroller gerekli"}</strong><p>{isReady ? "Bilgileri onayladıktan sonra turnuvayı başlatabilirsiniz." : "Başlatmadan önce eksik bilgileri tamamlayın."}</p></div></div><h3>Son Kontrol Listesi</h3><ul>{readinessItems.map((item) => <li data-complete={item.complete} key={item.label}><span aria-hidden="true">{item.complete ? "✓" : "!"}</span>{item.label}</li>)}</ul></aside>
    </section>
  );
}

export function TournamentWizard() {
  const router = useRouter();
  const [basicInfoErrors, setBasicInfoErrors] = useState<BasicInfoErrors>({});
  const [formatError, setFormatError] = useState<string>();
  const [participantStepError, setParticipantStepError] = useState<string>();
  const [playerPhase, setPlayerPhase] = useState<"players" | "teams">("players");
  const [leagueRulesError, setLeagueRulesError] = useState<string>();
  const [knockoutRulesError, setKnockoutRulesError] = useState<string>();
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
  const [startError, setStartError] = useState<string>();
  const [isStarting, startTransition] = useTransition();
  const startRequestInFlight = useRef(false);
  const { currentStep, draft, isDirty, setCurrentStep, updateDraft, updateBasicInfo, updateFormat, updateLeagueRules, updateKnockoutRules, addParticipant, updateParticipant, removeParticipant, clearSessionDraft } = useTournamentWizardState();
  const { registerWizard, requestLeave } = useWizardLeaveGuard();
  const step = WIZARD_STEPS[Math.min(currentStep, WIZARD_STEPS.length - 1)];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const previousPosition = useRef({ step: currentStep, phase: playerPhase });

  useEffect(() => {
    const previous = previousPosition.current;
    previousPosition.current = { step: currentStep, phase: playerPhase };
    if (previous.step !== currentStep || (currentStep === 2 && previous.phase !== playerPhase)) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentStep, playerPhase]);

  function goToPreviousStep() {
    if (draft.format === "MULTI_TEAM" && currentStep === 2 && playerPhase === "teams") { setPlayerPhase("players"); setParticipantStepError(undefined); return; }
    if (draft.format === "MULTI_TEAM" && currentStep === 3) setPlayerPhase("teams");
    setCurrentStep(Math.max(0, currentStep - 1));
  }

  function goToNextStep() {
    if (currentStep === 1) {
      const errors = validateBasicInfo(draft.basicInfo);
      setBasicInfoErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    if (currentStep === 0 && !draft.format) {
      setFormatError("Devam etmek için bir turnuva formatı seçin.");
      return;
    }

    if (currentStep === 2 && draft.format === "MULTI_TEAM" && playerPhase === "players") {
      if (!hasValidPlayerNames(draft.players)) { setParticipantStepError("En az iki farklı oyuncu adı girin."); return; }
      setParticipantStepError(undefined); setPlayerPhase("teams"); return;
    }
    if (currentStep === 2 && (draft.format === "MULTI_TEAM" ? !hasValidPlayers(draft.players) : draft.participants.length < 2)) {
      setParticipantStepError(draft.format === "MULTI_TEAM" ? "En az iki farklı oyuncu ve her oyuncu için eşit sayıda, boş olmayan takım ekleyin." : "Devam etmek için en az 2 katılımcı eklemelisiniz.");
      return;
    }

    if (currentStep === 3 && (draft.format === "LEAGUE" || draft.format === "MULTI_TEAM")) {
      const rules = draft.rules && "drawAllowed" in draft.rules ? draft.rules : DEFAULT_LEAGUE_RULES;
      if (!hasValidLeagueRules(rules)) {
        setLeagueRulesError("Puanlar sıfır veya daha büyük tam sayılar olmalıdır.");
        return;
      }
    }

    if (currentStep === 3 && draft.format === "KNOCKOUT") {
      const rules = draft.rules && "bracketType" in draft.rules ? draft.rules : DEFAULT_KNOCKOUT_RULES;
      if (!hasValidKnockoutRules(rules)) {
        setKnockoutRulesError("Eleme ağacı ve beraberlik çözüm seçimi geçerli olmalıdır.");
        return;
      }
    }

    setCurrentStep(Math.min(WIZARD_STEPS.length - 1, currentStep + 1));
  }

  function requestStepChange(nextStep: number) {
    if (nextStep > currentStep + 1) return;

    if (nextStep > currentStep && currentStep === 2 && draft.format === "MULTI_TEAM" && playerPhase === "players") { goToNextStep(); return; }
    if (nextStep === 2 && currentStep > 2 && draft.format === "MULTI_TEAM") setPlayerPhase("teams");

    if (nextStep > currentStep && currentStep === 1) {
      const errors = validateBasicInfo(draft.basicInfo);
      setBasicInfoErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    if (nextStep > currentStep && currentStep === 0 && !draft.format) {
      setFormatError("Devam etmek için bir turnuva formatı seçin.");
      return;
    }

    if (nextStep > currentStep && currentStep === 2 && (draft.format === "MULTI_TEAM" ? !hasValidPlayers(draft.players) : draft.participants.length < 2)) {
      setParticipantStepError(draft.format === "MULTI_TEAM" ? "En az iki farklı oyuncu ve her oyuncu için eşit sayıda, boş olmayan takım ekleyin." : "Devam etmek için en az 2 katılımcı eklemelisiniz.");
      return;
    }

    if (nextStep > currentStep && currentStep === 3 && (draft.format === "LEAGUE" || draft.format === "MULTI_TEAM")) {
      const rules = draft.rules && "drawAllowed" in draft.rules ? draft.rules : DEFAULT_LEAGUE_RULES;
      if (!hasValidLeagueRules(rules)) {
        setLeagueRulesError("Puanlar sıfır veya daha büyük tam sayılar olmalıdır.");
        return;
      }
    }

    if (nextStep > currentStep && currentStep === 3 && draft.format === "KNOCKOUT") {
      const rules = draft.rules && "bracketType" in draft.rules ? draft.rules : DEFAULT_KNOCKOUT_RULES;
      if (!hasValidKnockoutRules(rules)) {
        setKnockoutRulesError("Eleme ağacı ve beraberlik çözüm seçimi geçerli olmalıdır.");
        return;
      }
    }

    setCurrentStep(nextStep);
  }

  function handleBasicInfoChange(update: Partial<TournamentWizardDraft["basicInfo"]>) {
    updateBasicInfo(update);
    setBasicInfoErrors((errors) => {
      const nextErrors = { ...errors };
      if (update.name !== undefined) delete nextErrors.name;
      if (update.startDate !== undefined) {
        delete nextErrors.startDate;
        delete nextErrors.endDate;
      }
      if (update.endDate !== undefined) delete nextErrors.endDate;
      return nextErrors;
    });
  }

  function requestExit() {
    requestLeave(() => router.push("/dashboard/tournaments"));
  }

  function requestStart() {
    setStartError(undefined);
    setIsStartConfirmOpen(true);
  }

  function confirmStart() {
    if (startRequestInFlight.current) return;
    startRequestInFlight.current = true;
    startTransition(async () => {
      const result = draft.format === "MULTI_TEAM" ? await startMultiTeamTournament(draft) : draft.format === "KNOCKOUT" ? await startKnockoutTournament(draft) : await startLeagueTournament(draft);
      if (result?.error || !result?.tournamentId) {
        setStartError(result?.error ?? "Turnuva başlatılamadı. Lütfen tekrar deneyin.");
        startRequestInFlight.current = false;
        return;
      }
      // A successful start is the terminal state of this draft. Retain the
      // draft on errors, but never prefill the next tournament with it.
      clearSessionDraft();
      setIsStartConfirmOpen(false);
      router.push(`/dashboard/tournaments/${result.tournamentId}`);
    });
  }

  useEffect(() => {
    if (!isDirty) return;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    registerWizard({ isDirty, discard: clearSessionDraft });
    return () => registerWizard(null);
  }, [clearSessionDraft, isDirty, registerWizard]);

  return (
    <div className={styles.wizard} data-wizard-storage="local-only" data-has-local-draft={Boolean(draft)}>
      <header className={styles.heading}>
        <button type="button" className={styles.backLink} onClick={requestExit}>← Turnuvalarıma dön</button>
        <div className={styles.headingRow}>
          <div>
            <h1>Yeni Turnuva Oluştur</h1>
            <p>Kendi turnuvanızı oluşturun, katılımcılarınızı ekleyin ve heyecanı başlatın.</p>
          </div>
          <button type="button" className={styles.cancelLink} onClick={requestExit}>× İptal Et</button>
        </div>
      </header>

      <ol className={styles.stepper} aria-label="Turnuva oluşturma adımları">
        {WIZARD_STEPS.map((item, index) => {
          const state = index === currentStep ? "current" : index < currentStep ? "complete" : "upcoming";

          return (
            <li className={styles.stepItem} data-state={state} key={item.title}>
              <button
                type="button"
                className={styles.stepButton}
                aria-current={index === currentStep ? "step" : undefined}
                onClick={() => requestStepChange(index)}
              >
                <span className={styles.stepNumber}>{index + 1}</span>
                <span>{index === 2 && draft.format === "MULTI_TEAM" ? "Oyuncular ve Takımlar" : item.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {currentStep === 1 ? <BasicInfoForm basicInfo={draft.basicInfo} errors={basicInfoErrors} onChange={handleBasicInfoChange} /> : currentStep === 0 ? <FormatSelection value={draft.format} error={formatError} onChange={(format) => { updateFormat(format); setFormatError(undefined); }} /> : currentStep === 2 && draft.format === "MULTI_TEAM" ? playerPhase === "players" ? <ParticipantStep isPlayer participants={draft.players} error={participantStepError} onAdd={(name) => { updateDraft({ players: [...draft.players, { id: crypto.randomUUID(), name, teams: [] }] }); setParticipantStepError(undefined); }} onUpdate={(id, name) => updateDraft({ players: draft.players.map((player) => player.id === id ? { ...player, name } : player) })} onRemove={(id) => updateDraft({ players: draft.players.filter((player) => player.id !== id) })} /> : <MultiTeamPlayers phase="teams" players={draft.players} error={participantStepError} onChange={(players) => { updateDraft({ players }); setParticipantStepError(undefined); }} /> : currentStep === 2 ? <ParticipantStep participants={draft.participants} error={participantStepError} onAdd={(name) => { addParticipant(name); setParticipantStepError(undefined); }} onUpdate={updateParticipant} onRemove={removeParticipant} /> : currentStep === 3 && draft.format === "MULTI_TEAM" ? <MultiTeamRulesForm rules={draft.rules && "drawAllowed" in draft.rules ? { ...draft.rules, drawAllowed: true, homeAway: false } : DEFAULT_LEAGUE_RULES} error={leagueRulesError} onChange={(rules) => { updateLeagueRules(rules); setLeagueRulesError(undefined); }} /> : currentStep === 3 && draft.format === "LEAGUE" ? <LeagueRulesForm rules={draft.rules && "drawAllowed" in draft.rules ? draft.rules : DEFAULT_LEAGUE_RULES} error={leagueRulesError} onChange={(rules) => { updateLeagueRules(rules); setLeagueRulesError(undefined); }} /> : currentStep === 3 && draft.format === "KNOCKOUT" ? <KnockoutRulesForm rules={draft.rules && "bracketType" in draft.rules ? draft.rules : DEFAULT_KNOCKOUT_RULES} error={knockoutRulesError} onChange={(rules) => { updateKnockoutRules(rules); setKnockoutRulesError(undefined); }} /> : currentStep === 4 ? <TournamentPreview draft={draft} onEditStep={setCurrentStep} /> : <StepPlaceholder step={step} stepNumber={currentStep + 1} />}

      <footer className={styles.actions}>
        {isFirstStep ? <button type="button" className={styles.secondaryLink} onClick={requestExit}>İptal Et</button> : <Button variant="secondary" onClick={goToPreviousStep}>← Geri</Button>}
        <Button onClick={isLastStep ? requestStart : goToNextStep} disabled={isStarting}>
          {isLastStep ? "Turnuvayı Başlat" : "Devam Et →"}
        </Button>
        {!isFirstStep && <button type="button" className={styles.mobileCancel} onClick={requestExit}>İptal Et</button>}
      </footer>

      <Modal open={isStartConfirmOpen} title={`${draft.format === "KNOCKOUT" ? "Eleme" : "Lig"} turnuvası başlatılsın mı?`} onClose={() => !isStarting && setIsStartConfirmOpen(false)}>
        <div className={styles.participantForm}>
          <p>Katılımcılar, kurallar ve otomatik oluşturulan fikstür kaydedilecek. Turnuva başladıktan sonra format ve puanlama kuralları değiştirilemez.</p>
          {startError ? <p className={styles.rulesError} role="alert">{startError}</p> : null}
          <div className={styles.participantModalActions}>
            <Button type="button" variant="secondary" disabled={isStarting} onClick={() => setIsStartConfirmOpen(false)}>Vazgeç</Button>
            <Button type="button" disabled={isStarting} onClick={confirmStart}>{isStarting ? "Başlatılıyor…" : "Fikstürü Oluştur ve Başlat"}</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
