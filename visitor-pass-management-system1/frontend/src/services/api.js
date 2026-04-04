import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
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

export const verifyOtp = (data) => API.post("/user/otpverify", data);

export const loginUser = (data) => API.post("/user/login", data);

// Users
export const getUsers = () => API.get("/user");

// Visitor APIs
export const getVisitors = () => API.get("/visitors");

export const createVisitor = (data) => API.post("/visitors", data);

export const getLatestVisitor = () => API.get("/visitors/latest");

export const verifyVisitor = (id) =>
  API.post("/visitors/verify", { visitorId: id });

// Reports
export const getReports = () => API.get("/reports");

// Pass
export const generatePass = (data) => API.post("/passes", data);

// Email
export const sendEmail = (data) => API.post("/send-email", data);

// SMS
export const sendSMS = (data) => API.post("/send-sms", data);

// Logs
export const getLogs = () => API.get("/checklogs");
export const createLog = (data) => API.post("/checklogs", data);
export const checkoutVisitor = (id) =>
  API.put(`/checklogs/${id}`);

export default API;