import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";

dotenv.config();

export const app = express();

// body parser with increased limit
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// Cors => cross-origin resource sharing
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

// Routing
app.use("/api/v1", userRouter);

// Testing api
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ message: `API is working...!` });
});

// Unknown Route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Invalid route ${req.originalUrl} not found`) as any;
  err.status = 404;
  next(err);
  // res.status(404).json({ message: `Invalid route ${req.originalUrl} not found` });
  /* In above two error use any one, Both serve same purpose*/
});

app.use(ErrorMiddleware);
