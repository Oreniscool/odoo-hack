import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional interceptor for logging or auth token
axiosInstance.interceptors.request.use((config) => {
  // Example: attach token if you have auth
  // const token = localStorage.getItem("token");
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default axiosInstance;
