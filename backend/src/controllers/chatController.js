import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
    try {
        const token = chatClient.createToken(req.user.clerkId) //stream id should match clerkid, not db id

        res.status(200).json({
            token, 
            userId: req.user.clerkId,
            userName: req.user.name,
            userImage: req.user.image
        })
    } catch (error) {
        console.log("Error in getStreamToken controller", error.message);
        
        res.status(500).json({message: "Internal server error"});
    }
}