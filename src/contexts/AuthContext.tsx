import React, { createContext, useContext, useState, useEffect } from "react";
import { SystemUser } from "../types";
import { logSystemAction } from "../lib/mockData";


interface AuthContextType {

  user: SystemUser | null;

  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  logout: () => void;

}



const AuthContext = createContext<AuthContextType | null>(null);



export const AuthProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {


  const [user, setUser] = useState<SystemUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    try {

      const session =
        localStorage.getItem(
          "shiv_infra_active_user"
        );


      if (session) {

        setUser(
          JSON.parse(session)
        );

      }


    } catch (error) {

      localStorage.removeItem(
        "shiv_infra_active_user"
      );

    }
    finally {

      setIsLoading(false);

    }


  }, []);





  const login = async (
    email: string,
    password: string
  ) => {


    setIsLoading(true);


    try {


      const response =
  await fetch(
    "http://localhost:3000/api/v1/auth/login",
    {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        email,
        password
      })

    }
  );



      const data =
        await response.json();



      console.log(
        "LOGIN RESPONSE:",
        data
      );



      if (!response.ok) {


        setIsLoading(false);


        return {

          success: false,

          error:
            data.message ||
            "Invalid login"

        };

      }





      // Check backend response

      if (!data.user || !data.token) {


        setIsLoading(false);


        return {

          success: false,

          error:
            "Invalid login response"

        };


      }





      const loggedUser: SystemUser = {


        id: data.user.id,

        name:
          data.user.name,

        email:
          data.user.email,

        role:
          data.user.role,

        status: "Active"


      };





      setUser(loggedUser);





      localStorage.setItem(

        "shiv_infra_active_user",

        JSON.stringify(loggedUser)

      );




      localStorage.setItem(

        "token",

        data.token

      );





      logSystemAction(

        "Access",

        `Admin login successful ${email}`

      );





      setIsLoading(false);



      return {

        success: true

      };




    } catch (error) {


      console.error(
        "LOGIN ERROR:",
        error
      );


      setIsLoading(false);



      return {

        success: false,

        error:
          "Server connection failed"

      };


    }



  };








  const logout = () => {


    setUser(null);



    localStorage.removeItem(
      "shiv_infra_active_user"
    );



    localStorage.removeItem(
      "token"
    );



    logSystemAction(
      "Access",
      "Admin logout"
    );


  };









  return (

    <AuthContext.Provider

      value={{

        user,

        isLoading,

        login,

        logout

      }}

    >

      {children}

    </AuthContext.Provider>

  );


};









export const useAuth = () => {


  const context =
    useContext(AuthContext);



  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }



  return context;


};