import type { PostFields } from "~~/server/utils/postFields";

const parseLastConfirmedAt = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) {
    throw createError({
      statusCode: 400,
      statusMessage: "lastConfirmedAt must be a past ISO 8601 date or null",
    });
  }
  return date;
};

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const id = Number(event.context.params?.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid post id" });
  }

  const body = await readBody(event);

  let fields!: PostFields;
  try {
    fields = parsePostFields(body ?? {});
  } catch (error) {
    badRequest(error);
  }

  const requestedLastConfirmedAt = parseLastConfirmedAt(body?.lastConfirmedAt);
  const user = toOptionalString(body?.user) ?? undefined;

  const existing = await prisma.posts.findUnique({
    where: { id },
    select: { pictures: true },
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Post not found" });
  }

  const { lat, lon, pictures, ...data } = fields;
  const picturesChanged =
    existing.pictures.length !== pictures.length ||
    existing.pictures.some((entry, index) => entry !== pictures[index]);

  // An explicit lastConfirmedAt wins; otherwise new pictures count as a confirmation.
  const lastConfirmedAt =
    requestedLastConfirmedAt !== undefined
      ? requestedLastConfirmedAt
      : picturesChanged
        ? pictures.length > 0
          ? new Date()
          : null
        : undefined;

  const post = await prisma.posts.update({
    where: { id },
    data: {
      ...data,
      pictures,
      coordinate: `${lat},${lon}`,
      user,
      lastConfirmedAt,
    },
  });

  return {
    id: String(post.id),
    updatedAt: post.updatedAt,
  };
});
