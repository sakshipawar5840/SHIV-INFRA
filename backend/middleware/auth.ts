import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Application startup aborted."
  );
}


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    company_id: string;
    role: string;
    email: string;
  };
}


// ===============================
// JWT AUTHENTICATION
// ===============================

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers.authorization;



  if (!authHeader) {

    return res.status(401).json({
      success:false,
      error:"Authorization header missing"
    });

  }



  if (!authHeader.startsWith("Bearer ")) {

    return res.status(401).json({
      success:false,
      error:"Invalid authorization format. Use Bearer <token>"
    });

  }



  const token = authHeader
    .replace("Bearer ", "")
    .trim();


  try {



    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as {
      id:string;
      company_id:string;
      email:string;
      role:string;
    };



    req.user = decoded;



    next();



  } catch(error:any){


    console.log(
      "JWT VERIFY ERROR:",
      error.message
    );


    return res.status(403).json({

      success:false,

      error:"Invalid or expired session security token."

    });


  }

};




// ===============================
// ROLE AUTHORIZATION
// ===============================

export const authorizeRoles = (
  ...allowedRoles:string[]
)=>{


  return (

    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction

  )=>{


    if(!req.user){


      return res.status(401).json({

        success:false,

        error:"Unauthenticated session."

      });


    }


    const userRole =
      req.user.role?.toLowerCase();



    const roles =
      allowedRoles.map(
        role => role.toLowerCase()
      );



    if(
      !roles.includes(userRole)
    ){


      return res.status(403).json({

        success:false,

        error:"Access denied"

      });


    }



    next();


  };


};