import axios from "axios";

export const refreshAccessToken = async () => {
  const response = await axios.post("/api/refresh-token", {}, { withCredentials: true });
  return response.data.accessToken;
};