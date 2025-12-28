
import axios from "axios";
import SummaryApi from "../common/SummaryApi";

const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// ========== BEFORE REQUEST ==========
Axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
       config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========== AFTER RESPONSE ==========
Axios.interceptors.response.use(
  (response) =>{
    return response
  } ,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken=localStorage.getItem('refreshToken')
      if(refreshToken){
            const newAccessToken = 
            await refreshAccessToken(refreshToken);
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return Axios(originalRequest);
      }
      }
     
    }

    return Promise.reject(error);
  }
);


// ========== REFRESH TOKEN FUNCTION ==========
const refreshAccessToken = async (refreshToken:string) => {
  try {
    const response = await Axios({
      ...SummaryApi.user.refreshToken,
      headers:{
        Authorization:`Bearer ${refreshToken}`
      },
      withCredentials:true
    });

    const token = response.data?.accessToken;

    if (token) {
      localStorage.setItem("accessToken", token);
      return token;
    }

    return null;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return null;
  }
};

export default Axios;
