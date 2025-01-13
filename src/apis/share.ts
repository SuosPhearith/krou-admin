import axios from "axios";

export const uploadChunk = async (
  chunk: Blob,
  index: number,
  totalChunks: number,
  fileName: string
) => {
  const formData = new FormData();
  formData.append("chunk", chunk);
  formData.append("chunkIndex", index.toString());
  formData.append("totalChunks", totalChunks.toString());
  formData.append("fileName", fileName);
  formData.append("userId", "12345");
  formData.append("key", "your_secure_key_1");

  try {
    return await axios.post(
      `${import.meta.env.VITE_APP_ASSET_URL}/upload-chunk`,
      formData
    );
  } catch (error) {
    console.error("Error uploading chunk:", error);
    throw error;
  }
};

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
