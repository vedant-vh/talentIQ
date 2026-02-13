import {StreamChat} from 'stream-chat'
import { ENV } from './env.js'

const apiKey = ENV.STREAM_API_KEY
const apiSecret = ENV.STREAM_API_SECRET

if (!apiKey || !apiSecret){
    console.error("api or secret key missing");
    

}

export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

//create as well as update
export const upsertStreamUser = async(userData) => {
    try {
        await chatClient.upsertUser(userData)
        console.log("Stream user upderted successfully: ", userData)
    } catch (error) {
        console.error("Error upserting stream user: ", error)
    }
}

export const deleteStreamUser = async (userId) => {
    try {
        await chatClient.deleteUser(userId)
        console.log("Stream user deleted successfully: ", userId);
        
    } catch (error) {
        console.error("Error deleting the stream user: ", error)
    }
}