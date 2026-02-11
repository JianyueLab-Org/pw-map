<script setup lang="ts">
const form = reactive({
  name: "",
  lat: "",
  lon: "",
  address: "",
  description: "",
  email: "",
  pickupTime: "",
  station: "",
  stamp: "",
  zipcode: "",
  status: "0",
  format: "0",
});

const submissionState = ref<"idle" | "submitting" | "success" | "error">(
  "idle",
);
const submissionMessage = ref("");

const { refresh } = await useFetch("/api/posts", {
  server: false,
  lazy: true,
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

const selectedCoordinates = computed(() => {
  const lat = Number(form.lat);
  const lon = Number(form.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
});

const handleMapSelect = ({ lat, lon }: { lat: number; lon: number }) => {
  form.lat = lat.toFixed(6);
  form.lon = lon.toFixed(6);
};

const submit = async () => {
  submissionState.value = "submitting";
  submissionMessage.value = "";

  try {
    await $fetch("/api/posts", {
      method: "POST",
      body: {
        ...form,
        lat: Number(form.lat),
        lon: Number(form.lon),
        zipcode: Number(form.zipcode),
        status: Number(form.status),
        format: Number(form.format),
      },
    });

    submissionState.value = "success";
    submissionMessage.value = t("states.checkEmail");

    Object.assign(form, {
      name: "",
      lat: "",
      lon: "",
      address: "",
      description: "",
      email: "",
      pickupTime: "",
      station: "",
      stamp: "",
      zipcode: "",
      status: "0",
      format: "0",
    });

    await refresh();
  } catch (err) {
    submissionState.value = "error";
    submissionMessage.value = t("states.submitFailed");
    console.error(err);
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <section
      class="relative h-[45vh] min-h-[320px] overflow-hidden rounded-[18px]"
    >
      <ClientOnly>
        <MapComponent
          :selected="selectedCoordinates"
          :enable-selection="true"
          @select="handleMapSelect"
          class="h-full w-full"
        />
        <template #fallback>
          <div class="h-[60vh] w-full animate-pulse bg-slate-100" />
        </template>
      </ClientOnly>
    </section>

    <section
      class="rounded-2xl bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold text-slate-900">
            {{ $t("actions.newPost") }}
          </h1>
          <p class="text-xs text-slate-600">
            {{ $t("form.mapHint") }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <label class="sr-only" for="locale-switcher">
            {{ $t("ui.language") }}
          </label>
          <select
            id="locale-switcher"
            :value="locale"
            class="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
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
            :to="localePath('/')"
            class="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            {{ $t("actions.backToMap") }}
          </NuxtLink>
        </div>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.name") }}
          <input
            v-model="form.name"
            type="text"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.latitude") }}
          <input
            v-model="form.lat"
            type="number"
            step="any"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.longitude") }}
          <input
            v-model="form.lon"
            type="number"
            step="any"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.address") }}
          <input
            v-model="form.address"
            type="text"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.description") }}
          <textarea
            v-model="form.description"
            rows="3"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.zip") }}
          <input
            v-model="form.zipcode"
            type="number"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.email") }}
          <input
            v-model="form.email"
            type="email"
            required
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.pickupTime") }}
          <input
            v-model="form.pickupTime"
            type="text"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.station") }}
          <input
            v-model="form.station"
            type="text"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm text-slate-700">
          {{ $t("form.stamp") }}
          <input
            v-model="form.stamp"
            type="text"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          />
        </label>
        <fieldset
          class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <legend class="px-1 text-sm font-semibold text-slate-700">
            {{ $t("form.status") }}
          </legend>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.status"
              type="radio"
              name="status"
              value="0"
              required
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("status.normal") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.status"
              type="radio"
              name="status"
              value="1"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("status.seasonal") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.status"
              type="radio"
              name="status"
              value="2"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("status.internal") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.status"
              type="radio"
              name="status"
              value="3"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("status.discarded") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.status"
              type="radio"
              name="status"
              value="4"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("status.unknown") }}
          </label>
        </fieldset>

        <fieldset
          class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <legend class="px-1 text-sm font-semibold text-slate-700">
            {{ $t("form.format") }}
          </legend>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.format"
              type="radio"
              name="format"
              value="0"
              required
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("format.wallMountedCube") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.format"
              type="radio"
              name="format"
              value="1"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("format.freestandingCylinder") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.format"
              type="radio"
              name="format"
              value="2"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("format.freestandingRectangularPrism") }}
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="form.format"
              type="radio"
              name="format"
              value="3"
              class="h-4 w-4 text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
            />
            {{ $t("format.noPhoto") }}
          </label>
        </fieldset>
        <button
          type="submit"
          :disabled="submissionState === 'submitting'"
          class="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{
            submissionState === "submitting"
              ? $t("actions.submitting")
              : $t("actions.submit")
          }}
        </button>
        <p
          v-if="submissionMessage"
          class="text-xs"
          :class="{
            'text-emerald-700': submissionState === 'success',
            'text-red-700': submissionState === 'error',
            'text-slate-600': submissionState === 'submitting',
          }"
        >
          {{ submissionMessage }}
        </p>
      </form>
    </section>
  </div>
</template>
