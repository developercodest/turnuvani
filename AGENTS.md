# Turnuvani geliştirme rehberi

## Teknoloji

- Next.js App Router, React ve TypeScript
- Supabase: Auth, PostgreSQL, RLS ve gerektiğinde Edge Functions
- Karmaşık turnuva kuralları bağımsız domain modüllerinde tutulur; UI veya Supabase istemcisine bağlanmaz.

## Çalışma düzeni

- Değişikliğin kapsamını ve kabul ölçütünü ilgili iş kaydında netleştirin.
- Değişiklikten sonra `npm run lint` ve `npm run build` çalıştırılır.
- Domain kuralları için uygun birim testlerini, veritabanı değişiklikleri için yerel veritabanı testlerini çalıştırın.
- Gizli anahtarlar frontend koduna veya repoya eklenmez.

## Proje dokümantasyonu

- Başlamadan önce `README.md`, `ARCHITECTURE.md` ve `DEVELOPMENT_GUIDE.md` dosyalarını okuyun.
- Bu depo geçmiş görev günlüğünü veya canlı ortam kimlik bilgilerini içermez. Eksik ürün kararı varsa varsayım yapmak yerine proje sahibine sorun.
- Uygulama ve veritabanı değişiklikleri ayrı geliştirme/test ortamında doğrulanmadan canlıya uygulanmaz.

## Kapsam kararı

Kaynak backlog Vite öneriyor; proje sahibi talebi doğrultusunda bu repository Next.js App Router kullanır. Backlogdaki task kimlikleri korunur, yalnızca T01'in teknik karşılığı Next.js projesidir.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
