import client from './client';
import type { User } from '../types';

export interface CreateUserPayload {
  name: string;
  surname: string;
  email: string;
}

export interface UpdateUserPayload {
  name?: string;
  surname?: string;
  email?: string;
}

export const usersApi = {
  list: () => client.get<User[]>('/users').then((r) => r.data),

  getById: (id: string) => client.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserPayload) =>
    client.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: UpdateUserPayload) =>
    client.patch<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/users/${id}`),

  subscribe: (id: string, weatherStationId: string) =>
    client.post(`/users/${id}/subscription`, { weatherStationId }),
};
