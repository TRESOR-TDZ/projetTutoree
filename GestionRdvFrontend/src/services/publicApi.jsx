import axios from "axios";

const publicApi = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    Accept: "application/json",
  },
});

export default publicApi;