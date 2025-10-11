import User from "../models/user.model.js"
import bcrypt from "bcrypt"

// Signup
export const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        console.log(req.body);
        // Check for empty fields
        if ( !firstName|| !lastName || !email || !password) {
        return res
            .status(400)
            .json({ message: "Please enter all required fields." });
        }
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(400).json({
            message: "An account with this email exists.",
        });
        }

        // hash the password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // create and save new user to the DB
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        const savedUser = await newUser.save();
        
        res.send({User: savedUser});
    } catch (err) {
        console.error(err);
    }
    
}

// Login
export const login = async (req, res) => {
    try {
        res.send('login')
    } catch (err) {
        console.error("test error msg")
    }
}

// Logout
export const logout = async (req, res) => {
    try {
        res.send('logout')
    } catch (err) {
        console.error("test error msg")
    }
}

export default { signup, login, logout };