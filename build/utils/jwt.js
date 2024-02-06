"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = exports.refreshTokenExpire = exports.accessTokenExpire = void 0;
require("dotenv").config();
const redis_1 = require("./redis");
// parse enivironment variables to integrate with fallback values
exports.accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
exports.refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);
// Options for cookies
exports.accessTokenOptions = {
    expire: new Date(Date.now() + exports.accessTokenExpire * 60 * 60 * 1000),
    maxAge: exports.accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
exports.refreshTokenOptions = {
    expire: new Date(Date.now() + exports.refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: exports.refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: true,
};
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    // Upload session to redis for maintaining cache
    redis_1.redis.set(user._id, JSON.stringify(user));
    //   Only set secure to true in production
    // if (process.env.NODE_ENV === "production") {
    // Commenting because added in top as secure: true,
    //   accessTokenOptions.secure = true;
    // }
    // Exclude the password field from the user object
    const userWithoutPassword = { ...user.toObject(), password: undefined };
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        user: userWithoutPassword,
        accessToken,
    });
};
exports.sendToken = sendToken;
