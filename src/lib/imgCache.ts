import * as FileSystem from "expo-file-system/legacy";
import { API_ORIGIN } from "../config/api";

export function toAbsoluteImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;

  const cleaned = String(imagePath).trim();

  if (
    !cleaned ||
    cleaned.toLowerCase() === "null" ||
    cleaned.toLowerCase() === "undefined"
  ) {
    return null;
  }

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  return `${API_ORIGIN}${cleaned.startsWith("/") ? cleaned : `/${cleaned}`}`;
}

function getExtensionFromUrl(url: string) {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "jpg";
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
): Promise<string | null> {
  try {
    if (!remoteUrl) return null;

    const fileName = buildCacheFileName(userId, remoteUrl);
    const localPath = `${FileSystem.cacheDirectory}${fileName}`;

    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      return localPath;
    }

    const result = await FileSystem.downloadAsync(remoteUrl, localPath);

    if (result.status !== 200) {
      return null;
    }

    return result.uri;
  } catch (error: any) {
    console.log("PROFILE IMAGE CACHE SKIPPED:", error?.message || error);
    return null;
  }
}
