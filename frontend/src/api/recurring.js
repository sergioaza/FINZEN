import api from "./axios";

export const recurringApi = {
  list: () => api.get("/recurring").then((r) => r.data),
  create: (data) => api.post("/recurring", data).then((r) => r.data),
  update: (id, data) => api.put(`/recurring/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/recurring/${id}`),
  pay: (id) => api.post(`/recurring/${id}/pay`).then((r) => r.data),
};
