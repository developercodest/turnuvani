type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

function missingEnvironmentMessage(names: string[]) {
  return `Eksik Supabase environment değişkeni: ${names.join(", ")}. .env.local dosyasını kontrol edin.`;
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !publishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
  ].filter((name): name is string => name !== null);

  if (missing.length > 0) {
    throw new Error(missingEnvironmentMessage(missing));
  }

  const configuredUrl = url as string;
  const configuredPublishableKey = publishableKey as string;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL geçerli bir URL olmalı.");
  }

  if (parsedUrl.pathname !== "/" && parsedUrl.pathname !== "") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL proje kök URL'si olmalı; /rest/v1 eklemeyin.");
  }

  if (!configuredPublishableKey.startsWith("sb_publishable_")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY publishable key (sb_publishable_...) olmalı.");
  }

  return { url: configuredUrl, publishableKey: configuredPublishableKey };
}

export function validateEnvironment() {
  getSupabaseEnvironment();
}
