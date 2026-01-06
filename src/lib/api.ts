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
  // 모든 값을 명시적으로 올바른 타입으로 변환
  const requestBody: any = {
    gymId: Number(data.gymId), // 명시적으로 숫자로 변환
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

  console.log("=== API 호출 시작 ===");
  console.log("URL:", `${API_BASE_URL}/members`);
  console.log("Request Body (JSON):", JSON.stringify(requestBody, null, 2));
  console.log("Request Body (타입 확인):", {
    gymId: { value: requestBody.gymId, type: typeof requestBody.gymId, isNaN: isNaN(requestBody.gymId) },
    name: { value: requestBody.name, type: typeof requestBody.name, length: requestBody.name.length },
    gender: { value: requestBody.gender, type: typeof requestBody.gender },
    age: { value: requestBody.age, type: typeof requestBody.age, isNaN: isNaN(requestBody.age) },
    height: { value: requestBody.height, type: typeof requestBody.height, isNaN: isNaN(requestBody.height) },
    weight: { value: requestBody.weight, type: typeof requestBody.weight, isNaN: isNaN(requestBody.weight) },
    notes: requestBody.notes ? { value: requestBody.notes, type: typeof requestBody.notes } : "undefined",
  });

  try {
    const response = await axios.post<MemberResponse>(`${API_BASE_URL}/members`, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("=== API 호출 성공 ===");
    console.log("Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("=== API 호출 실패 ===");
    console.error("Error:", error);
    console.error("Error Response Data:", error.response?.data);
    console.error("Error Response Status:", error.response?.status);
    console.error("Error Response Headers:", error.response?.headers);
    console.error("Request Config:", {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
    });

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

export const getMembersApi = async (gymId?: number): Promise<GetMembersResponse> => {
  const url = gymId ? `${API_BASE_URL}/members?gymId=${gymId}` : `${API_BASE_URL}/members`;
  const response = await axios.get<GetMembersResponse>(url);
  return response.data;
};

// 회원 수정 API
export interface UpdateMemberRequest {
  gymId?: number;
  name?: string;
  gender?: "M" | "F";
  age?: number;
  height?: number;
  weight?: number;
  notes?: string;
}

export const updateMemberApi = async (id: string | number, data: UpdateMemberRequest): Promise<MemberResponse> => {
  const requestBody: any = {};

  if (data.gymId !== undefined) requestBody.gymId = Number(data.gymId);
  if (data.name !== undefined) requestBody.name = String(data.name).trim();
  if (data.gender !== undefined) requestBody.gender = String(data.gender);
  if (data.age !== undefined) requestBody.age = Number(data.age);
  if (data.height !== undefined) requestBody.height = Number(data.height);
  if (data.weight !== undefined) requestBody.weight = Number(data.weight);
  if (data.notes !== undefined) {
    requestBody.notes = data.notes && data.notes.trim() ? String(data.notes).trim() : null;
  }

  try {
    const response = await axios.patch<MemberResponse>(`${API_BASE_URL}/members/${id}`, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("=== 회원 수정 API 호출 실패 ===");
    console.error("Error:", error);
    console.error("Error Response Data:", error.response?.data);
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
    const response = await axios.delete<DeleteMemberResponse>(`${API_BASE_URL}/members/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("=== 회원 삭제 API 호출 실패 ===");
    console.error("Error:", error);
    console.error("Error Response Data:", error.response?.data);
    throw error;
  }
};
