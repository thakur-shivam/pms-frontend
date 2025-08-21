export interface User {
  id: string;
  name: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role_id: string;
}