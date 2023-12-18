import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
require('dotenv').config();
import jwt from 'jsonwebtoken';

const emailRegespattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVarified: boolean;
  courses: Array<{ courseId: string }>;
  comparePasswords: (password: string) => Promise<boolean>;
  SignAccessToken : ()=>string;
  SignRefreshToken : ()=>string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegespattern.test(value);
        },
        message: "Please enter a valid email ",
      },
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVarified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Sign access token : When use login we create a new token and add it
UserSchema.methods.SignAccessToken = function () {
  return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN ||'', {
    expiresIn: "5m"
  })
};

// Sign refresh token 
UserSchema.methods.SignRefreshToken = function () {
  return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN ||'', {
    expiresIn: "3d"
  })

}

// Compare the password
UserSchema.methods.comparePasswords = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", UserSchema);

export default userModel;
