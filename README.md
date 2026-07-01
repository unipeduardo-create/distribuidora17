export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Distributor {
  id: string;
  name: string;
  address: string;
  location: string;
  photo: string | null;
  isOpen: boolean;
  observation?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName?: string; // denormalizado para o admin conseguir ver
  userEmail?: string;
}
