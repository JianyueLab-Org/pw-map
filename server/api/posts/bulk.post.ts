import { gcj02ToWgs84 } from "~~/server/utils/coordinateConverter";

type NormalizedPost = {
  type: "mailbox" | "kiosk";
  name: string;
  coordinate: string;
  address: string | null;
  description: string;
  user: string;
  pickupTime: string | null;
  station: string | null;
  stamp: string | null;
  zipcode: number | null;
  status: number;
  format: number | null;
  pictures: string[];
  lastConfirmedAt: Date | null;
};

const toRequiredString = (value: unknown) => String(value ?? "").trim();

const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

const normalizePictures = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? "").trim())
      .filter((entry) => entry !== "");
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter((entry) => entry !== "");
  }

  return [] as string[];
};

const STATUS_STRING_MAP: Record<string, number> = {
  normal: 0,
  seasonal: 1,
  internal: 2,
  discarded: 3,
  unknown: 4,
};

const FORMAT_STRING_MAP: Record<string, number> = {
  wallMountedCube: 0,
  freestandingCylinder: 1,
  freestandingRectangularPrism: 2,
  noPhoto: 3,
};

const normalizeStatus = (value: unknown): number => {
  if (typeof value === "string" && value in STATUS_STRING_MAP) {
    return STATUS_STRING_MAP[value];
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeFormat = (value: unknown): number => {
  if (typeof value === "string" && value in FORMAT_STRING_MAP) {
    return FORMAT_STRING_MAP[value];
  }
  return Number(value);
};

const normalizeItem = (
  item: unknown,
): { data?: NormalizedPost; error?: string } => {
  if (!item || typeof item !== "object") {
    return { error: "item must be an object" };
  }

  const row = item as Record<string, unknown>;
  const type = row.type === "kiosk" ? "kiosk" : "mailbox";

  const name = toRequiredString(row.name);
  const description = toRequiredString(row.description);
  const user = toOptionalString(row.user) ?? "bulk-import";
  const address = toOptionalString(row.address);
  const pickupTime = toOptionalString(row.pickupTime);
  const station = toOptionalString(row.station);
  // Support both "stamp" and "PostmarkText" as field names
  const stamp = toOptionalString(row.stamp ?? row.PostmarkText);

  const lat = Number(row.lat);
  const lon = Number(row.lon);
  const status = normalizeStatus(row.status);
  const zipcode =
    row.zipcode === null || row.zipcode === undefined
      ? null
      : Number(row.zipcode);
  const format =
    row.format === null || row.format === undefined
      ? null
      : normalizeFormat(row.format);

  const pictures = normalizePictures(row.pictures);

  if (!name || !description) {
    return { error: "name and description are required" };
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { error: "lat and lon must be valid numbers" };
  }

  if (type === "mailbox") {
    if (!address) {
      return { error: "address is required for mailbox" };
    }

    if (!Number.isFinite(zipcode)) {
      return { error: "zipcode must be a valid number" };
    }

    if (!Number.isFinite(Number(format))) {
      return { error: "format must be a valid number" };
    }
  } else if (pictures.length === 0) {
    return { error: "pictures are required for kiosk" };
  }

  const [normalizedLat, normalizedLon] = gcj02ToWgs84(lat, lon);

  return {
    data: {
      type,
      name,
      coordinate: `${normalizedLat},${normalizedLon}`,
      address: type === "kiosk" ? null : address,
      description,
      user,
      pickupTime: type === "kiosk" ? null : pickupTime,
      station: type === "kiosk" ? null : station,
      stamp: type === "kiosk" ? null : stamp,
      zipcode: type === "kiosk" ? null : zipcode,
      status,
      format: type === "kiosk" ? null : format,
      pictures,
      lastConfirmedAt: pictures.length > 0 ? new Date() : null,
    },
  };
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const items = Array.isArray(body?.items) ? body.items : null;

  if (!items || items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "items must be a non-empty array",
    });
  }

  if (items.length > 500) {
    throw createError({
      statusCode: 400,
      statusMessage: "items length must be <= 500",
    });
  }

  const errors: Array<{ index: number; message: string }> = [];
  const validRows: Array<{ index: number; data: NormalizedPost }> = [];

  items.forEach((item: unknown, index: number) => {
    const { data, error } = normalizeItem(item);
    if (error) {
      errors.push({ index, message: error });
      return;
    }

    if (data) validRows.push({ index, data });
  });

  let imported = 0;

  for (const row of validRows) {
    try {
      await prisma.posts.create({ data: row.data });
      imported += 1;
    } catch {
      errors.push({
        index: row.index,
        message: "database insert failed",
      });
    }
  }

  return {
    total: items.length,
    imported,
    failed: items.length - imported,
    errors,
  };
});
