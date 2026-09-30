import axios, {
  AxiosHeaders,
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/useAuthStore";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

type ApiClientDependencies = {
  baseURL: string;
  timeout?: number;
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  refreshAccessToken: () => Promise<string>;
  onAuthFailure?: () => void;
};

const ensureHeaders = (config: InternalAxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  return config.headers;
};

const applyAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
  token: string,
) => {
  const headers = ensureHeaders(config);
  headers.Authorization = `Bearer ${token}`;
};

const requestRefreshToken = async (baseURL: string) => {
  const { data } = await axios.post<{ data: { accessToken: string } }>(
    `${baseURL}/api/auth/refresh-tokens`,
    {},
    {
      withCredentials: true,
    },
  );

  const newToken = data.data.accessToken;

  if (!newToken) {
    throw new Error("No access token returned from refresh endpoint");
  }

  return newToken;
};

export const createApiClient = ({
  baseURL,
  timeout = 10000,
  getAccessToken,
  setAccessToken,
  clearAuth,
  refreshAccessToken,
  onAuthFailure,
}: ApiClientDependencies): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout,
  });

  let isRefreshing = false;
  let failedQueue: PendingRequest[] = [];

  const processQueue = (error: unknown, token?: string) => {
    failedQueue.forEach((request) => {
      if (error) {
        request.reject(error);
        return;
      }

      if (token) {
        request.resolve(token);
      }
    });

    failedQueue = [];
  };

  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();

      if (token) {
        applyAuthorizationHeader(config, token);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as
        RetryableRequestConfig | undefined;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          applyAuthorizationHeader(originalRequest, token);
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        setAccessToken(newToken);
        processQueue(null, newToken);
        applyAuthorizationHeader(originalRequest, newToken);
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearAuth();
        onAuthFailure?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
};

const defaultBaseUrl = import.meta.env.VITE_API_URL;

const apiClient = createApiClient({
  baseURL: defaultBaseUrl,
  getAccessToken: () => useAuthStore.getState().token,
  setAccessToken: (token) => {
    const state = useAuthStore.getState();
    state.setAuth(state.user, token);
  },
  clearAuth: () => useAuthStore.getState().logout(),
  refreshAccessToken: () => requestRefreshToken(defaultBaseUrl),
  onAuthFailure: () => {
    window.location.href = "/login";
  },
});

export default apiClient;
