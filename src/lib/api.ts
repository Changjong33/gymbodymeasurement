import axios from "axios";
import { useAuthStore } from "@/store/authStore";

// API 기본 URL (환경변수가 없을 경우 기본값 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://portfolio-fitspec.onrender.com";

// 앱 시작 시 기존 localStorage의 토큰 정리 (보안 강화)
if (typeof window !== "undefined") {
  // localStorage에 남아있을 수 있는 기존 토큰 제거
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃 추가
});

// 요청 인터셉터: 모든 요청에 JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== "undefined") {
      // sessionStorage에서 토큰 가져오기 (로그인 시 sessionStorage에 저장됨)
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        devLog("토큰 추가됨:", token.substring(0, 20) + "...");
      } else {
        devError("토큰이 없습니다! (sessionStorage 확인)");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 개발 모드 체크 함수
const isDevMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development";
};

// 조건부 로깅 함수
const devLog = (...args: any[]) => {
  if (isDevMode()) {
    console.log(...args);
  }
};

const devError = (...args: any[]) => {
  if (isDevMode()) {
    console.error(...args);
  }
};

// ===== 토큰 자동 갱신 및 세션 만료 처리 =====
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const getRefreshTokenFromStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem("refreshToken");
  } catch {
    return null;
  }
};

const saveTokensToStorage = (accessToken?: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  try {
    if (accessToken) {
      sessionStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem("refreshToken", refreshToken);
    }
  } catch (e) {
    devError("토큰 저장 실패:", e);
  }
};

const clearTokensAndLogout = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  } catch (e) {
    devError("토큰 제거 실패:", e);
  }

  try {
    const { logout } = useAuthStore.getState();
    logout();
  } catch (e) {
    devError("authStore logout 실패:", e);
  }

  // 세션 만료 안내 후 로그인 페이지로 이동
  alert("세션이 만료되었습니다. 다시 로그인해주세요.");
  window.location.href = "/login";
};

// Access Token 갱신 요청
const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const existingRefreshToken = getRefreshTokenFromStorage();
  if (!existingRefreshToken) {
    devError("refreshToken 이 없습니다. 세션 만료 처리.");
    return null;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      devLog("AccessToken 갱신 시도");
      // 인터셉터를 타지 않도록 axios 기본 인스턴스 사용
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: existingRefreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data: any = "data" in res.data && res.data.data ? res.data.data : res.data;
      const newAccessToken: string | undefined = data.accessToken || data.token;
      const newRefreshToken: string | undefined = data.refreshToken;

      if (!newAccessToken) {
        devError("갱신 응답에 accessToken 이 없습니다.");
        return null;
      }

      saveTokensToStorage(newAccessToken, newRefreshToken);
      devLog("AccessToken 갱신 성공");
      return newAccessToken;
    } catch (error: any) {
      devError("AccessToken 갱신 실패:", error?.response?.data || error?.message);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// 응답 인터셉터: 401 발생 시 Access Token 갱신 시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 서버 응답이 없거나 브라우저 환경이 아니면 그대로 에러 반환
    if (!error.response || typeof window === "undefined") {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // 401이 아닐 경우 그대로 에러 반환
    if (status !== 401) {
      return Promise.reject(error);
    }

    // 이미 한 번 재시도한 요청이면 세션 만료로 처리
    if ((originalRequest as any)._retry) {
      clearTokensAndLogout();
      return Promise.reject(error);
    }

    (originalRequest as any)._retry = true;

    // Access Token 갱신 시도
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      // Refresh Token 만료 또는 갱신 실패 → 세션 만료 처리
      clearTokensAndLogout();
      return Promise.reject(error);
    }

    // 갱신 성공 시 Authorization 헤더 업데이트 후 요청 재시도
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    // 새로운 토큰을 sessionStorage에도 저장 (이미 saveTokensToStorage에서 처리됨)
    devLog("토큰 갱신 후 요청 재시도");

    return api(originalRequest);
  }
);

// 로그인 API
export interface LoginRequest {
  email: string;
  password: string;
}

// TransformInterceptor로 래핑된 응답 타입
export interface WrappedResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
  message?: string;
}

export interface LoginResponseData {
  accessToken?: string;
  refreshToken?: string;
  gym?: {
    id: number;
    email: string;
    gymName?: string;
    ownerName?: string;
    createdAt?: string;
  };
  token?: string; // 하위 호환성을 위해 유지
  user?: {
    id: string;
    email: string;
    ownerName?: string;
    name?: string;
  };
  message?: string;
}

export type LoginResponse = WrappedResponse<LoginResponseData> | LoginResponseData;

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
};

// 회원가입 API
export interface SignupRequest {
  email: string;
  password: string;
  ownerName: string;
  gymName: string;
}

export interface SignupResponse {
  message?: string;
  user?: {
    id: string;
    email: string;
    ownerName?: string;
  };
}

export const signupApi = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>("/auth/signup", data);
  return response.data;
};

// 회원 등록 API
export interface MemberRequest {
  name: string;
  gender: "M" | "F";
  age: number; // 숫자로 변경
  height: number;
  weight: number;
  notes?: string;
}

export interface MemberResponse {
  message?: string;
  member?: {
    id: string;
    gymId: number;
    name: string;
    gender: string;
    age: string;
    height: number;
    weight: number;
    notes?: string;
    createdAt?: string;
  };
}

