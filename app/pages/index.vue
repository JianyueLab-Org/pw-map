<script setup lang="ts">
type Post = {
  id: string | number;
  name: string;
  address: string;
  description: string;
  user: string | null;
  pickupTime: string | null;
  station: string | null;
  stamp: string | null;
  zipcode: number | null;
  status: number | null;
  format: number | null;
  createdAt: string | Date;
  lat: number;
  lon: number;
};

const {
  data: posts,
  pending,
  error,
} = await useFetch<Post[]>("/api/posts", {
  server: false,
  lazy: true,
  timeout: 5000,
  retry: 0,
  default: () => [],
});

const { t, locale, locales } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const supportedLocales = ["en", "zh"] as const;
type SupportedLocale = (typeof supportedLocales)[number];

const localeOptions = computed(() =>
  (locales.value ?? []).map((entry) =>
    typeof entry === "string" ? { code: entry, name: entry } : entry,
  ),
);

const handleLocaleChange = (value: string) => {
  if (!supportedLocales.includes(value as SupportedLocale)) return;
  const path = switchLocalePath(value as SupportedLocale);
  if (path) navigateTo(path);
};

const handleLocaleChangeEvent = (event: Event) => {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  handleLocaleChange(target.value);
};

const markers = computed(() => {
  if (!posts.value) return [];
  return posts.value
    .filter((post) => Number.isFinite(post.lat) && Number.isFinite(post.lon))
    .map((post) => ({
      id: String(post.id),
      name: post.name,
      lat: post.lat,
      lon: post.lon,
      address: post.address,
      description: post.description,
      user: post.user,
      pickupTime: post.pickupTime,
      station: post.station,
      stamp: post.stamp,
      zipcode: post.zipcode,
      status: post.status,
      format: post.format,
      createdAt: post.createdAt,
    }));
});

const selectedPostId = ref<string | null>(null);

const selectedPost = computed(() => {
  if (!posts.value || !selectedPostId.value) return null;
  return (
    posts.value.find((post) => String(post.id) === selectedPostId.value) ?? null
  );
});

const handleMarkerSelect = (marker: { id: string }) => {
  selectedPostId.value = marker.id;
};

const clearSelection = () => {
  selectedPostId.value = null;
};

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale.value || "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatOptional = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  return trimmed === "" ? "" : trimmed;
};

const statusLabel = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const labels = [
    t("status.normal"),
    t("status.seasonal"),
    t("status.internal"),
    t("status.discarded"),
    t("status.unknown"),
  ];
  return labels[numeric] ?? "";
};

const formatLabel = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const labels = [
    t("format.wallMountedCube"),
    t("format.freestandingCylinder"),
    t("format.freestandingRectangularPrism"),
    t("format.noPhoto"),
  ];
  return labels[numeric] ?? "";
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="flex flex-col gap-6 px-6 py-7">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-red-300"
          >
            {{ $t("app.tagline") }}
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-50">
            {{ $t("app.title") }}
          </h1>
          <p class="mt-1 text-sm text-slate-300 hidden sm:block">
            {{ $t("app.subtitle") }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <label class="sr-only" for="locale-switcher">
            {{ $t("ui.language") }}
          </label>
          <select
            id="locale-switcher"
            :value="locale"
            class="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            @change="handleLocaleChangeEvent"
          >
            <option
              v-for="option in localeOptions"
              :key="option.code"
              :value="option.code"
            >
              {{ option.name ?? option.code }}
            </option>
          </select>
          <NuxtLink
            :to="localePath('/new-post')"
            class="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5 hover:bg-red-400"
          >
            {{ $t("actions.newPost") }}
          </NuxtLink>
        </div>
      </header>

      <section
        class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)]"
      >
        <div
          class="relative h-[70vh] overflow-hidden rounded-[20px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.6)]"
        >
          <ClientOnly>
            <MapComponent
              :markers="markers"
              class="h-full w-full"
              @marker-select="handleMarkerSelect"
            />
            <template #fallback>
              <div class="h-full w-full animate-pulse bg-slate-900/80" />
            </template>
          </ClientOnly>
          <div
            v-if="pending"
            class="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 ring-1 ring-white/10"
          >
            {{ $t("states.loadingPosts") }}
          </div>
          <div
            v-else-if="error"
            class="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-500/30"
          >
            {{ $t("states.loadFailed") }}
          </div>
        </div>

        <aside
          class="flex flex-col rounded-[20px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.45)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.24em] text-red-300"
              >
                {{ $t("details.title") }}
              </p>
              <h2 class="mt-2 text-lg font-semibold text-slate-50">
                {{
                  selectedPost ? selectedPost.name : $t("details.emptyTitle")
                }}
              </h2>
              <p class="mt-1 text-xs text-slate-400">
                {{
                  selectedPost
                    ? $t("details.subtitle")
                    : $t("details.emptySubtitle")
                }}
              </p>
            </div>
            <button
              v-if="selectedPost"
              type="button"
              class="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-red-400 hover:text-red-200"
              @click="clearSelection"
            >
              {{ $t("actions.clear") }}
            </button>
          </div>

          <div
            v-if="selectedPost"
            class="mt-5 flex flex-1 flex-col gap-4 overflow-hidden"
          >
            <div class="rounded-2xl bg-slate-900/60 p-4">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                {{ $t("details.address") }}
              </p>
              <p class="mt-2 text-sm text-slate-100">
                {{ selectedPost.address }}
              </p>
              <p class="mt-1 text-xs text-slate-400">
                {{ selectedPost.lat.toFixed(5) }},
                {{ selectedPost.lon.toFixed(5) }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-900/60 p-4">
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                {{ $t("details.description") }}
              </p>
              <p class="mt-2 text-sm text-slate-100">
                {{ selectedPost.description }}
              </p>
            </div>

            <div
              class="grid gap-3 overflow-auto rounded-2xl bg-slate-900/60 p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  {{ $t("details.metadata") }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ formatDateTime(selectedPost.createdAt) }}
                </p>
              </div>
              <div class="grid gap-2 text-sm text-slate-200">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{ $t("details.id") }}</span>
                  <span>{{ selectedPost.id }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{ $t("details.zip") }}</span>
                  <span>{{ selectedPost.zipcode }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{
                    $t("details.pickupTime")
                  }}</span>
                  <span>{{
                    formatOptional(selectedPost.pickupTime) || "—"
                  }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{
                    $t("details.station")
                  }}</span>
                  <span>{{ formatOptional(selectedPost.station) || "—" }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{ $t("details.stamp") }}</span>
                  <span>{{ formatOptional(selectedPost.stamp) || "—" }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{ $t("details.status") }}</span>
                  <span>{{ statusLabel(selectedPost.status) || "—" }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-slate-400">{{ $t("details.format") }}</span>
                  <span>{{ formatLabel(selectedPost.format) || "—" }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="mt-6 flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400"
          >
            <p class="text-base font-semibold text-slate-200">
              {{ $t("details.emptyTitleShort") }}
            </p>
            <p>{{ $t("details.emptyHint") }}</p>
          </div>
        </aside>
      </section>
    </div>
  </div>
</template>
