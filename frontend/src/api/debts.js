import api from "./axios";

export const debtsApi = {
  list: () => api.get("/debts").then((r) => r.data),
  create: (data) => api.post("/debts", data).then((r) => r.data),
  update: (id, data) => api.put(`/debts/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/debts/${id}`),
  addPayment: (id, data) => api.post(`/debts/${id}/payments`, data).then((r) => r.data),
};
