import axios from "axios";
import type { ImagePickerAsset } from "expo-image-picker";

import { API_BASE_URL } from "../config/api";

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
) {
  const response = await axios.post(
    `${API_BASE_URL}/profile/change-password`,
    {
      currentPassword,
      newPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function uploadProfileImage(
  token: string,
  asset: ImagePickerAsset,
) {
  const formData = new FormData();

  formData.append("avatar", {
    uri: asset.uri,
    name: asset.fileName || `profile-${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  } as any);

  const response = await fetch(`${API_BASE_URL}/profile/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Unable to upload profile image.");
  }

  return data as {
    message: string;
    img: string;
    imageUrl: string | null;
  };
}
