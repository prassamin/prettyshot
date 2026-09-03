import {
  getBackgrounds,
  getUserBackgroundImages,
  type Background,
} from "@/app/actions/backgrounds";

type UserBgItem = Omit<Background, "name" | "is_free" | "category">;

let cachedDbBackgrounds: Background[] | null = null;
let inFlightDbPromise: Promise<Background[]> | null = null;

let cachedUserBackgrounds: {
  userId: string;
  images: UserBgItem[];
} | null = null;
let inFlightUserPromise: {
  userId: string;
  promise: Promise<UserBgItem[]>;
} | null = null;

export async function fetchSharedBackgrounds(): Promise<Background[]> {
  if (cachedDbBackgrounds) return cachedDbBackgrounds;
  if (inFlightDbPromise) return inFlightDbPromise;

  inFlightDbPromise = getBackgrounds()
    .then((data) => {
      cachedDbBackgrounds = data;
      return data;
    })
    .finally(() => {
      inFlightDbPromise = null;
    });

  return inFlightDbPromise;
}

export function getCachedBackgroundsSync(): Background[] | null {
  return cachedDbBackgrounds;
}

export async function fetchSharedUserBackgrounds(
  userId: string,
): Promise<UserBgItem[]> {
  if (!userId) return [];
  if (cachedUserBackgrounds?.userId === userId) {
    return cachedUserBackgrounds.images;
  }
  if (inFlightUserPromise?.userId === userId) {
    return inFlightUserPromise.promise;
  }

  const promise = getUserBackgroundImages()
    .then((data) => {
      if (data) {
        cachedUserBackgrounds = { userId, images: data };
      }
      return data || [];
    })
    .finally(() => {
      if (inFlightUserPromise?.userId === userId) {
        inFlightUserPromise = null;
      }
    });

  inFlightUserPromise = { userId, promise };
  return promise;
}

export function getCachedUserBackgroundsSync(
  userId?: string,
): UserBgItem[] | null {
  if (!userId || cachedUserBackgrounds?.userId !== userId) return null;
  return cachedUserBackgrounds.images;
}

export function addUserBackgroundImage(userId: string, item: UserBgItem) {
  if (cachedUserBackgrounds?.userId === userId) {
    cachedUserBackgrounds.images = [item, ...cachedUserBackgrounds.images];
  } else {
    cachedUserBackgrounds = { userId, images: [item] };
  }
}
