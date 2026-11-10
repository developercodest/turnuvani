# Turnuvani

Next.js App Router tabanlı turnuva yönetim uygulaması.

## Supabase environment yapılandırması

`.env.local` dosyasındaki aşağıdaki iki değeri Supabase Dashboard'da **Project Settings → API** ekranından ekleyin:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`NEXT_PUBLIC_SUPABASE_URL`, **Project Settings → API** altındaki proje URL'sidir; Data API ekranındaki `/rest/v1/` ile biten REST endpoint'i değildir. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tarayıcı istemcisi için tasarlanmış publishable anahtardır. `service_role` veya başka bir secret anahtarı hiçbir zaman `.env.local` içine ya da frontend koduna eklemeyin. Paylaşılabilir değişken şablonu `.env.example` dosyasında bulunur; `.env.local` Git tarafından yok sayılır.

## Geliştirme

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır.

## Doğrulama

```bash
npm run lint
npm run build
```
