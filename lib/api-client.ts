"use client";

import axios, { AxiosError } from "axios";

export type ApiErrorCode =
  | "ALREADY_OWNED"
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "SESSION_ALREADY_ACTIVE"
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "PAYMENT_TERMINAL_INACTIVE"
  | "PURCHASE_REQUIRED"
  | "VIDEO_UNAVAILABLE"
  | "RESET_TOKEN_INVALID"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  message: string;
  code?: ApiErrorCode;
  email?: string;
  retryAfterSeconds?: number;
}

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (typeof window !== "undefined" && !error.response) {
      window.dispatchEvent(new CustomEvent("app:network-error"));
    }

    return Promise.reject(error);
  }
);

export const isNetworkError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && !error.response;
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export const getApiErrorCode = (error: unknown): ApiErrorCode | undefined => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.code;
  }

  return undefined;
};
