import api from "./axios";

export const goalsApi = {
  list: () => api.get("/goals").then((r) => r.data),
  create: (data) => api.post("/goals", data).then((r) => r.data),
  update: (id, data) => api.put(`/goals/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, data) => api.post(`/goals/${id}/contributions`, data).then((r) => r.data),
};
