import { gcj02ToWgs84 } from "~~/server/utils/coordinateConverter";
import type { PostFields } from "~~/server/utils/postFields";

type NormalizedPost = Omit<PostFields, "lat" | "lon"> & {
  coordinate: string;
  user: string;
  lastConfirmedAt: Date | null;
};

// Rows with the same type and name within ~11 m are treated as duplicates.
const DUPLICATE_DEGREES = 0.0001;

const normalizeItem = (item: unknown): NormalizedPost => {
  if (!item || typeof item !== "object") {
    throw new FieldError("item must be an object");
  }

  const row = item as Record<string, unknown>;
  const fields = parsePostFields(row);

  const user = toRequiredString(row.user);
  if (!user || !isValidEmail(user)) {
    throw new FieldError("user must be a valid email address");
  }

  const coordSystem = row.coordSystem ?? "wgs84";
  if (coordSystem !== "wgs84" && coordSystem !== "gcj02") {
    throw new FieldError('coordSystem must be "wgs84" or "gcj02"');
  }
  const [lat, lon] =
    coordSystem === "gcj02"
      ? gcj02ToWgs84(fields.lat, fields.lon)
      : [fields.lat, fields.lon];

  const { lat: _lat, lon: _lon, ...data } = fields;
  return {
    ...data,
    coordinate: `${lat},${lon}`,
    user,
    lastConfirmedAt: fields.pictures.length > 0 ? new Date() : null,
  };
};

const isNear = (a: string, b: string) => {
  const [aLat, aLon] = a.split(",").map(Number);
  const [bLat, bLon] = b.split(",").map(Number);
  return (
    Math.abs(aLat! - bLat!) < DUPLICATE_DEGREES &&
    Math.abs(aLon! - bLon!) < DUPLICATE_DEGREES
  );
};

export default defineEventHandler(async (event) => {
  requireAdmin(event);

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
    try {
      validRows.push({ index, data: normalizeItem(item) });
    } catch (error) {
      if (!(error instanceof FieldError)) throw error;
      errors.push({ index, message: error.message });
    }
  });

  const existing = await prisma.posts.findMany({
    where: {
      name: { in: [...new Set(validRows.map((row) => row.data.name))] },
    },
    select: { type: true, name: true, coordinate: true },
  });
  const known = [...existing];

  let imported = 0;

  for (const row of validRows) {
    const duplicate = known.some(
      (post) =>
        post.type === row.data.type &&
        post.name === row.data.name &&
        isNear(post.coordinate, row.data.coordinate),
    );
    if (duplicate) {
      errors.push({
        index: row.index,
        message: "duplicate of an existing post",
      });
      continue;
    }

    try {
      await prisma.posts.create({ data: row.data });
      known.push(row.data);
      imported += 1;
    } catch {
      errors.push({
        index: row.index,
        message: "database insert failed",
      });
    }
  }

  errors.sort((a, b) => a.index - b.index);

  return {
    total: items.length,
    imported,
    failed: items.length - imported,
    errors,
  };
});
