import ErrorHandler from "../utils/ErrorHandler";
import { NextFunction, Request, Response } from "express";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: Function) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  // Wrong MongoDB Id error
  if (err.name === "CastError") {
    const message = `Resource not found, Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //   Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong JWT token
  if (err.name === "JsonWebTokenError") {
    const message = ` Json web token not found, Try again`;
    err = new ErrorHandler(message, 400);
  }

  // JWT expiration error
  if (err.name === "TokenExpiredError") {
    const message = `Json web token expired, Try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
