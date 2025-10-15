// AxiosInstance.ts
import axios from 'axios';

let baseURL: string;
const isDevelopment = import.meta.env.MODE === "development"

if (isDevelopment) {
  baseURL = import.meta.env.VITE_API_BASE_URL_LOCAL
}
else {
  baseURL = import.meta.env.VITE_API_BASE_URL_DEPLOY
}

console.log("API baseURL:", baseURL);

export const RefreshInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    accept: "application/json",
  },
  withCredentials: true,
});

const AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    accept: "application/json",
  },
  withCredentials: true, // ⬅️ critical for cookies
});


// to check for access token --> like after request when the response from the server comes we intercept the response and check if the token is expired or not, if the server says the access token is invalid then we use the refresh token to get the access token by doing a post at the endpoint /refresh
AxiosInstance.interceptors.response.use(response => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await AxiosInstance.post("/accounts/refresh");

        // This is the code to Retry original request
        return AxiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed, ${refreshError}");
      }
    }

    return Promise.reject(error);
  }
);

// AxiosInstance.interceptors.response.use(
//   response => response,
//   async (error) => {
//     const originalRequest = error.config;

//     //     - If the response status is **401 Unauthorized** → it means:
//     //   - The access token is likely expired.
//     // - The `!originalRequest._retry` part means:
//     //   - We only want to retry **once**, not infinitely → so we add a custom flag.
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         await RefreshInstance.post("/accounts/refresh");
//         return AxiosInstance(originalRequest);
//       } catch (refreshError) {
//         console.error("Token refresh failed");
//         // Optional: redirect to login/logout
//       }
//     }

//     return Promise.reject(error);
//   }
// );


export default AxiosInstance;

// in applications import as api