import api from "./axios";

export const authApi = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  completeOnboarding: () =>
    api.patch("/auth/me/onboarding", { onboarding_done: true }).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }).then((r) => r.data),
  resendVerification: (email) =>
    api.post("/auth/resend-verification", { email }).then((r) => r.data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, new_password: newPassword }).then((r) => r.data),
  updatePreferences: (data) => api.patch("/auth/me/preferences", data).then((r) => r.data),
};
