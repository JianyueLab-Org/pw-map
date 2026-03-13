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
        v-for="marker in convertedMarkers"
        :key="marker.id"
        :lat-lng="[marker.lat, marker.lon]"
        @click="() => handleMarkerClick(marker)"
      >
        <LIcon
          :icon-url="getIconUrl(marker.color, marker.id === selectedMarkerId)"
          :icon-size="[25, 41]"
          :icon-anchor="[12, 41]"
        />
      </LMarker>

import "leaflet/dist/leaflet.css";
import {
  LMap,
  LTileLayer,
  LMarker,
  LIcon,
  LControlLayers,
  LControl,
} from "@vue-leaflet/vue-leaflet";
import { ref, onMounted, watch, computed } from "vue";
import type { LatLngExpression, LeafletMouseEvent, Icon, IconOptions } from "leaflet";
  status?: number | null;
}

type Marker = {
  0: "#22c55e", // normal → green
  1: "#eab308", // seasonal → yellow
  2: "#eab308", // internal → yellow
  3: "#ef4444", // discarded → red
  color: string;
};

const getStatusIcon = (status?: number | null): Icon<IconOptions> => {
  const color =
    status != null && status in STATUS_COLORS
      ? STATUS_COLORS[status]
  selectedMarkerId?: string | null;
  return divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  }) as unknown as Icon<IconOptions>;
};

const props = defineProps<{
  markers?: Marker[];
  enableSelection?: boolean;
  selected?: { lat: number; lon: number } | null;
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
    if (convertedMarkers.value.length === 0) return undefined;

    const lats = convertedMarkers.value.map((m) => m.lat);
    const lons = convertedMarkers.value.map((m) => m.lon);

    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ] as [[number, number], [number, number]];
  },
);

// Convert coordinates if in China
const convertedMarkers = computed(() => {
  if (!props.markers) return [];
  return props.markers.map((marker) => {
    const [lat, lon] = convertCoordinatesByCountry(
      marker.lat,
      marker.lon,
      marker.country,
    );
    return { ...marker, lat, lon };
  });
});

const selectionMarker = computed(() => {
const getIconUrl = (color: string, isSelected: boolean) => {
  const selectedSuffix = isSelected ? "-selected" : "";
  return `/markers/${color}${selectedSuffix}.png`;
};


// Update center when selection changes
watch(selectionMarker, (newSelection) => {
  if (newSelection) {
    center.value = [newSelection.lat, newSelection.lon];
  }
});


watch(
  () => props.selectedMarkerId,
  (newId) => {
    if (newId) {
      const selectedMarker = props.markers.find((m) => m.id === newId);
      if (selectedMarker && mapRef.value?.leafletObject) {
        const map = mapRef.value.leafletObject;
        map.setView([selectedMarker.lat, selectedMarker.lon], 15);
      }
    }
  },
);
  width: 100%;
}

.map-container :global(.leaflet-container) {
  height: 100%;
  width: 100%;
}
</style>
