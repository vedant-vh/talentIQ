import Session from '../models/Session.js'
import mongoose from 'mongoose'
import {chatClient, streamClient} from '../lib/stream.js'


// export async function createSession(req,res) {
//     try {
//         const {problem, difficulty} = req.body
//         const userId = req.user._id
//         const clerkId = req.user.clerkId

//         if (!problem || !difficulty){
//             return res.status(400).json({message: "Problem and difficulty are required"})
//         }

//         //generate unique callid for stream video
//         const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`

//         //create session in db
//         const session = await Session.create({problem, difficulty, host: userId, callId})

//         //create stream video call
//         await streamClient.video.call("default", callId).getOrCreate({
//             data: {
//                 created_by_id: clerkId,
//                 custom: {problem, difficulty, sessionId: session._id.toString()}
//             }
//         })

//         //chat messaging
//         const channel = chatClient.channel("messaging", callId, {
//             name: `${problem} Session`,
//             created_by_id: clerkId,
//             members: [clerkId]
//         })

//         await channel.create();

//         res.status(201).json({session})

//     } catch (error) {
//         console.log("Error in createSession controller: ", error.message);
//         res.status(500).json({message: "Internal Server Error"});
        
//     }
// }


export async function createSession(req, res) {
  let session; // declare outside for rollback access

  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({
        message: "Problem and difficulty are required",
      });
    }

    // Generate unique callId
    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    // 1️⃣ Create session in DB
    session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
      status: "active"
    });

    try {
      // 2️⃣ Create Stream Video Call
      await streamClient.video.call("default", callId).getOrCreate({
        data: {
          created_by_id: clerkId,
          custom: {
            problem,
            difficulty,
            sessionId: session._id.toString(),
          },
        },
      });

      // 3️⃣ Create Stream Chat Channel
      const channel = chatClient.channel("messaging", callId, {
        name: `${problem} Session`,
        created_by_id: clerkId,
        members: [clerkId],
      });

      await channel.create();

    } catch (streamError) {
      // 🔥 Rollback if Stream fails
      console.error("Stream setup failed, rolling back session:", streamError);

      if (session?._id) {
        await Session.findByIdAndDelete(session._id);
      }

      return res.status(500).json({
        message: "Failed to initialize session services",
      });
    }

    // 4️⃣ Success response
    return res.status(201).json({ session });

  } catch (error) {
    console.error("Error in createSession controller:", error);

    // Extra safety rollback (if something unexpected happens)
    if (session?._id) {
      await Session.findByIdAndDelete(session._id);
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
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
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId")
        .sort({createdAt: -1})
        .limit(20);

        res.status(200).json({sessions})
    } catch (error) {
        console.log("Error in getMyRecentSessions controller: ", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getSessionById(req,res) {
    try {
        const {id} = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid session id" });
        }
        const session = await Session.findById(id)
            .populate("host", "name email profileImage clerkId")
            .populate("participant", "name email profileImage clerkId");
        
        if (!session) return res.status(404).json({message: "Session not found"});

        
        res.status(200).json({session})    
            
    } catch (error) {
        console.log("Error in getSessionById controller: ", error.message);
        res.status(500).json({message: "Internal Server Error"});
        
    }
}

// export async function joinSession(req,res) {
//     try {
//         const {id} = req.params;
//         const userId = req.user._id;
//         const clerkId = req.user.clerkId;

//         const session = await Session.findById(id)

//         if (!session) return res.status(404).json({message: "Session not found"});

//         //check if session is already full (2 people)
//         if (session.participant) return res.status(400).json({message: "Session is full"});

//         session.participant = userId;
//         await session.save();

//         const channel = chatClient.channel("messaging", session.callId)
//         await channel.addMembers([clerkId])

//         res.status(200).json({session})
//     } catch (error) {
//         console.log("Error in joinSession controller: ", error.message);
//         res.status(500).json({message: "Internal Server error"});
        
//     }
// }

// export async function endSession(req,res) {
//     try {
//         const {id} = req.params;
//         const userId = req.user._id;

//         const session = await Session.findById(id);

//         if (!session) return res.status(404).json({message: "session not found"});

//         // check if user is the host
//         if (session.host.toString() !== userId.toString()){
//             return res.status(403).json({message: "Only host can end the session"})
//         }

//         //check if session is already completed
//         if (session.status === "completed"){
//             return res.status(400).json({message: "Session is alread completed"});
//         }

//         session.status = "completed";
//         await session.save();

//         //delete stream vc
//         const call = streamClient.video.call("default", session.callId)
//         await call.delete({ hard: true });

//         //delete stream chat channel
//         const channel = chatClient.channel("messaging", session.callId) ;
//         await channel.delete();

//         res.status(200).json({session, message: "Session ended successfully"});

//     } catch (error) {
//         console.log("Error in endSession controller", error.message);
//         res.status(500).json({message: "Internal server error"});
        
//     }
// }

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    // Validate Mongo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid session id",
      });
    }

    // Atomic update:
    // - Session must exist
    // - Must be active
    // - Must not already have participant
    // - Host cannot join as participant
    const session = await Session.findOneAndUpdate(
      {
        _id: id,
        status: "active",
        participant: null,
        host: { $ne: userId },
      },
      { $set: { participant: userId } },
      { new: true }
    ).populate("host", "name email profileImage clerkId")
    .populate("participant", "name email profileImage clerkId");


    if (!session) {
      return res.status(409).json({
        message:
          "Session is full, inactive, not found, or host cannot join",
      });
    }

    // Add participant to Stream chat channel
    try {
      const channel = chatClient.channel("messaging", session.callId);
      await channel.addMembers([clerkId]);
    } catch (streamError) {
      console.error("Stream channel update failed:", streamError);

      // Rollback participant assignment if Stream fails
      await Session.findByIdAndUpdate(id, {
        $set: { participant: null },
      });

      return res.status(500).json({
        message: "Failed to join session services",
      });
    }

    return res.status(200).json({ session });

  } catch (error) {
    console.error("Error in joinSession controller:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}


export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

     if (!mongoose.Types.ObjectId.isValid(id)) {
       return res.status(400).json({ message: "Invalid session id" });
     }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only host can end
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Only host can end the session",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        message: "Session is already completed",
      });
    }

    // 🔹 Try deleting Stream resources first
    try {
      const call = streamClient.video.call("default", session.callId);
      await call.delete({ hard: true });

      const channel = chatClient.channel("messaging", session.callId);
      await channel.delete();

    } catch (streamError) {
      console.error("Stream cleanup failed:", streamError);
      // Do NOT stop execution
    }

    // 🔹 Mark session completed
    session.status = "completed";
    await session.save();

    return res.status(200).json({
      session,
      message: "Session ended successfully",
    });

  } catch (error) {
    console.error("Error in endSession controller:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

//can use express-async-handler for larger codebases