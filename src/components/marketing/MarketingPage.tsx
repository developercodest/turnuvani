import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Share2, Trophy, Users } from "lucide-react";
import { AuthHeader } from "@/components/brand/AuthHeader";
import styles from "./marketing.module.css";

type MarketingPageProps = { focus: "features" | "how-it-works" };

const steps = [
  { number: "01", title: "Turnuvanı kur", text: "Lig veya eleme formatını seç; tarihini, kurallarını ve katılımcılarını ekle.", icon: Trophy },
  { number: "02", title: "Fikstürü yönet", text: "Otomatik oluşan eşleşmeleri planla, sonuçları gir ve puan durumunu anında güncelle.", icon: CalendarDays },
  { number: "03", title: "Herkesle paylaş", text: "Tek bir public bağlantıyla fikstürü, skorları ve turnuva görünümünü izleyicilere aç.", icon: Share2 },
];

export function MarketingPage({ focus }: MarketingPageProps) {
  const focusId = focus === "features" ? "ozellikler" : "nasil-calisir";
  return <main className={styles.page} id={focusId}>
    <AuthHeader />

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>TURNUVANI SAHADA TUT</p>
        <h1>Organizasyonun değil, <span>oyunun</span> merkezde olsun.</h1>
        <p>Turnuvani; turnuva oluşturma, fikstür yönetimi, sonuç takibi ve paylaşımı tek, sade akışta birleştirir.</p>
        <div className={styles.heroActions}><Link href="/register">Turnuvanı oluşturmaya başla <ArrowRight /></Link><a href="#nasil-calisir">Akışı incele</a></div>
        <ul><li><CheckCircle2 /> Lig ve eleme formatları</li><li><CheckCircle2 /> Anlık sonuç ve puan durumu</li><li><CheckCircle2 /> Herkese açık turnuva bağlantısı</li></ul>
      </div>
      <div className={styles.productVisual} aria-label="Turnuvani ürün görünümü">
        <div className={styles.visualTop}><span>HAFTA 3</span><b>Şehir Kupası</b><i>Canlı</i></div>
        <div className={styles.scoreCard}><div><span className={styles.teamMark}>A</span><b>Anka Spor</b></div><strong>2 <em>—</em> 1</strong><div><span className={styles.teamMark} data-tone="orange">K</span><b>Kuzey FK</b></div></div>
        <div className={styles.tablePreview}><div><b>#</b><b>Takım</b><b>O</b><b>P</b></div><div><strong>1</strong><span><i />Anka Spor</span><span>3</span><b>9</b></div><div><strong>2</strong><span><i data-tone="orange" />Kuzey FK</span><span>3</span><b>6</b></div><div><strong>3</strong><span><i data-tone="green" />Mavi Yıldız</span><span>3</span><b>4</b></div></div>
        <div className={styles.shareBubble}><Share2 /><span>Canlı görünüm<br /><b>herkese açık</b></span></div>
      </div>
    </section>

    <section className={styles.featureSection} id="ozellikler">
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>NE İŞE YARAR?</p><h2>Turnuva akışının her aşaması, tek yerde.</h2><p>Dağınık tablolar ve mesaj trafiği yerine, herkesin takip edebileceği net bir merkez.</p></div>
      <div className={styles.featureGrid}>
        <article><span><Trophy /></span><h3>Esnek formatlar</h3><p>Lig veya tek maçlı eleme seçin. Sistem, yapıya uygun fikstürü sizin için hazırlar.</p></article>
        <article><span><Users /></span><h3>Katılımcılar kontrol altında</h3><p>Takımları ekleyin, başlayın; fikstür oluştuktan sonra yapıyı güvenle koruyun.</p></article>
        <article><span><CalendarDays /></span><h3>Maçları planlayın</h3><p>Tarih ve konum bilgilerini düzenleyin; herkes sıradaki karşılaşmayı tek bakışta görsün.</p></article>
        <article><span><Share2 /></span><h3>Paylaşması kolay</h3><p>Public bağlantıyı gönderin. İzleyiciler skorları ve turnuva görünümünü hesap açmadan takip etsin.</p></article>
      </div>
    </section>

    <div className={styles.stepsBackground}>
      <section className={styles.stepsSection} id="nasil-calisir">
        <div className={styles.sectionIntro}><p className={styles.eyebrow}>NASIL ÇALIŞIR?</p><h2>Üç adımda maç gününe hazır.</h2></div>
        <div className={styles.steps}>{steps.map(({ number, title, text, icon: Icon }) => <article key={number}><span>{number}</span><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
    </div>

    <section className={styles.closing}><div><p className={styles.eyebrow}>HAZIR MISIN?</p><h2>Bir sonraki turnuvan daha düzenli başlasın.</h2><p>Fikstürü oluştur, maçları takip et ve turnuvanla ilgili herkesi aynı sayfada buluştur.</p></div><Link href="/register">Ücretsiz hesap oluştur <ArrowRight /></Link></section>
    <footer className={styles.footer}><Link href="/login">Turnuvani</Link><span>Turnuvalar için sade yönetim deneyimi.</span></footer>
  </main>;
}
