// import { StreamChat } from "stream-chat";
// import { ENV } from "./env.js";

// const apiKey = ENV.STREAM_API_KEY;
// const apiSecret = ENV.STREAM_API_SECRET;

// if (!apiKey || !apiSecret) {
//   throw new Error("STREAM_API_KEY or STREAM_API_SECRET is missing");
// }

// export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

// // create or update
// export const upsertStreamUser = async (userData) => {
//   try {
//     await chatClient.upsertUser(userData);
//     console.log("Stream user upserted successfully:", userData.id);
//   } catch (error) {
//     console.error("Error upserting stream user:", error);
//     throw error;
//   }
// };

// export const deleteStreamUser = async (userId) => {
//   try {
//     await chatClient.deleteUser(userId);
//     console.log("Stream user deleted successfully:", userId);
//   } catch (error) {
//     console.error("Error deleting stream user:", error);
//     throw error;
//   }
// };
