import express from 'express'
import { ENV } from './lib/env.js';


const app = express();

app.get("/", (req,res) => {
    res.status(200).json("success from backend api")
})

app.listen(ENV.PORT, () => console.log(`server running on port ${ENV.PORT}`))