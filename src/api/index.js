import { authAPI } from "./authAPI";

const APIDFN = {
  APIDFN: (APIModule, APIName, conditions) => {
    return API[APIModule](APIName, conditions);
  },
};

// eslint-disable-next-line
const API = Object.assign(
  {},
  { authAPI: authAPI }
);

export { API, APIDFN };
