const parseCoordinate = (coordinate: string) => {
  const [latRaw, lonRaw] = coordinate.split(",").map((value) => value.trim());
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  return { lat, lon };
};

type PostRecord = {
  id: number | string;
  type: string | null;
  name: string;
  coordinate: string;
  address: string | null;
  description: string;
  user: string | null;
  pickupTime: string | null;
  station: string | null;
  stamp: string | null;
  zipcode: number | null;
  status: number | null;
  format: number | null;
  pictures: string[] | null;
  lastConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const normalizeType = (value: unknown) =>
  value === "kiosk" ? "kiosk" : "mailbox";

export default defineEventHandler(async () => {
  const posts = (await prisma.posts.findMany({
    orderBy: { createdAt: "desc" },
  })) as PostRecord[];

  return posts.map((post) => {
    const { lat, lon } = parseCoordinate(post.coordinate);
    return {
      id: String(post.id),
      type: normalizeType(post.type),
      name: post.name,
      address: post.address,
      description: post.description,
      user: post.user,
      pickupTime: post.pickupTime,
      station: post.station,
      stamp: post.stamp,
      zipcode: post.zipcode,
      status: post.status,
      format: post.format,
      pictures: post.pictures ?? [],
      lastConfirmedAt: post.lastConfirmedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      lat,
      lon,
    };
  });
});
