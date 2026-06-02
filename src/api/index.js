import { authAPI } from "./authAPI";
import { userAPI } from "./userAPI";

const APIDFN = {
  APIDFN: (APIModule, APIName, conditions) => {
    return API[APIModule](APIName, conditions);
  },
};

// eslint-disable-next-line
const API = Object.assign(
  {},
  { authAPI, userAPI }
);

export { API, APIDFN };
