"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getNotification = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const node_cron_1 = __importDefault(require("node-cron"));
// Get all notifications --Only for Admin
exports.getNotification = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.default.find().sort({
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Update notification status --Only for Admin
exports.updateNotification = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default(`Notification not found`, 500));
        }
        else {
            notification.status
                ? (notification.status = "read")
                : notification?.status;
        }
        await notification.save();
        const notifications = await notification_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Delete notification--Admin only
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notification_model_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
});
