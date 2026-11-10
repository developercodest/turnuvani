# Geliştirme rehberi

## Başlangıç

1. Bağımlılıkları yükleyin: `npm ci`.
2. `.env.example` dosyasını `.env.local` olarak kopyalayın.
3. Geliştirme Supabase projesinin yalnızca URL ve publishable key değerlerini `.env.local` içine ekleyin.
4. `npm run dev` ile uygulamayı başlatın.

`.env.local` sürüm kontrolüne girmez. Service-role, OAuth client secret, SMTP parolası ve başka gizli değerleri bu depoya ya da `NEXT_PUBLIC_` değişkenlerine eklemeyin.

## Günlük doğrulama

Kaynak değişikliğinden sonra en az aşağıdakileri çalıştırın:

```bash
npm run lint
npm test
npm run build
```

Kapsam yalnızca arayüzse uygun rotayı yerelde de kontrol edin. Domain kuralı değişikliklerinde ilgili birim testlerini ekleyin veya güncelleyin.

## Supabase değişiklikleri

- Önce hedefin geliştirme/test ortamı olduğunu doğrulayın; canlı kullanıcı verisinde deneme yapmayın.
- Yeni şema, RLS, trigger, fonksiyon veya indeks değişikliği için Supabase CLI ile yeni migration oluşturun. Var olan migration dosyalarını değiştirmeyin.
- `public` şemasına eklenen her tabloda RLS etkinleştirilir ve erişim politikaları gerçek sahiplik modelini uygular.
- Yerel Supabase çalışırken veritabanı kontrolleri için `npm run test:db:local` çalıştırın. Bu komut yalnızca yerel ortam içindir.
- Migration geçmişini ve canlı şemayı otomatik olarak eşit kabul etmeyin; dağıtım, ayrı bir onaylı işlemdir.

## Değişiklik teslimi

Pull request veya değişiklik notunda kapsamı, çalıştırılan doğrulamaları ve kalan manuel testleri belirtin. Üretime dağıtım, ortam değişkeni değişikliği veya uzak veritabanı işlemi ancak açık onayla yapılır.
