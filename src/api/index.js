import { authAPI } from "./authAPI";
import { userAPI } from "./userAPI";
import { mailAPI } from "./mailAPI";
import { contactAPI } from "./contactAPI";

/** "mailAPI", "sendMail"처럼 이름을 문자열로 넘겨 호출하던 예전 방식. */
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
