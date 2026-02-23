import { getQuery, sendRedirect } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = typeof query.token === "string" ? query.token : "";
  const defaultLocale = process.env.DEFAULT_LOCALE ?? "en";
  const baseRedirect = `/${defaultLocale}/`;

  if (!token) {
    return sendRedirect(event, `${baseRedirect}?verified=0`, 302);
  }

  const pending = await prisma.pendingPosts.findUnique({
    where: { verificationToken: token },
  });

  if (!pending) {
    return sendRedirect(event, `${baseRedirect}?verified=0`, 302);
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.pendingPosts.delete({ where: { id: pending.id } });
    return sendRedirect(event, `${baseRedirect}?verified=0`, 302);
  }

  await prisma.posts.create({
    data: {
      type: pending.type,
      name: pending.name,
      coordinate: pending.coordinate,
      address: pending.address,
      description: pending.description,
      user: pending.user,
      pickupTime: pending.pickupTime,
      station: pending.station,
      stamp: pending.stamp,
      zipcode: pending.zipcode,
      status: pending.status,
      format: pending.format,
      pictures: pending.pictures,
      lastConfirmedAt: pending.pictures.length > 0 ? new Date() : null,
    },
  });

  await prisma.pendingPosts.delete({ where: { id: pending.id } });

  return sendRedirect(event, `${baseRedirect}?verified=1`, 302);
});
