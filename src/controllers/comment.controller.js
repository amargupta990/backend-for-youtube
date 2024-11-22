import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const videos = await video.findById(videoId);

    if(!videos){
        throw new ApiError(400,"video not found");
    }

    const commentAggregate = await Comment.aggregate([
       {
        $match:{
            video : new mongoose.Types.ObjectId(videoId)
        }
       },
       {
        $lookup:{
            from:"User",
            localField:"owner",
            foreignField:"_Id",
            as:"owner"
        }
       },
       {
        //get comment details of than comment of video
        $lookup:{
            from:"Like",
            localField:"_id",
            foreignField:"comment",
            as:"like"
        }
       },
       {
        $addFields:{
            likeCount:{
                $size : "$like"
            },
            owner:{
                $first:"$owner"
            },
            isLiked:{
                $cond:{
                    if : { $in : [req.user?._id , "$like.likeBy"] },
                    then : true ,
                    else : false
                }
            },
        },
       },
       {
        $sort:{
            createdAt:-1
        }
       },
       {
        $project:{
            content: 1,
            createdAt: 1,
            likesCount: 1,
            owner: {
                username: 1,
                fullName: 1,
                "avatar.url": 1
            },
            isLiked: 1
        }
    }
])

const option = {
    page : parseInt(page , 10),
    limit: parseInt(limit , 10)
}

const comments = await Comment.aggregatePaginate(
    commentAggregate ,
    option
)

return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if (!content) {
        throw new ApiError(400,"content not found")
    }
    const _video = await Video.findById(videoId)
    if (!_video) {
        throw new ApiError(400,"video not found")   
    }
    const createComment = await Comment.create({
        content ,
        video : videoId ,
        owner : req.user?._id 
    })
    if(!createComment){
        throw new ApiError(400,"could not comment")
    }
    res.status(200).json(new ApiResponse(200,createComment,"comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"comment not found")
    }
    const _comment = await commentId.findById(commentId)
    if (!_comment) {
        throw new ApiError(400, "invalid comment id ")
    }
    if(_comment?.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400, "only comment owner can edit their comment");
    }
    const updatedcomment = await Comment.findByIdAndUpdate(
        _comment?._id , 
        {
            $set:{content}
        },
        {new:true}
    )
    if(!updatedcomment){
        throw new ApiError(400, "comment could not be updated")
    }
    res.status(200).json(
        200,updatedcomment,"comment updated successfully"
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}= req.params;
    const comment = await comment.findById(commentId)
    if (!comment) {
        throw new ApiError(400, "comment not found")
    }
    if(comment?.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"only owner can delete comment")
    }
    await comment.findByIdAndDelete(commentId)

    await Like.deleteMany({
        comment : commentId,
        likeBy : req.user
    })
    res.status(200).json(200,{commentId},"comment deleted succesfully")

    

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }