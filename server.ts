import { app } from "./app";
import {v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv";
import connectDB from "./utils/db";
import http from 'http';
import { initSocketServer } from "./socketServer";

const server = http.createServer(app)

// Cloudinary configuration
cloudinary.config({
cloud_name: process.env.CLOUD_NAME,
api_key : process.env.CLOUD_API_KEY,
api_secret : process.env.CLOUD_SECRET_API_KEY
})

const port = process.env.PORT || 8000;

dotenv.config();

// Create a new server
initSocketServer(server);

server.listen(port, () => {
  console.log(`Server is connected with port ${port}`);
  connectDB()
});
