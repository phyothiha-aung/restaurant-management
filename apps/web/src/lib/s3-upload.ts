import axios from "axios";

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
  expiresAt: string;
}

export const uploadToS3 = async (
  upload: PresignedPost,
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) => {
  const body = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => body.append(key, value));
  body.append("file", file);
  await axios.post(upload.url, body, {
    signal,
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
};
