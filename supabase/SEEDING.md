# Seed ve test verisi yaklaşımı

## Amaç

Yerel geliştirme ve otomatik testlerde tekrarlanabilir, gerçek kişi verisi içermeyen örnek veri kullanılır. Migration'lar şemayı; seed verisi ise yalnızca geliştirme/test içeriğini kurar.

## Ortam kuralları

- **Yerel geliştirme:** Seed verisi kullanılabilir ve sıfırlanabilir.
- **Preview/staging:** Gerekirse sadece bu ortam için ayrı, anonimleştirilmiş veri kullanılır.
- **Production:** Seed çalıştırılmaz. Gerçek kullanıcı, e-posta, turnuva veya erişim anahtarı test verisi olarak eklenmez.

## Veri ilkeleri

- Örnek e-posta adresleri `*.test` alan adı kullanır; gerçek teslimat yapılmaz.
- Kimlik doğrulama kullanıcıları SQL ile doğrudan `auth.users` tablosuna yazılmaz. Yerel test kullanıcıları ilgili Auth akışı veya yalnızca yerel, gizli anahtar içermeyen geliştirme aracıyla oluşturulur.
- Şifre, erişim token'ı, service-role anahtarı ve kişisel veri seed dosyalarına eklenmez.
- Seed tekrar çalıştırılabilir olmalıdır: sabit kimlikler veya güvenli upsert yaklaşımı kullanılmalı; tekrar çalıştırma çift kayıt oluşturmamalıdır.
- RLS testleri en az iki farklı test kullanıcısı ile, sahiplik ve yetkisiz erişim senaryolarını kapsar.

## Uygulama akışı

1. Şema değişikliğini önce `migrations/` altına yeni bir migration olarak ekleyin.
2. O tablo için gerekli örnek veriyi, yalnızca gerçek bir kullanım senaryosu oluştuğunda yerel seed dosyasına ekleyin.
3. Yerel Supabase CLI yapılandırıldıktan sonra seed, `supabase db reset` ile migration'ların ardından uygulanır.
4. Uzak ortama veri yüklemeden önce ortamın production olmadığını ve seed içeriğinin anonim olduğunu doğrulayın.

## Yerel veritabanı testleri

Docker çalışırken proje kökünden `npx --yes supabase@2.75.0 start` ile yerel ortamı açın. Ardından `npm run test:db:local` çalıştırın. Test komutu yalnızca yerel `turnuvani-isolated` projesini ve localhost API adresini kabul eder; migration sürümlerinin dosyalarla eşleşmesini kontrol eder. Auth admin API üzerinden iki ayrılmış `.test` hesabını rastgele şifrelerle oluşturur, testleri geri alınan işlemlerde çalıştırır ve yalnızca bu çalıştırmada oluşturduğu hesapları temizler. Ayrılmış adresler önceden varsa test durur ve var olan hesaba dokunmaz. Anahtarlar test sırasında yalnızca yerel CLI çıktısından bellekte okunur, dosyaya kaydedilmez.

Kullanıcılar yalnızca test süresi için oluşturulur; kalıcı `seed.sql` yoktur. Çalışma aniden kesilirse temizleme tamamlanamayabilir; yerel test ortamında ayrılmış adresleri kontrol edin. Bu araç uzak geliştirme veya canlı ortamda çalışmaz. Sıfırlama gerekiyorsa yalnızca geçici yerel test veritabanını hedeflediğinizi doğrulayın. RLS/RPC testleri kritik örnekleri kapsar; tüm kullanıcı akışları ve eşzamanlı durumlar için güvence vermez.

## Ortak sıralama testi

`npm test`, `src/lib/league/standings-parity-cases.json` senaryolarını TypeScript motoruyla çalıştırır. `python3 scripts/render-standings-parity.py` aynı senaryolardan veritabanı test SQL'ini üretir; çıktı yalnızca geliştirme/test veritabanında çalıştırılır ve işlem sonunda geri alınır. Bu kontroller normal lig için dört, Çok Takımlı Lig için üç ortak örneği kapsar; tüm eşitlik ve hata durumlarının kapsandığı anlamına gelmez.
