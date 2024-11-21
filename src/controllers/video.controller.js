import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploaderOnCloudinary} from "../utils/cloudinary.js"


// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     //TODO: get all videos based on query, sort, pagination
// })
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

   const sortByField = ["createdAt", "duration", "views"];
   const sortTypeArr = ["asc", "dsc"];
 
   if (!sortByField.includes(sortBy) || !sortTypeArr.includes(sortType)) {
     throw new ApiError(400, "Please send valid fields for sortBy or sortType");
   }
   if (userId && !isValidObjectId(userId)) {
     throw new ApiError(400, "Invalid userId");
   }
   const _video = Video.aggregate([
     {
       $match: {
         $or: [
           {
             owner: userId ? new mongoose.Types.ObjectId(userId) : null,
           },
           {
             $and: [
               { isPublished: true },
               {
                 $or: [
                   {
                     title: query
                       ? { $regex: query, $options: "i" }
                       : { $exists: true },
                   },
                   {
                     description: query
                       ? { $regex: query, $options: "i" }
                       : null,
                   },
                 ],
               },
             ],
           },
         ],
       },
     },
     {
       $lookup: {
         from: "users",
         localField: "owner",
         foreignField: "_id",
         as: "owner",
         pipeline: [
           {
             $project: {
               fullName: 1,
               username: 1,
               avatar: 1,
             },
           },
         ],
       },
     },
     {
       $sort: {
         [sortBy]: sortType === "dsc" ? -1 : 1,
       },
     },
     {
       $addFields: {
         owner: {
           $first: "$owner",
         },
       },
     },
   ]);
 
   const result = await Video.aggregatePaginate(_video, {
     page,
     limit,
     customLabels: {
       totalDocs: "totalVideos",
       docs: "Videos",
     },
     allowDiskUse: true,
   });
 
   if (result.totalVideos === 0) {
     throw new ApiError(404, "Videos not found");
   }
 
   return res
     .status(200)
     .json(new ApiResponse(200, result, "Videos fetched successfully"));
 });




const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if ( [title , description].some((field)=>field.trim()==="")) {
        throw new ApiError(400,"tile and description needed..")
    }
    const thhumbnailLocalPath=req.files?.thumbnail?.[0]?.path
    const videoFileLocalPath=req.files?.videoFile?.[0]?.path

    if (!thhumbnailLocalPath) {
        throw new ApiError(400,"thumbnail not found")
    }

    if (!videoFileLocalPath) {
        throw new ApiError(400,"videoFile not found")
    }

    const videoFileOnCloudinary=await uploaderOnCloudinary(videoFileLocalPath)
    const thumbnailOnCloudniary=await uploaderOnCloudinary(thhumbnailLocalPath)

    if (!videoFileOnCloudinary) {
        throw new ApiError(400, "video  uploading on cloudnairy is failed ")
    }

    if (!thumbnailOnCloudniary) {
        throw new ApiError(400, "thumbnails  uploading on cloudnairy is failed ")
    }
    const _video=await video.create(
        {
            title,
            description,
            duration:videoFile.duration||0,
            videoFile:{
                url:videoFile.url,
                public_id:videoFile.public_id
            },
            thumbnail:{
                thumbnail : thumbnail.url ,
                public_id:thumbnail.public_id
            },
            owner:req.user?._id,
            isPublished:false
        }
    )

    const uploadedVideo = await video.findById(_video._id);

    if (!uploadedVideo) {
        throw new ApiError(400,"video not published")
    }

    return res.status(200).json(
        new ApiResponse(
            200,_video,"video uploaded succesfully"
        )
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description}=req.body

    //TODO: update video details like title, description, thumbnail
    if (!videoId) {
        throw new ApiError(400,"User not found with this id..")
    }
    if (!title && !description) {
       throw new ApiError(400,"not a valid user..") 
    }
    const _video = Video.findById(videoId)
    if (!_video) {
        throw new ApiError(400, "video not found")
    }
    if(_video?.owner.toString() != req.user?._id.toString()){
      throw new ApiError(500 , "only video owner can update the video");
    }
    const thumbnailToDelete = _video.thumbnail.public_id ;
    const thhumbnailLocalPath=req.file?.path
    if (!thhumbnailLocalPath) {
      throw new ApiError(500 , "thumbail not found");
    }
    const thumbnailUploaderOnCloudinary = await uploaderOnCloudinary(thhumbnailLocalPath)
    if (!thumbnailUploaderOnCloudinary) {
      throw new ApiError(500 , "uploding on cloudinary failed ");
    }
    const updateVideo= await Video.findByIdAndUpdate(
      videoId,
      {
        $set:{
          title,
          description,
          thumbnail:{
            public_id : thumbnail.public_id,
                  url : thumbnail.url
          }
        }
      },
      {
        new:true
      }
    )

    if (!updateVideo) {
      throw new ApiError(400,"updating video failed")
    }
    if (updateVideo) {
      await deleteOnCloudinary(thumbnailToDelete);
    }
    res.status(200).json(
      new ApiResponse(200,updateVideo,"video updated succesfully")
    )
  

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"invalid videoId");
    }
    const _video = await Video.findById(videoId)
    if (!_video) {
       throw new ApiError(400,"Vdeio for this not found")
    }
    if(_video?.owner.toString() != req.user?._id.toString()){
      throw new ApiError(500 , "only video owner can delete the video");
    }

    const videoDelete = await Video.findByIdAndDelete(videoId)
    if (!videoDelete) {
        throw new ApiError(400, "video deletion failed..")
    }
     //delete thumbnail and video from cloudinary 
    await deleteOnCloudinary(_video?.thumbnail.public_id);
    await deleteOnCloudinary(_video.videoFile?.public_id , "video");

     //delete that video like
    await Like.deleteMany({video:videoId});
    
        //delete video Comment
    await Comment.deleteMany({video:videoId});
    res.status(200).json(new ApiResponse(200,{},"video deleted successfully"))
    
    

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}