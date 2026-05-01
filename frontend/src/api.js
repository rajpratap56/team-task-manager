import axios from "axios";

const api = axios.create({
  baseURL: "https://team-task-manager-production-36a1.up.railway.app/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !localStorage.getItem("token")) {
      return Promise.reject(new Error("Missing authentication token"));
    }
    return Promise.reject(error);
  }
);

export default api;
