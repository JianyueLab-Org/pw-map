<template>
  <div class="map-container">
    <LMap
      ref="mapRef"
      :zoom="zoom"
      :center="center"
      :bounds="bounds"
      :use-global-leaflet="false"
      @click="handleMapClick"
      class="h-full w-full"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LMarker
        v-for="marker in markerList"
        :key="marker.id"
        :lat-lng="[marker.lat, marker.lon]"
        :icon="getStatusIcon(marker.status, marker.id === selectedMarkerId)"
        @click="() => handleMarkerClick(marker)"
      >
      </LMarker>
    </LMap>
  </div>
</template>

<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import { ref, watch, computed } from "vue";
import type {
  LatLngExpression,
  LeafletMouseEvent,
  Icon,
  IconOptions,
} from "leaflet";
import { divIcon } from "leaflet";

interface Marker {
  id: string;
  lat: number;
  lon: number;
  name: string;
  status?: number | null;
}

const STATUS_COLORS: Record<number, string> = {
  0: "#22c55e", // normal → green
  1: "#eab308", // seasonal → yellow
  2: "#eab308", // internal → yellow
  3: "#ef4444", // discarded → red
};

const getStatusIcon = (
  status?: number | null,
  isSelected = false,
): Icon<IconOptions> => {
  const color =
    status != null && status in STATUS_COLORS
      ? STATUS_COLORS[status]
      : "#808080";
  const size = isSelected ? 20 : 14;
  const border = isSelected
    ? "3px solid #ffffff"
    : "2px solid rgba(255,255,255,0.8)";
  return divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:0 1px 4px rgba(0,0,0,0.4);box-sizing:border-box;"></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -10],
  }) as unknown as Icon<IconOptions>;
};

const props = defineProps<{
  markers?: Marker[];
  enableSelection?: boolean;
  selected?: { lat: number; lon: number } | null;
  selectedMarkerId?: string | null;
}>();

const emit = defineEmits<{
  select: [{ lat: number; lon: number }];
  markerSelect: [Marker];
}>();

const zoom = ref(13);
const mapRef = ref();

// Default center (London)
const center = ref<[number, number]>([51.505, -0.09]);

// Calculate bounds to fit all markers
// When there's a selection, don't use bounds so center takes over
const bounds = computed<[[number, number], [number, number]] | undefined>(
  () => {
    if (selectionMarker.value) return undefined;
    if (markerList.value.length === 0) return undefined;

    const lats = markerList.value.map((m) => m.lat);
    const lons = markerList.value.map((m) => m.lon);

    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ] as [[number, number], [number, number]];
  },
);

const markerList = computed(() => props.markers ?? []);

const selectionMarker = computed(() =>
  props.enableSelection && props.selected ? props.selected : null,
);

const handleMapClick = (event: LeafletMouseEvent) => {
  if (props.enableSelection) {
    emit("select", { lat: event.latlng.lat, lon: event.latlng.lng });
  }
};

const handleMarkerClick = (marker: Marker) => {
  emit("markerSelect", marker);
};

// Update center when selection changes
watch(selectionMarker, (newSelection) => {
  if (newSelection) {
    center.value = [newSelection.lat, newSelection.lon];
  }
});

watch(
  () => props.markers,
  () => {
    if (mapRef.value && bounds.value) {
      mapRef.value.leafletObject.fitBounds(bounds.value);
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
}

.map-container :global(.leaflet-container) {
  height: 100%;
  width: 100%;
}
</style>
