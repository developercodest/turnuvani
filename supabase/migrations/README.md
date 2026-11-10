# Veritabanı migration'ları

Bu klasör, Supabase PostgreSQL şema değişikliklerinin sıralı ve geri izlenebilir kaynak kaydıdır.

## Kurallar

- Her şema, RLS policy, indeks, trigger veya seed dışı veri değişikliği için yeni bir SQL migration oluşturulur.
- Dosyalar sonradan düzenlenmez; düzeltmeler yeni bir migration olarak eklenir.
- Migration dosyası Supabase CLI ile oluşturulur: `supabase migration new <açıklayıcı_ad>`.
- Dosya adı CLI'ın ürettiği UTC zaman damgasını ve kısa snake_case açıklamayı korur: `YYYYMMDDHHMMSS_açıklayıcı_ad.sql`.
- `public` şemasındaki her yeni tablo için RLS aynı migration içinde etkinleştirilir ve en az gerekli policy'ler eklenir.
- Service-role/secret anahtarları migration'lara veya SQL'e yazılmaz.

Mevcut şema bu klasördeki migration’larla tanımlanır. Dosya sürümleri geliştirme veritabanı geçmişiyle hizalanmıştır. Önceki eleme motoru migration içeriği geçmiş kayıtla farklıdır; sonraki migration aynı fonksiyonu yeniden tanımlar. Güncel public fonksiyon gövdeleri, tablolar, kısıtlar, RLS politikaları ve sütun yetkileri boş yerel kurulum ile geliştirme ortamında karşılaştırılmıştır.
