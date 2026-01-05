const makeQueryString = (jsonObject) => {
  let queryString = "?";
  let qryStr = "";
  for (var key in jsonObject) {
    if (jsonObject[key] != undefined) {
      qryStr = jsonObject[key].toString().replace(/#/g, "%23");
      queryString += `${key}=${qryStr}&`;
    }
  }
  queryString = queryString.slice(0, -1);
  return queryString;
};


export {
  makeQueryString
};