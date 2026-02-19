import api from "./axios";

export const accountsApi = {
  list: () => api.get("/accounts").then((r) => r.data),
  create: (data) => api.post("/accounts", data).then((r) => r.data),
  update: (id, data) => api.put(`/accounts/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/accounts/${id}`),
};
