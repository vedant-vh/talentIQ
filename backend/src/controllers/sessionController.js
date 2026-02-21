import Session from '../models/Session.js'
import {chatClient, streamClient} from '../lib/stream.js'


export async function createSession(req,res) {
    try {
        const {problem, difficulty} = req.body
        const userId = req.user._id
        const clerkId = req.user.clerkId

        if (!problem || !difficulty){
            return res.status(400).json({message: "Problem and difficulty are required"})
        }

        //generate unique callid for stream video
        const callid = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`

        //create session in db
        const session = await Session.create({problem, difficulty, host: userId, callId})

        //create stream video call
        await streamClient.video.call("default", callId).getOrCreate({
            data: {
                created_by_id: clerkId,
                custom: {problem, difficulty, sessionId: session._id.toString()}
            }
        })

        //chat messaging
        const channel = chatClient.channel("messaging", callId, {
            name: `${problem} Session`,
            created_by_id: clerkId,
            members: [clerkId]
        })

        await channel.create();

        res.status(201).json({session})

    } catch (error) {
        console.log("Error in createSession controller: error.message");
        res.status(500).json({message: "Internal Server Error"});
        
    }
}

export async function getActiveSessions(_,res) {
    try {
        const sessions = await Session.find({status: "active"})
            .populate("host", "name profileImage email clerkId")
            .sort({createdAt: -1})
            .limit(20)
        res.status(200).json({sessions})    
    } catch (error) {
        console.log("Error in getActiveSessions controller: ", error.message);
        res.status(500).json({message: "Internal Server Error"})        
    }
}

export async function getMyRecentSessions(req,res) {
    try {
        const userId = req.user._id

        //get sessions where user is either host or participant 
        const sessions = await Session.find({
            status: "completed",
            $or: [{host: userId}, {participant: userId}]
        })
        .sort({createdAt: -1})
        .limit(20);

        res.status(200).json({sessions})
    } catch (error) {
        console.log("Error in getMyRecentSessions controller: ", error.message);
        res.status(500).json({messgae: "Internal server error"});
    }
}

export async function getSessionById(req,res) {
    try {
        const {id} = req.params;
        const session = await Session.findById(id)
            .populate("host", "name email profileImage clerkId")
            .populate("participant", "name email profileImage clerkId");
        
        if (!session) return res.status(404).json({message: "Session not found"})
        
        res.status(200).json({session})    
            
    } catch (error) {
        console.log("Error in getSessionById controller: ", error.message);
        res.status(500).json({message: "Internal Server Error"});
        
    }
}

export async function joinSession(req,res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        const session = await Session.findById(id)

        if (!session) return res.status(404).json({message: "Session not found"});

        //check if session is already full (2 people)
        if (session.participant) return res.status(404).json({message: "Session is full"});

        session.participant = userId;
        await session.save();

        const channel = chatClient.channel("messaging", session.callId)
        await channel.addMembers([ckerkId])

        res.status(200).json({session})
    } catch (error) {
        console.log("Error in joinSession controller: ", error.message);
        res.status(500).json({message: "Internal Server error"});
        
    }
}

export async function endSession(req,res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;

        const session = await Session.findById(id);

        if (!session) return res.status(404).json({message: "session not found"});

        // check if user is the host
        if (session.host.toString() !== userId.toString()){
            return res.status(403).json({message: "Only host can end the session"})
        }

        //check if session is already completed
        if (session.status === "completed"){
            return res.status(400).json({message: "Session is alread completed"});
        }

        session.status = completed;
        await session.save();

        //delete stream vc
        const call = streamCLiend.video.call("defualt", session.callId)
        await call.delete({hard: true})

        //delete stream chat channel
        const channel = chatClient.channel("messaging", session.callId) ;
        await channel.delete();

        res.status(200).json({session, message: "Session ended successfully"});

    } catch (error) {
        console.log("Error in endSession controller", error.message);
        res.status(500).json({message: "Internal server error"});
        
    }
}


//can use express-async-handler for larger codebases