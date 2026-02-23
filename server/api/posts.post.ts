import { randomUUID } from "node:crypto";
import { gcj02ToWgs84 } from "~~/server/utils/coordinateConverter";
import { sendVerificationEmail } from "~~/server/utils/email";

const toRequiredString = (value: unknown) => String(value ?? "").trim();

const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const type = body?.type === "kiosk" ? "kiosk" : "mailbox";
  const name = toRequiredString(body?.name);
  const address = toOptionalString(body?.address);
  const description = toRequiredString(body?.description);
  const email = toRequiredString(body?.email);
  const user = email || "anonymous";
  const pickupTime = toOptionalString(body?.pickupTime);
  const station = toOptionalString(body?.station);
  const stamp = toOptionalString(body?.stamp);

  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  const zipcodeRaw = body?.zipcode;
  const zipcode =
    zipcodeRaw === null || zipcodeRaw === undefined ? null : Number(zipcodeRaw);
  const status = Number.isFinite(Number(body?.status))
    ? Number(body?.status)
    : 0;
  const formatRaw = body?.format;
  const format =
    formatRaw === null || formatRaw === undefined ? null : Number(formatRaw);

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

  const pictures = normalizePictures(body?.pictures);

  if (!name || !description) {
    throw createError({
      statusCode: 400,
      statusMessage: "name and description are required",
    });
  }

  if (!email || !isValidEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "email must be a valid address",
    });
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw createError({
      statusCode: 400,
      statusMessage: "lat and lon must be valid numbers",
    });
  }

  if (type === "mailbox") {
    if (!address) {
      throw createError({
        statusCode: 400,
        statusMessage: "address is required for mailbox",
      });
    }

    if (!Number.isFinite(zipcode)) {
      throw createError({
        statusCode: 400,
        statusMessage: "zipcode must be a valid number",
      });
    }

    if (!Number.isFinite(Number(format))) {
      throw createError({
        statusCode: 400,
        statusMessage: "format must be a valid number",
      });
    }
  } else if (pictures.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "pictures are required for kiosk",
    });
  }

  const verificationToken = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  const [normalizedLat, normalizedLon] = gcj02ToWgs84(lat, lon);

  await prisma.pendingPosts.create({
    data: {
      type,
      name,
      coordinate: `${normalizedLat},${normalizedLon}`,
      address,
      description,
      user,
      pickupTime,
      station,
      stamp,
      zipcode,
      status,
      format,
      pictures,
      verificationToken,
      expiresAt,
    },
  });

  await sendVerificationEmail({
    to: email,
    token: verificationToken,
    name,
  });

  return { message: "Verification email sent." };
});
