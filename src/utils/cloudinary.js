import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
dotenv.config()
cloudinary.config({ 
    cloud_name:process.env.CLOUD_NAME, 
    api_key:process.env.API_KEYS, 
    api_secret:process.env.API_SECRET
});

const uploaderOnCloudinary= async (localFilePath) => {
    try {
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("file has been uploaded succesfully " , response.url);
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}
 export {uploaderOnCloudinary}