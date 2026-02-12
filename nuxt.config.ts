// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./assets/style/global.css", "leaflet/dist/leaflet.css"],
  modules: ["@nuxt/ui", "@nuxtjs/leaflet", "@nuxtjs/i18n"],
  i18n: {
    strategy: "prefix",
    defaultLocale: "en",
    // @ts-expect-error - nuxt-i18n supports lazy but typing omits it
    lazy: true,
    langDir: "locales",
    vueI18n: "./i18n.config.ts",
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "zh", name: "中文", file: "zh.json" },
    ],
    detectBrowserLanguage: {
      alwaysRedirect: true,
      useCookie: true,
      fallbackLocale: "en",
      redirectOn: "root",
    },
  },
  vite: {
    // Cast to any to avoid mismatched Vite type versions between Nuxt and Tailwind.
    plugins: [tailwindcss() as any],
  },
});
