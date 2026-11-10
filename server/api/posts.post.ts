import { randomUUID } from "node:crypto";
import { sendVerificationEmail } from "~~/server/utils/email";
import type { PostFields } from "~~/server/utils/postFields";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  let fields!: PostFields;
  try {
    fields = parsePostFields(body ?? {});
  } catch (error) {
    badRequest(error);
  }

  const email = toRequiredString(body?.email);
  if (!email || !isValidEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "email must be a valid address",
    });
  }

  const verificationToken = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const { lat, lon, ...data } = fields;

  // Coordinates come from the OSM (WGS-84) map picker; stored as-is.
  await prisma.pendingPosts.create({
    data: {
      ...data,
      coordinate: `${lat},${lon}`,
      user: email,
      verificationToken,
      expiresAt,
    },
  });

  await sendVerificationEmail({
    to: email,
    token: verificationToken,
    name: fields.name,
  });

  return { message: "Verification email sent." };
});
