import api from "./axios";

export const budgetsApi = {
  getMonth: (year, month) => api.get(`/budgets/month/${year}/${month}`).then((r) => r.data),
  create: (data) => api.post("/budgets", data).then((r) => r.data),
  update: (id, data) => api.put(`/budgets/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/budgets/${id}`),
};
