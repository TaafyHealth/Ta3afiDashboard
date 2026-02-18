import axios from "axios";


// Add a request interceptor
axios.interceptors.request.use(function (config) {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")
    config.headers.Authorization =  `Bearer ${token}`;
    if (role) {
        config.headers.role = role;
    }
     
    return config;
});

axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response !== undefined){

        if (error.response.status === 401) {
          // Redirect to the login page when a 401 error is encountered
          if (window.location.pathname !== '/login'){
              window.location.href = '/login'
            
          }else{
              console.log("Already on Login")

          }
          return Promise.reject("Error Connecting to The Server",error);
        }
      }
      return Promise.reject(error);

       
    }
  );

export default axios