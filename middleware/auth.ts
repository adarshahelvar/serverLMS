import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

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
    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload;
    if (!decoded) {
      return next(new ErrorHandler("Access token is not valiad", 400));
    }

    const user = await redis.get(decoded.id);
    if (!user) {
      return next(new ErrorHandler("Access token is not valiad", 400));
    }

    req.user = JSON.parse(user);
    next();
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
