import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.model.js"
import {uploaderOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req,res)=>{
     const {fullname, email,username,password}=req.body
     console.log(email);

     if (
          [fullname,email,username,password].some((fields)=>
            fields?.trim()==="")
     ) {
          throw new ApiError(400, "All fields are required")
     }

     const existeduser= await User.findOne({
          $or:[{username},{email}]
     })
     if (existeduser) {
          throw new ApiError(409,"User with email or username already exists..")
     }
      const avatarLocalPath = req.files?.avatar?.[0]?.path
      const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

      if(!avatarLocalPath) {
          throw new ApiError(400,"Avatar file is required")
      }

     //  const avatar=await uploaderOnCloudinary(avatarLocalPath)
     //  const coverImage =await uploaderOnCloudinary(coverImageLocalPath)
      let avatar;
      try {
          avatar =   await uploaderOnCloudinary(avatarLocalPath)
      } catch (error) {
          console.log("error uploading on avatar image " , error);
          throw new ApiError(500,"failed to upload avatar")
      }
      let coverImage;
      try {
          coverImage =   await uploaderOnCloudinary(coverImageLocalPath)
      } catch (error) {
          console.log("error uploading on coverImage image " , error);
          throw new ApiError(500,"failed to upload coverImage")
      }

      if(!avatar) {
          throw new ApiError(400,"Avatar file is required")
      }
      const user =await User.create({
          fullname,
          avatar: avatar.url,
          coverImage: coverImage?.url||"",
          email,
          password,
          username:username.toLowerCase()
     })

     const createdUser=await User.findById(user._id).select(
          "-password -refreshToken"
     )
     if (!createdUser) {
          throw new ApiError(500,"Something went wrong while registring the user")
     }

     return res.status(201).json(
          new ApiResponse(200,createdUser, "Ussr resistered succesfully")
     )
})
export {registerUser}