export const createMemberApi = async (data: MemberRequest): Promise<MemberResponse> => {
  // 모든 값을 명시적으로 올바른 타입으로 변환
  // gymId는 JWT 토큰에서 서버가 자동으로 추출하므로 포함하지 않음
  const requestBody: any = {
    name: String(data.name).trim(),
    gender: String(data.gender), // "M" 또는 "F"
    age: Number(data.age), // 명시적으로 숫자로 변환
    height: Number(data.height), // 명시적으로 숫자로 변환
    weight: Number(data.weight), // 명시적으로 숫자로 변환
  };

  // notes가 있고 비어있지 않으면 추가
  if (data.notes && data.notes.trim()) {
    requestBody.notes = String(data.notes).trim();
  }

  devLog("=== API 호출 시작 ===");
  devLog("URL:", "/members");
  devLog("Request Body:", requestBody);

  try {
    const response = await api.post<MemberResponse>("/members", requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    devLog("=== API 호출 성공 ===");
    devLog("Response:", response.data);
    return response.data;
  } catch (error: any) {
    devError("=== API 호출 실패 ===");
    devError("Error:", error);
    devError("Error Response Data:", error.response?.data);
    devError("Error Response Status:", error.response?.status);

    // 에러를 다시 throw하여 상위에서 처리할 수 있도록
    throw error;
  }
};

// 회원 조회 API
export interface GetMembersResponse {
  statusCode?: number;
  data?: MemberResponse["member"][];
  members?: MemberResponse["member"][];
  message?: string;
  timestamp?: string;
}

export const getMembersApi = async (): Promise<GetMembersResponse> => {
  // gymId는 JWT 토큰에서 추출하므로 query 파라미터로 보내지 않음
  const response = await api.get<GetMembersResponse>("/members");
  return response.data;
};

// 회원 수정 API
export interface UpdateMemberRequest {
  name?: string;
  gender?: "M" | "F";
  age?: number;
  height?: number;
  weight?: number;
  notes?: string | null;
}

export const updateMemberApi = async (id: string | number, data: UpdateMemberRequest): Promise<MemberResponse> => {
  const requestBody: any = {};

  // gymId는 JWT 토큰에서 서버가 자동으로 추출하므로 포함하지 않음
  if (data.name !== undefined) requestBody.name = String(data.name).trim();
  if (data.gender !== undefined) requestBody.gender = String(data.gender);
  if (data.age !== undefined) requestBody.age = Number(data.age);
  if (data.height !== undefined) requestBody.height = Number(data.height);
  if (data.weight !== undefined) requestBody.weight = Number(data.weight);
  if (data.notes !== undefined) {
    // notes가 null이거나 빈 문자열이면 null로 설정 (특이사항 제거)
    requestBody.notes = data.notes === null || (typeof data.notes === "string" && !data.notes.trim()) ? null : String(data.notes).trim();
  }

  try {
    const response = await api.patch<MemberResponse>(`/members/${id}`, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    devError("=== 회원 수정 API 호출 실패 ===");
    devError("Error:", error);
    devError("Error Response Data:", error.response?.data);
    throw error;
  }
};

// 회원 삭제 API
export interface DeleteMemberResponse {
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

export const deleteMemberApi = async (id: string | number): Promise<DeleteMemberResponse> => {
  try {
    const response = await api.delete<DeleteMemberResponse>(`/members/${id}`);
    return response.data;
  } catch (error: any) {
    devError("=== 회원 삭제 API 호출 실패 ===");
    devError("Error:", error);
    devError("Error Response Data:", error.response?.data);
    throw error;
  }
};

// 측정 계산 API
export interface MeasurementItem {
  categoryId: number;
  value: number;
}

export interface CalculateMeasurementsRequest {
  memberId: number;
  measurements: MeasurementItem[];
}

// 간소화된 측정 결과 인터페이스
export interface AdjustedLevels {
  beginner: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

export interface MeasurementResult {
  categoryId: number;
  exerciseName: string;
  value: number;
  unit: string;
  score: number; // 1~5
  adjustedLevels?: AdjustedLevels;
  level?: string; // 레벨명 (예: "Intermediate", "Elite" 등)
  nextLevel?: string; // 다음 레벨명
  nextLevelTarget?: number; // 다음 레벨 목표값
  remaining?: number; // 다음 레벨까지 남은 값
}

export interface TotalSummary {
  overallLevel: string;
  averageScore: number;
  description: string;
}

export interface CalculateMeasurementsResponse {
  statusCode: number;
  data: {
    totalSummary: TotalSummary;
    results: MeasurementResult[];
  };
  timestamp: string;
}

export const calculateMeasurementsApi = async (data: CalculateMeasurementsRequest): Promise<CalculateMeasurementsResponse> => {
  try {
    const fullUrl = `${API_BASE_URL}/members/calculate-measurements`;
    devLog("=== 측정 계산 API 호출 시작 ===");
    devLog("Full URL:", fullUrl);
    devLog("Request Body:", JSON.stringify(data, null, 2));
    devLog("MemberId:", data.memberId, "Type:", typeof data.memberId);
    devLog("Measurements Count:", data.measurements.length);

    const response = await api.post<CalculateMeasurementsResponse>("/members/calculate-measurements", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    devLog("=== 측정 계산 API 호출 성공 ===");
    devLog("Response:", response.data);
    return response.data;
  } catch (error: any) {
    devError("=== 측정 계산 API 호출 실패 ===");
    devError("Full URL:", `${API_BASE_URL}/members/calculate-measurements`);
    devError("Request Data:", JSON.stringify(data, null, 2));
    devError("Error Status:", error.response?.status);
    devError("Error Status Text:", error.response?.statusText);
    devError("Error Response Data:", error.response?.data);
    devError("Error Message:", error.message);
    devError("Error Config:", {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
    });
    throw error;
  }
};
