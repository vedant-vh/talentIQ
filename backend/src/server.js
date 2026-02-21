import express from 'express'
import { ENV } from './lib/env.js';
import path from 'path'
import { connectDB } from './lib/db.js';
import cors from 'cors'
import {serve} from "inngest/express"
import {inngest} from "./lib/inngest.js"
import { functions } from './lib/inngest.js';
import {clerkMiddleware} from '@clerk/express'
//import { protectRoute } from './middleware/protectRoute.js';
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js"

const app = express();

// const __dirname = path.resolve()

//middleware
app.use(express.json())
//credentails:true means server allows brrowser to include cookies on request
app.use(cors({origin: ENV.CLIENT_URL, credentials:true}))
app.use(clerkMiddleware());   //adds auth field to req object: req.auth()

app.use("/api/inngest", serve({client: inngest, functions}))




app.get("/qwe", (req,res) => {
    res.status(200).json("success from backend api")
})

//when you pass an array of middleware to expresss, it automatically flattens  and executes them sequentially, one by one
// app.get("/video-calls", protectRoute, (req,res) => {
//     res.status(200).json("success from video-calls api, protected route")
// })





app.use("/api/chat", chatRoutes)
app.use("/api/chat", sessionRoutes)


// make app ready for deployment
if (ENV.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")))

    app.get("/{*any}", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}



const startServer = async () => {
    try {
        await connectDB();
        app.listen(ENV.PORT, () => console.log(`server running on port ${ENV.PORT}`));
    } catch (error) {
        console.log("errno starting the server",error)
    }
}

startServer();

// export default app;