import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api"
});

// Request Interceptor (token send karega)
API.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User APIs
export const registerUser = (data) => API.post("/user/register", data);

export const loginUser = (data) => API.post("/user/login", data);

// Visitor APIs
export const getVisitors = () => API.get("/visitors");

export const createVisitor = (data) => API.post("/visitors", data);

// Reports
export const getReports = () => API.get("/reports");

// Pass
export const generatePass = (data) => API.post("/passes", data);

// Email
export const sendEmail = (data) => API.post("/send-email", data);

// SMS
export const sendSMS = (data) => API.post("/send-sms", data);

export default API;