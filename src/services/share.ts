/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_APP_API_URL;

// Reusable API request function with Bearer token
export const api = async<T> (
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data: any = null,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => {
  try {
    // Get token from localStorage
    const token = sessionStorage.getItem("token");

    // Set Authorization header if token exists
    const headers = {
      Authorization: token ? `Bearer ${token}` : undefined,
      ...config.headers,
    };

    // Make the request
    const response = await axios({
      method,
      url: baseUrl + url,
      data,
      headers,
      ...config,
    });

    return response;
  } catch (error: any) {
    console.error("API Error:", error.response ?? error);
    throw error.response ?? error;
  }
};
