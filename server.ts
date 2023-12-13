import { app } from "./app";
import dotenv from "dotenv";
import connectDB from "./utils/db";


const port = process.env.PORT || 8000;

// Create a new server
dotenv.config();
app.listen(port, () => {
  console.log(`Server is connected with port ${port}`);
  connectDB()
});
