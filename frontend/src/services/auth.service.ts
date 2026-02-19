import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
  ParentRegisterRequest,
  ParentRegisterResponse,
  StudentRegisterRequest,
  StudentRegisterResponse,
  School,
  TeacherInfo,
  ChildrenListResponse,
} from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/api/auth/login', data);
    return res.data;
  },

  async registerParent(data: ParentRegisterRequest): Promise<ParentRegisterResponse> {
    const res = await api.post<ParentRegisterResponse>('/api/auth/register/parent', data);
    return res.data;
  },

  async registerStudent(data: StudentRegisterRequest): Promise<StudentRegisterResponse> {
    const res = await api.post<StudentRegisterResponse>('/api/auth/register/student', data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/api/auth/register', data);
    return res.data;
  },

  async getMe(): Promise<UserResponse> {
    const res = await api.get<UserResponse>('/api/auth/me');
    return res.data;
  },

  async getSchools(): Promise<School[]> {
    const res = await api.get<School[]>('/api/auth/schools');
    return res.data;
  },

  async getTeachersBySchool(schoolId: string): Promise<TeacherInfo[]> {
    const res = await api.get<TeacherInfo[]>(`/api/auth/schools/${schoolId}/teachers`);
    return res.data;
  },

  async getMyChildren(): Promise<ChildrenListResponse> {
    const res = await api.get<ChildrenListResponse>('/api/auth/my-children');
    return res.data;
  },
};
