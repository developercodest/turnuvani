# Turnuvani mimarisi

Turnuvani, Next.js App Router, React ve TypeScript ile geliştirilmiş bir turnuva yönetim uygulamasıdır. Kimlik doğrulama ve kalıcı veriler Supabase Auth/PostgreSQL üzerinde çalışır.

## Kaynak haritası

- `src/app/`: Rotalar, layout'lar, route handler'lar ve Server Action'lar.
- `src/features/`: Ekran odaklı işlevler; turnuva oluşturma sihirbazı ve kimlik doğrulama akışı burada bulunur.
- `src/lib/`: Bağımsız domain motorları ve altyapı yardımcıları. Lig, eleme ve Çok Takımlı Lig kuralları burada test edilir.
- `src/services/`: Veri erişim ve uygulama servisleri.
- `src/components/`: Tekrar kullanılabilir arayüz bileşenleri.
- `supabase/migrations/`: PostgreSQL şema, RLS ve fonksiyon değişikliklerinin sıralı kaydı.
- `supabase/tests/`: Yerel Supabase ortamında çalışan SQL güvenlik ve bütünlük testleri.
- `scripts/`: Yerel geliştirme ve doğrulama betikleri.

## Temel sınırlar

- Domain motorları arayüzden ve Supabase istemcisinden bağımsız kalır. Kuralları değiştiren iş mantığı önce ilgili `src/lib` modülünde ve testinde ele alınır.
- Tarayıcıya yalnızca `NEXT_PUBLIC_` ile güvenle paylaşılabilir Supabase URL ve publishable key gidebilir. Secret veya service-role anahtarı hiçbir istemci koduna eklenmez.
- Yönetim işlemleri sunucu katmanı ve veritabanı sahiplik denetimleriyle korunur. RLS ya da RPC yetkisini zayıflatmak için kısa yol kullanılmaz.
- Herkese açık turnuva görünümü, paylaşılabilir bağlantı için salt okunurdur; özel yönetim verileri ve profil bilgileri public sorgulara eklenmez.

## Veri modeli ve turnuva formatları

Uygulama lig, eleme ve Çok Takımlı Lig formatlarını destekler. Turnuvalar, katılımcılar ve maçlar Supabase'te tutulur. Çok Takımlı Lig için oyuncuların takımları ve maç-takım ilişkileri ayrıca modellenir. Şema değişikliğinde mevcut migration'ları geriye dönük düzenlemeyin; yeni, sıralı bir migration ekleyin.

## Kimlik doğrulama

E-posta doğrulama, şifre yenileme ve OAuth dönüşleri `/auth/callback` üzerinden işlenir. Callback rotasında yalnızca uygulamanın izin verdiği hedeflere yönlendirme yapılmalıdır. Kimlik doğrulama davranışını değiştirirken kayıt, giriş, doğrulama, şifre yenileme ve korumalı dashboard erişimini birlikte gözden geçirin.
