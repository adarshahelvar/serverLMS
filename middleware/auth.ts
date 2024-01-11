import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { updateAccessToken } from "../controllers/user.controller";

interface ExtendedRequest extends Request {
  user?: any;
}

// Authnticated user
export const isAuthenticated = CatchAsyncError(
  async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
      return next(new ErrorHandler("Please login to access", 400));
    }
    const decoded = jwt.decode(access_token) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler("Access token is not valiad", 400));
    }
    // Check if the access token is is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
      try {
        await updateAccessToken(req, res, next);
      } catch (error) {
        return next(error);
      }
    } else {
      const user = await redis.get(decoded.id);
      if (!user) {
        return next(
          new ErrorHandler("Please login to access this resource..!", 400)
        );
      }

      req.user = JSON.parse(user);
      next();
    }
  }
);

// Validate user role

export const authorizationRoles = (...roles: string[]) => {
  return (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          400
        )
      );
    }
    next();
  };
};
