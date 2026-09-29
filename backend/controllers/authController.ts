import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { supabaseAdmin as supabase } from "../config/supabase.ts";



const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Application startup aborted."
  );
}





export class AuthController {



  // =================================
  // REGISTER
  // =================================


  static async register(
    req:Request,
    res:Response,
    next:NextFunction
  ){

    try{


      const {
        company_id,
        name,
        email,
        password,
        phone,
        role
      } = req.body;



      if(
        !company_id ||
        !name ||
        !email ||
        !password
      ){

        return res.status(400).json({

          success:false,

          message:
          "Company id, name, email and password required"

        });

      }





      const {
        data:existingUser
      } =
      await supabase
      .from("users")
      .select("id")
      .eq(
        "email",
        email
      )
      .maybeSingle();





      if(existingUser){

        return res.status(400).json({

          success:false,

          message:
          "Email already exists"

        });

      }





      const allowedRoles = ["Super Admin","Admin","Engineer","Sales Manager","Customer"];
      const safeRole = allowedRoles.includes(role) ? role : "Customer";

      const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );
      const {
        data,
        error
      } =
      await supabase
      .from("users")
      .insert({


        company_id,


        full_name:
        name,


        email,


        password:
        hashedPassword,


        phone,


        role:
        safeRole,


        status:
        "active"


      })
      .select()
      .single();


      if(error)
      throw error;






      return res.status(201).json({

        success:true,

        message:
        "User registered successfully",

        user:data

      });





    }
    catch(error){

      next(error);

    }


  }







  // =================================
  // LOGIN
  // =================================


  static async login(
    req:Request,
    res:Response,
    next:NextFunction
  ){

    try{


      const {
        email,
        password
      } = req.body;





      if(
        !email ||
        !password
      ){

        return res.status(400).json({

          success:false,

          message:
          "Email and password required"

        });

      }






      const {
        data:user,
        error
      }
      =
      await supabase
      .from("users")
      .select("*")
      .eq(
        "email",
        email
      )
      .single();







      if(
        error ||
        !user
      ){

        return res.status(401).json({

          success:false,

          message:
          "Invalid email or password"

        });

      }







      if(
        String(user.status).toLowerCase() !== "active"
      ){

        return res.status(403).json({

          success:false,

          message:
          "Account inactive"

        });

      }







      let passwordMatch=false;



      if(
        user.password &&
        user.password.startsWith("$2")
      ){


        passwordMatch =
        await bcrypt.compare(


          password,


          user.password


        );

      }








      if(!passwordMatch){

        return res.status(401).json({

          success:false,

          message:
          "Invalid email or password"

        });

      }








      const token =

      jwt.sign(

        {

          id:user.id,

          company_id:
          user.company_id,

          email:
          user.email,

          role:
          user.role


        },


        JWT_SECRET,


        {

          expiresIn: "8h"

        }

      );








      return res.json({

        success:true,

        message:
        "Login successful",


        token,



        user:{


          id:user.id,

          company_id:
          user.company_id,


          name:
          user.full_name,


          email:
          user.email,


          phone:
          user.phone,


          role:
          user.role,


          profile_image:
          user.profile_image


        }


      });







    }
    catch(error){

      next(error);

    }


  }









  // =================================
  // REFRESH TOKEN
  // =================================


  static async refreshToken(
    req:Request,
    res:Response
  ){

    try{


      const {
        token
      } = req.body;




      if(!token){

        return res.status(400).json({

          success:false,

          message:
          "Refresh token required"

        });

      }






      const decoded:any =

      jwt.verify(

        token,

        JWT_SECRET

      );







      const newToken =

      jwt.sign(

        {

          id:
          decoded.id,


          company_id:
          decoded.company_id,


          email:
          decoded.email,


          role:
          decoded.role


        },


        JWT_SECRET,


        {

          expiresIn: "8h"

        }

      );






      return res.json({

        success:true,

        token:newToken

      });




    }
    catch(error){

      return res.status(403).json({

        success:false,

        message:
        "Invalid refresh token"

      });

    }


  }









  // =================================
  // LOGOUT
  // =================================

  static async logout(
    req:Request,
    res:Response
  ){
    // Stateless JWT: there is no server-side session to destroy.
    // The client is expected to discard the stored token. This
    // endpoint exists so the frontend has a real, non-404 hook to
    // call on logout and to keep the activity log consistent.
    return res.json({
      success:true,
      message: "Logout successful"
    });
  }

  // =================================
  // FORGOT PASSWORD
  // =================================


  static async forgotPassword(
    req:Request,
    res:Response
  ){

    const {
      email
    } = req.body;




    return res.json({

      success:true,

      message:
      `Password reset request received for ${email}`

    });


  }



}