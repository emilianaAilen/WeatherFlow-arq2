import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import type { CreateUserPayload, UpdateUserPayload } from '../api/users';

const USERS_KEY = ['users'];

export const useUsers = () =>
  useQuery({ queryKey: USERS_KEY, queryFn: usersApi.list });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => usersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
};

export const useSubscribeUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, weatherStationId }: { id: string; weatherStationId: string }) =>
      usersApi.subscribe(id, weatherStationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
};
