import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const API_BASE_URL = "https://portfolio-fitspec.onrender.com";

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
    userName?: string;
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
  userName: string;
  gymName: string;
}

export interface SignupResponse {
  message?: string;
  user?: {
    id: string;
    email: string;
    userName?: string;
  };
}

export const signupApi = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await axios.post<SignupResponse>(`${API_BASE_URL}/auth/signup`, data);
  return response.data;
};