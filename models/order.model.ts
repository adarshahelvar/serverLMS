import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

export interface Iorder extends Document {
  courseId: string;
  userId: string;
  payment_info: object;
}

const orderSchema = new Schema<Iorder>(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: Object,
      // required: true
    },
  },
  {
    timestamps: true,
  }
);

const OrderModel: Model<Iorder> = mongoose.model("Order", orderSchema);
export default OrderModel;
