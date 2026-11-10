import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | Turnuvani",
  description: "Turnuvani kullanım koşulları",
};

export default function TermsPage() {
  return (
    <article className={styles.content}>
      <p className={styles.eyebrow}>HUKUKİ BİLGİLENDİRME</p>
      <h1 className={styles.title}>Kullanım Koşulları</h1>
      <p className={styles.updated}>Son güncelleme: 19 Ekim 2026</p>
      <div className={styles.document}>
        <h2>1. Kapsam</h2>
        <p>Bu koşullar, Turnuvani üzerinden sunulan turnuva oluşturma, yönetme ve paylaşma hizmetlerinin kullanımını düzenler. Hesap oluşturarak bu koşulları kabul etmiş olursunuz.</p>
        <h2>2. Hesap ve güvenlik</h2>
        <p>Hesabınız için doğru ve güncel bilgi vermek, giriş bilgilerinizi korumak ve hesabınız üzerinden gerçekleşen işlemlerden sorumlu olmak size aittir. Hesabınızın yetkisiz kullanıldığını düşünürseniz bizimle gecikmeden iletişime geçmelisiniz.</p>
        <h2>3. İçerik ve kullanım kuralları</h2>
        <p>Turnuvalarınıza eklediğiniz takım, katılımcı, skor ve açıklama bilgilerinin hukuka uygunluğundan siz sorumlusunuz. Hizmeti; başkalarının haklarını ihlal eden, yanıltıcı, saldırgan veya hukuka aykırı içerik paylaşmak için kullanamazsınız.</p>
        <h2>4. Hizmetin sunulması</h2>
        <p>Turnuvani, hizmetin güvenli ve kesintisiz çalışması için makul çabayı gösterir. Bakım, güvenlik veya teknik gereklilik hâllerinde hizmette geçici değişiklik ya da kesinti yaşanabilir.</p>
        <h2>5. Fikri mülkiyet</h2>
        <p>Turnuvani markası, arayüzü ve hizmete ait özgün unsurlar korunur. Bu unsurlar, önceden yazılı izin olmadan kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.</p>
        <h2>6. Değişiklikler ve iletişim</h2>
        <p>Bu koşullar gerektiğinde güncellenebilir. Esaslı değişiklikler yürürlüğe girmeden önce uygulama içinde veya kayıtlı e-posta adresiniz üzerinden bildirilebilir. Kişisel verilerinizin işlenmesine ilişkin ayrıntılar için <Link href="/gizlilik-politikasi">Gizlilik Politikası ve KVKK Aydınlatma Metni</Link>&apos;ni inceleyin.</p>
      </div>
    </article>
  );
}
