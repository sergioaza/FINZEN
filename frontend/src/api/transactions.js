import api from "./axios";

export const transactionsApi = {
  list: (params) => api.get("/transactions", { params }).then((r) => r.data),
  create: (data) => api.post("/transactions", data).then((r) => r.data),
  update: (id, data) => api.put(`/transactions/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/transactions/${id}`),
  transfer: (data) => api.post("/transactions/transfer", data).then((r) => r.data),
};
