import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import NotificationModel from "../models/notification.model";

// Get all notifications --Only for Admin
export const getNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.find().sort({
        createdAt: -1,
      });
      /*sort({createdAt: -1}) means in DB the old notification will be at top and 
        the new one will be bottom, While in UI we want new notifications at top , 
        SO with sort({createdAt: -1}) we can get new notifications at top
        */
      res.status(200).json({
        success: true,
        notification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update notification status --Only for Admin

export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id);
      if (!notification) {
        return next(new ErrorHandler(`Notification not found`, 500));
      } else {
        notification.status
          ? (notification.status = "read")
          : notification?.status;
      }
      await notification.save();
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
