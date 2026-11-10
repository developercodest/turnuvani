import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Crown, GitBranch, Trophy, UsersRound } from "lucide-react";
import { AuthHeader } from "@/components/brand/AuthHeader";
import styles from "./turnuva-formatlari.module.css";

export const metadata: Metadata = {
  title: "Turnuva Formatları | Turnuvani",
  description: "Turnuvani'nin çok takımlı lig, lig ve eleme turnuva formatlarını inceleyin.",
};

const multiTeamBenefits = [
  "Oyuncular kendi takımlarını seçer; klasik takım listesinin ötesine geçersiniz.",
  "Her oyuncu çifti için rastgele eşleşmeler oluşturulur.",
  "Takımlar sahada mücadele ederken puanlar oyuncuların hanesine yazılır.",
  "Herkes aynı sayıda takımla başladığı için oyun dengesi baştan korunur.",
];

const formats = [
  {
    title: "Lig",
    description: "Tüm katılımcıların birbirleriyle oynadığı, puan tablosunun her maçtan sonra güncellendiği klasik format.",
    icon: Trophy,
    bestFor: "Uzun soluklu ligler ve düzenli maç günleri",
    points: ["Herkes birbirine karşı oynar", "Canlı puan durumu oluşur", "Ev sahibi–deplasman seçeneği sunar"],
    screenshot: "/images/league-standings-preview.png",
    screenshotAlt: "Lig formatındaki örnek puan durumu ekranı",
    screenshotLabel: "Canlı puan durumu",
  },
  {
    title: "Eleme",
    description: "Her karşılaşmanın bir sonraki turu belirlediği, hızlı ve heyecanlı kupa düzeni.",
    icon: GitBranch,
    bestFor: "Kısa sürede sonuçlanan kupa turnuvaları",
    points: ["Tek maçlı eleme yapısı", "Kazanan bir üst tura çıkar", "Farklı katılımcı sayılarıyla çalışır"],
    screenshot: "/images/knockout-bracket-preview.png",
    screenshotAlt: "Eleme formatındaki örnek turnuva ağacı ekranı",
    screenshotLabel: "Turnuva ağacı",
  },
];

export default function TournamentFormatsPage() {
  return (
    <main className={styles.page}>
      <AuthHeader />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>TURNUVANI FORMATLARI</p>
        <h1>Her turnuvaya uygun yapı.<br /><span>Her oyuncuya net bir deneyim.</span></h1>
        <p>Turnuvani, klasik turnuva düzenlerinin yanında oyuncu merkezli çok takımlı ligi de tek akışta yönetmenizi sağlar.</p>
      </section>

      <section className={styles.featured} aria-labelledby="multi-team-title">
        <div className={styles.featuredCopy}>
          <p className={styles.badge}><Crown /> TURNUVANI&apos;YE ÖZEL DENEYİM</p>
          <h2 id="multi-team-title">Çok Takımlı Lig</h2>
          <p className={styles.lead}>Takımlar değil, oyuncular yarışın merkezinde. Her oyuncu kendi takımlarını seçer; maçlar bu seçimler üzerinden oluşur ve puanlar oyuncuların genel sıralamasında toplanır.</p>
          <ul>
            {multiTeamBenefits.map((benefit) => <li key={benefit}><Check />{benefit}</li>)}
          </ul>
          <Link href="/register" className={styles.primaryAction}>Çok Takımlı Lig oluştur <ArrowRight /></Link>
        </div>

        <div className={styles.scoreboard} aria-label="Çok Takımlı Lig örnek puan durumu">
          <div className={styles.boardHeader}><span><UsersRound /> 6 OYUNCU</span><strong>Hafta 4</strong></div>
          <div className={styles.boardTitle}><div><small>OYUNCU LİGİ</small><b>Genel sıralama</b></div><span>Canlı</span></div>
          <div className={styles.boardTable}>
            <div className={styles.tableHeading}><span>#</span><span>Oyuncu</span><span>O</span><span>P</span></div>
            <div><b>1</b><span><i data-tone="purple" />Ece</span><span>5</span><strong>12</strong></div>
            <div><b>2</b><span><i data-tone="orange" />Mert</span><span>5</span><strong>10</strong></div>
            <div><b>3</b><span><i data-tone="blue" />Deniz</span><span>5</span><strong>8</strong></div>
          </div>
          <p><Check /> Puanlar oyuncularda toplanır</p>
        </div>
      </section>

      <section className={styles.otherFormats} aria-labelledby="other-formats-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>KLASİK FORMATLAR</p>
          <h2 id="other-formats-title">Alışık olduğunuz düzenler de hazır.</h2>
        </div>
        <div className={styles.formatGrid}>
          {formats.map(({ title, description, icon: Icon, bestFor, points, screenshot, screenshotAlt, screenshotLabel }) => (
            <article key={title}>
              <span className={styles.formatIcon}><Icon /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <div><small>EN UYGUN</small><strong>{bestFor}</strong></div>
              <ul>{points.map((point) => <li key={point}><Check />{point}</li>)}</ul>
              <figure className={styles.screenshot}>
                <Image src={screenshot} alt={screenshotAlt} fill sizes="(max-width: 780px) 100vw, 50vw" />
                <figcaption>{screenshotLabel}</figcaption>
              </figure>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <div><p className={styles.eyebrow}>BAŞLAMAYA HAZIR MISIN?</p><h2>Formatı seçin, fikstürü Turnuvani oluştursun.</h2></div>
        <Link href="/register">Ücretsiz hesap oluştur <ArrowRight /></Link>
      </section>
    </main>
  );
}
