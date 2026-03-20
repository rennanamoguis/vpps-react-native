import { Directory, File, Paths } from "expo-file-system";
import { API_ORIGIN } from "../config/api";

export function toAbsoluteImageUrl(imgPath?: string | null) {
  if (!imgPath) return null;
  if (/^https?:\/\//i.test(imgPath)) return imgPath;
  return `${API_ORIGIN}${imgPath}`;
}

function getExtensionFromUrl(url: string) {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : ".jpg";
}

function makeSafeName(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function buildCacheFileName(userId: number, remoteUrl: string) {
  const extension = getExtensionFromUrl(remoteUrl);
  const cleanUrl = remoteUrl.split("?")[0];
  const encoded = makeSafeName(cleanUrl);
  return `user-${userId}-${encoded}.${extension}`;
}

export async function cacheRemoteProfileImage(
  remoteUrl: string,
  userId: number,
) {
  try {
    const directory = new Directory(Paths.cache, "profile-images");
    directory.create({ idempotent: true, intermediates: true });

    const fileName = buildCacheFileName(userId, remoteUrl);
    const file = new File(directory, fileName);

    if (file.exists) {
      return file.uri;
    }

    const downloaded = await File.downloadFileAsync(remoteUrl, file, {
      idempotent: true,
    });

    return downloaded.uri;
  } catch (error) {
    console.error("PROFILE IMAGE CACHE ERROR:", error);
    return null;
  }
}
