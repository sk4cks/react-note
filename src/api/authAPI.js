import axios from "axios";
import { env } from "@/api/ApiEnv.js";
import { makeQueryString } from "@/utils/Query.js";

const config = {
  authorizationUrl: `${env.BASE_API_URL + env.AUTHORIZATION_API_CONTEXT_PATH}`
};

const authAPIDFN = {
  authAPI: (APIName, conditions, paths) => {
    return authAPI[APIName](conditions, paths);
  },
};

const authAPI = {
  issueTempToken: (conditions, paths) => {
    const uri = paths || "/auth/issueTempToken";
    return axios.post(`${config.authorizationUrl}${uri}`, conditions)
  }
};

export { authAPIDFN, authAPI };