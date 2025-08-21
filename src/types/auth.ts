export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role_name: string;
}

export interface LoginResponse {
  statusCode: number,
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
  message: string
  success: boolean
  
  // message: string;
  // accessToken: string;
  // user: User;
}

export interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  login: (response: LoginResponse) => void;
  logout: () => void;
}