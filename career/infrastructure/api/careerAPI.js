import { axiosClient } from "@/shared/utils/axiosClient";
export const careerAPI = {
  getAll: () => axiosClient.get("/careers"),
  getById: id => axiosClient.get(`/careers/${id}`),
  search: query => axiosClient.get(`/careers/search?q=${query}`),
  getStats: () => axiosClient.get("/careers/stats"),
  getTrends: () => axiosClient.get("/careers/trends"),
  getSalaryData: careerId => axiosClient.get(`/careers/${careerId}/salary`)
};