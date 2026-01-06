import axios from "axios";

// API 기본 URL (환경변수가 없을 경우 기본값 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://portfolio-fitspec.onrender.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃 추가
});

// 요청 인터셉터: 모든 요청에 JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        devLog("토큰 추가됨:", token.substring(0, 20) + "...");
      } else {
        devError("토큰이 없습니다!");
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
