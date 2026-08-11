import axios from "axios";


export const apiClient = axios.create({

  baseURL:
    "http://localhost:3000/api",

  headers:{
    "Content-Type":"application/json"
  }

});



// attach JWT token automatically

apiClient.interceptors.request.use(
(config)=>{


const token =
localStorage.getItem("token");


if(token){

 config.headers.Authorization =
 `Bearer ${token}`;

}


return config;


},
(error)=>Promise.reject(error)

);