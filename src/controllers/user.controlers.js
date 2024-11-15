import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.model.js"
import {uploaderOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

//method for generating access token and refresh token 
const generateAccessAndRefereshTokens = async(userId) =>{
     try {
         const user = await User.findById(userId)
         const accessToken = user.generateAccessToken()
         const refreshToken = user.generateRefreshToken()
 
         user.refreshToken = refreshToken
         await user.save({ validateBeforeSave: false })
 
         return {accessToken, refreshToken}
 
 
     } catch (error) {
         throw new ApiError(500, "Something went wrong while generating referesh and access token")
     }
 }

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

const loginUser = asyncHandler(async (req ,res)=>{
            //fetch data from fronend
        const {username,email,password}= req.body
            //username || email verifiucation
        if (!username && !email) {
              throw new ApiError(400,"username or email is required...")
        }
         //find user
          const user = await User.findOne({
          $or:[{username},{email}]
        })

        if (!user) {
           throw new ApiError(404,"user not exist");
        }
        //password check
        const ispasswordvalid = user.isPasswordCorrect(password)
        if (!ispasswordvalid) {
             throw new ApiError(401,"password is not correct .."); 
        }
        //access and refresh token geberate and send to user
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
    
    })

const logoutUser = asyncHandler(async(req, res) => {
          await User.findByIdAndUpdate(
              req.user._id,
              {
                  $unset: {
                      refreshToken: 1 // this removes the field from document
                  }
              },
              {
                  new: true
              }
          )
      
          const options = {
              httpOnly: true,
              secure: true
          }
      
          return res
          .status(200)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(new ApiResponse(200, {}, "User logged Out"))
})

export {registerUser , loginUser , logoutUser}