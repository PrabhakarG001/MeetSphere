import httpStatus from "http-status";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { User } from "./models/user.model.js";
import { Meeting } from "./models/meetings.model.js";

const login = async (req, res)  => {

    let { username, password }  = req.body;
    
    if(!username || !password){
        return res.status(400).json({message: "Please Provide"})
    }

    username = username.trim().toLowerCase();


    try{
    const user = await User.findOne({ username });
    if(!user) {
        return res.status(httpStatus.NOT_FOUND).json({message: "User Not Found"})
    }

  if(await bcrypt.compare(password, user.password)){
    let token = crypto.randomBytes(20).toString("hex");

    user.token = token;
    await user.save();
    return res.status(httpStatus.OK).json({
      token,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        username: user.username
      }
    });
  }

  return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });

    } catch (e) {
  return res.status(500).json({message: `Something went Wrong`})
    }
}


const register = async (req, res)  => {
    let { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Name, username and password are required" });
    }

    username = username.trim().toLowerCase();

    try {
       const existingUser = await User.findOne({ username });
       if(existingUser) {
        return res.status(httpStatus.CONFLICT).json({message: "User already exists"})
       }

       const hashedPassword = await bcrypt.hash(password,10);

       const newUser = new User({
        // (property) username: any 
        name:name,
        username: username,
        password: hashedPassword
       });

       await newUser.save();
       return res.status(httpStatus.CREATED).json({message: "User registered successfully"})

    } catch (e) { 
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message:`Something went Wrong ${e}` })

    }

 }

const addToActivity = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting code are required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user._id.toString(),
            meetingCode: meeting_code
        });

        await newMeeting.save();
        return res.status(httpStatus.CREATED).json({ message: "Activity added" });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${error}` });
    }
};

const getAllActivity = async (req, res) => {
    const token = req.query.token || req.body.token;

    if (!token) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const meetings = await Meeting.find({ user_id: user._id.toString() }).sort({ date: -1 });
        return res.status(httpStatus.OK).json(meetings);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${error}` });
    }
};

const deleteActivity = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting code are required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const deleted = await Meeting.findOneAndDelete({ 
            user_id: user._id.toString(), 
            meetingCode: meeting_code 
        });

        if (!deleted) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found in history" });
        }

        return res.status(httpStatus.OK).json({ message: "Meeting deleted from history" });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${error}` });
    }
};

const googleLogin = async (req, res) => {
    const { username, name, picture } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            user = new User({ username, name, picture });
        } else {
            user.picture = picture;
        }
        user.token = crypto.randomBytes(20).toString("hex");
        await user.save();
        return res.status(httpStatus.OK).json({ token: user.token, user });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${error}` });
    }
};

export { login, register, addToActivity, getAllActivity, deleteActivity, googleLogin };
