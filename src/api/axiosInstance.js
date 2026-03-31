import axios from "axios";

// All API calls go through this instance
// It automatically attaches the JWT token from localStorage to every request
const axiosInstance = axios.create({
  baseURL: "http://localhost:8082", // your Spring Boot backend
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST interceptor — runs before every API call
// Reads the token from localStorage and adds it to Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor — runs after every API response
// If backend returns 401 (token expired/invalid), auto-logout
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
