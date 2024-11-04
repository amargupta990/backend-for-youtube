import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async () => {
    try {
      const connectioninstance= await mongoose.connect(`${process.env.MOGNODB_URI}/${DB_NAME}`)
      console.log(`\n MONGO DB IS CONNECTED !! ${connectioninstance.connection.host}`);
      
    } catch (error) {
         console.log("ERROR",error)
         process.exit(1)
    }
} 
export default connectDB