import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt, { Secret } from "jsonwebtoken";
require("dotenv").config();
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";

interface ExtendedRequest extends Request {
  user?: IUser;
}

// Register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // console.log("Hit registrationUser")
    try {
      const { name, email, password } = req.body;
      // console.log(req.body);
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          success: true,
          message: "Check your email to activate your account",
          activationToken: activationToken.token,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
interface IActivationToken {
  token: string;
  activationCode: string;
}

// OTP creation
export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

// User activation using OTP

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // console.log("Request Body:", req.body);
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      //   console.log("Activation Token:", activation_token);
      // console.log("Activation Code:", activation_code);

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler(`Invaliad activation code`, 400));
      }

      const { name, email, password } = newUser.user;
      const existUser = await userModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("User already exist", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      res
        .status(200)
        .json({ success: true, message: "User successfully created." });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// User Login
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler(`Please enter email and password`, 400));
      }

      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler(`Invalid email and password`, 400));
      }
      const isPasswordMath = await user.comparePasswords(password);

      if (!isPasswordMath) {
        return next(new ErrorHandler(`Invalid password`, 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Logout user

export const logoutUser = CatchAsyncError(
  async (req: ExtendedRequest , res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "User logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

