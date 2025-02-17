import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import OrderModel, { IOrder } from "../models/order.model";
import userModel, { IUser } from "../models/user.model";
import CourseModel, { ICourse } from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { redis } from "../utils/redis";
import NotificationModel from "../models/notification.model";
import { getAllOrdersService, newOrder } from "../services/order.services";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRT_KEY);

// Define an interface to extend the Request object
interface CustomRequest extends Request {
  user?: IUser; // Add your custom properties here
}

// Create an order
export const createOrder = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;
      if (payment_info) {
        if ("id" in payment_info) {
          const paymentIntentId = payment_info.id;
          const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
          );
          if (paymentIntent.status !== "succeeded") {
            return next(new ErrorHandler(`Payment not authorized!`, 400));
          }
        }
      }
      const user = await userModel.findById(req.user?._id);
      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );
      if (courseExistInUser) {
        return next(
          new ErrorHandler(`You have already purchased this course`, 400)
        );
      }

      const course:ICourse | null = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler(`Course not found`, 404));
      }
      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
      }
      user?.courses.push(course?._id);

      await redis.set(req.user?._id, JSON.stringify(user));

      await user?.save();

      const notification = await NotificationModel.create({
        user: user?._id,
        title: "New order confirmation",
        message: `You have a new order for ${course?.name} from ${user?.name}`,
      });

      course.purchased = course?.purchased + 1;
      
      await course.save();
      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all Order--Only for Admin
export const getAllOrders = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Send stripe publishble key

export const sendStripePublishableKey = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
      publishableKey: `${process.env.STRIPE_PUBLISHABLE_KEY}`,
    });
  }
);

// New payment

export const newPayment = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    console.log(req.body);
    try {
      console.log(req.body);
      const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "INR",
        description: "Course purchase",shipping: {
          name: "Data",
          address: {
            line1: "510 Townsend St",
            postal_code: "123456",
            city: "",
            state: "CA",
            country: "India",
          },
        },
        metadata: {
          company: "ELearning",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.status(200).json({
        success: true,
        client_secret: myPayment.client_secret,
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
