// Signup
export const signup = async (req, res) => {
    try {
        res.send('signup kk')
    } catch (err) {
        console.error("test error msg")
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