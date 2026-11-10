export class FieldError extends Error {}

export const toRequiredString = (value: unknown) => String(value ?? "").trim();

export const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const normalizePictures = (value: unknown) => {
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

const toEnumValue = (
  value: unknown,
  map: Record<string, number>,
  field: string,
): number => {
  if (typeof value === "string" && Object.hasOwn(map, value)) {
    return map[value]!;
  }
  const n =
    typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  const max = Object.keys(map).length - 1;
  if (!Number.isInteger(n) || n < 0 || n > max) {
    throw new FieldError(
      `${field} must be one of ${Object.keys(map).join(", ")} or 0-${max}`,
    );
  }
  return n;
};

/** Missing status defaults to normal (0). */
export const parseStatus = (value: unknown): number =>
  value === null || value === undefined || value === ""
    ? 0
    : toEnumValue(value, STATUS_STRING_MAP, "status");

export const parseFormat = (value: unknown): number =>
  toEnumValue(value, FORMAT_STRING_MAP, "format");

/** Postal codes are digit strings; leading zeros are significant. */
export const parseZipcode = (value: unknown): string => {
  const zipcode = String(value ?? "").trim();
  if (!/^\d{3,10}$/.test(zipcode)) {
    throw new FieldError("zipcode must be 3-10 digits");
  }
  return zipcode;
};

export const parseCoordinates = (lat: unknown, lon: unknown) => {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (
    lat === null ||
    lon === null ||
    lat === "" ||
    lon === "" ||
    !Number.isFinite(latNum) ||
    !Number.isFinite(lonNum) ||
    Math.abs(latNum) > 90 ||
    Math.abs(lonNum) > 180
  ) {
    throw new FieldError("lat and lon must be valid coordinates");
  }
  return { lat: latNum, lon: lonNum };
};

export interface PostFields {
  type: "mailbox" | "kiosk";
  name: string;
  description: string;
  lat: number;
  lon: number;
  status: number;
  pictures: string[];
  address: string | null;
  pickupTime: string | null;
  station: string | null;
  stamp: string | null;
  zipcode: string | null;
  format: number | null;
}

/**
 * Fields shared by single submit, edit and bulk import.
 * Coordinates are returned as given (WGS-84 unless the caller converts).
 */
export const parsePostFields = (row: Record<string, unknown>): PostFields => {
  const type: "mailbox" | "kiosk" = row.type === "kiosk" ? "kiosk" : "mailbox";
  const name = toRequiredString(row.name);
  const description = toRequiredString(row.description);
  if (!name || !description) {
    throw new FieldError("name and description are required");
  }

  const { lat, lon } = parseCoordinates(row.lat, row.lon);
  const status = parseStatus(row.status);
  const pictures = normalizePictures(row.pictures);

  if (type === "kiosk") {
    if (pictures.length === 0) {
      throw new FieldError("pictures are required for kiosk");
    }
    return {
      type,
      name,
      description,
      lat,
      lon,
      status,
      pictures,
      address: null,
      pickupTime: null,
      station: null,
      stamp: null,
      zipcode: null,
      format: null,
    };
  }

  const address = toOptionalString(row.address);
  if (!address) throw new FieldError("address is required for mailbox");

  return {
    type,
    name,
    description,
    lat,
    lon,
    status,
    pictures,
    address,
    pickupTime: toOptionalString(row.pickupTime),
    station: toOptionalString(row.station),
    // "PostmarkText" is accepted as an alias of "stamp".
    stamp: toOptionalString(row.stamp ?? row.PostmarkText),
    zipcode: parseZipcode(row.zipcode),
    format: parseFormat(row.format),
  };
};

export const badRequest = (error: unknown): never => {
  if (error instanceof FieldError) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }
  throw error;
};
