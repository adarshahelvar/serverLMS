require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";

import { redis } from "./redis";
import { access } from "fs";

// This ITokenOptions is written to save in cookies
interface ITokenOptions {
  expire: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}
// parse enivironment variables to integrate with fallback values

export const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
export const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// Options for cookies
export const accessTokenOptions: ITokenOptions = {
  expire: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expire: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure: true,
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // Upload session to redis for maintaining cache
  redis.set(user._id, JSON.stringify(user) as any);

  

  //   Only set secure to true in production
  // if (process.env.NODE_ENV === "production") {
    // Commenting because added in top as secure: true,
  //   accessTokenOptions.secure = true;
  // }
  // Exclude the password field from the user object
  const userWithoutPassword = { ...user.toObject(), password: undefined };

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user: userWithoutPassword,
    accessToken,
  });
};
