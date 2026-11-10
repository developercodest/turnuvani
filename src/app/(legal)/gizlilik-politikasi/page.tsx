import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Turnuvani",
  description: "Turnuvani gizlilik politikası ve KVKK aydınlatma metni",
};

export default function PrivacyPage() {
  return (
    <article className={styles.content}>
      <p className={styles.eyebrow}>HUKUKİ BİLGİLENDİRME</p>
      <h1 className={styles.title}>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
      <p className={styles.updated}>Son güncelleme: 2 Kasım 2026</p>
      <div className={styles.document}>
        <h2>1. Veri sorumlusu</h2>
        <p>Turnuvani hizmetinin veri sorumlusu Ufuk Ünal&apos;dır. Adres: Kaleiçi Mahallesi, Örnek Sokak, No: 6, D: 4, Çatalca / İstanbul. KVKK kapsamındaki başvurularınızı <a href="mailto:developer.ufukunal@gmail.com">developer.ufukunal@gmail.com</a> adresine iletebilirsiniz.</p>
        <h2>2. İşlenen kişisel veriler</h2>
        <p>Hesap oluştururken ad soyad, e-posta adresi ve giriş sağlayıcısının ilettiği hesap bilgileri; hizmeti kullanırken oluşturduğunuz turnuva, katılımcı, takım ve maç bilgileri işlenir. Oturum güvenliği ve hata incelemesi için teknik kayıtlar da tutulabilir.</p>
        <h2>3. İşleme amaçları ve hukuki sebep</h2>
        <p>Veriler; üyelik hesabını oluşturmak ve yönetmek, hizmeti sunmak, güvenliği sağlamak, destek taleplerini yanıtlamak ve yasal yükümlülükleri yerine getirmek amacıyla işlenir. Somut işlem için uygun hukuki sebep, KVKK&apos;nın 5. maddesi kapsamındaki şartlara göre belirlenir.</p>
        <h2>4. Aktarım ve yurt dışı aktarımı</h2>
        <p>Hizmetin çalışması için Supabase (kimlik doğrulama ve veritabanı), Vercel (barındırma) ve Google (Google ile giriş) hizmetlerinden yararlanılır. Veriler yalnızca hizmetin işletilmesi, güvenliği ve destek taleplerinin yanıtlanması amacıyla bu sağlayıcılara aktarılabilir. Bu sağlayıcıların yurt dışındaki altyapılarını kullanması hâlinde aktarım, KVKK&apos;nın yurt dışına aktarım hükümlerine uygun mekanizmalar değerlendirilerek yürütülür.</p>
        <h2>5. Saklama, güvenlik ve silme</h2>
        <p>Hesap ve turnuva verileri, hesap aktif olduğu süre boyunca saklanır. Kullanıcı, profil ayarlarında kalıcı silme işlemini onayladığında hesabı, oluşturduğu turnuvalar ve bunlara bağlı katılımcı, takım ve maç kayıtları geri alınamaz biçimde silinir. Erişim yetkileri ve teknik güvenlik önlemleri, verilerin yetkisiz erişime karşı korunması için uygulanır.</p>
        <h2>6. Haklarınız ve başvuru</h2>
        <p>KVKK&apos;nın 11. maddesi kapsamındaki bilgi alma, düzeltme, silme veya işlemeye itiraz etme gibi haklarınızı profil ayarları içindeki kalıcı hesap silme alanından veya <a href="mailto:developer.ufukunal@gmail.com">developer.ufukunal@gmail.com</a> adresinden iletebilirsiniz.</p>
        <h2>7. Pazarlama iletişimi</h2>
        <p>Tanıtım veya kampanya iletileri için üyelikten bağımsız, isteğe bağlı bir izin alınır. Bu izni vermemek hizmeti kullanmanıza engel olmaz; verdiğiniz izni dilediğiniz zaman geri çekebilirsiniz.</p>
      </div>
    </article>
  );
}
