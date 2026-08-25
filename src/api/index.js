import { authAPI } from "./authAPI";
import { userAPI } from "./userAPI";
import { mailAPI } from "./mailAPI";
import { contactAPI } from "./contactAPI";

/** 예전 호출 방식 호환. API.mailAPI 등을 쓴다. */
const APIDFN = {
  APIDFN: (APIModule, APIName, conditions) => {
    return API[APIModule](APIName, conditions);
  },
};

// eslint-disable-next-line
const API = Object.assign(
  {},
  { authAPI, userAPI, mailAPI, contactAPI }
);

export { API, APIDFN };
