import mongoose,{Schema} from "mongoose"

const subscriptionSchema = nedw Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"

    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },{timestamps:true}
})


export const subcription =mongoose.model("Subscription",subscriptionSchema)