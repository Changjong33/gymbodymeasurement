import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10초 타임아웃 추가
});

// API 기본 URL (환경변수가 없을 경우 기본값 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://portfolio-fitspec.onrender.com";

// 로그인 API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    ownerName?: string;
    name?: string;
  };
  message?: string;
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, data);
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
  const response = await axios.post<SignupResponse>(`${API_BASE_URL}/auth/signup`, data);
  return response.data;
};

// 회원 등록 API
export interface MemberRequest {
  gymId: number;
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
  // notes가 undefined이면 제외하고 전송
  const requestBody: any = {
    gymId: data.gymId,
    name: data.name,
    gender: data.gender,
    age: data.age,
    height: data.height,
    weight: data.weight,
  };

  // notes가 있으면 추가
  if (data.notes) {
    requestBody.notes = data.notes;
  }

  console.log("API 호출 - URL:", `${API_BASE_URL}/members`);
  console.log("API 호출 - Body:", JSON.stringify(requestBody, null, 2));

  const response = await axios.post<MemberResponse>(`${API_BASE_URL}/members`, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// 회원 조회 API
export interface GetMembersResponse {
  members?: MemberResponse["member"][];
  message?: string;
}

export const getMembersApi = async (): Promise<GetMembersResponse> => {
  const response = await axios.get<GetMembersResponse>(`${API_BASE_URL}/members`);
  return response.data;
};
