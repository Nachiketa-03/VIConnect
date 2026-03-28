const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/PROJECT1')
    .then(() => console.log('Connected to MongoDB: PROJECT1'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize Gemini AI after MongoDB connection
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });



// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

// Community Forum Post Schema
const postSchema = new mongoose.Schema({
    author:      { type: String, required: true },
    authorEmail: { type: String, required: true },
    authorPic:   { type: String, default: '' },
    content:     { type: String, required: true },
    category:    { type: String, default: 'General' },
    likes:       [{ type: String }],               // array of emails
    comments:    [{
        author:      String,
        authorEmail: String,
        authorPic:   String,
        text:        String,
        createdAt:   { type: Date, default: Date.now }
    }],
    createdAt:   { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Instead, import the model
const ResetToken = require('./models/resetToken');

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration on startup (no test email)
transporter.verify()
    .then(() => console.log('Email server ready'))
    .catch(err => console.error('Email config error:', err.message));

// Helper function for sending emails with device info
async function sendEmail(to, subject, htmlContent) {
    const mailOptions = {
        from: {
            name: 'VIT Connect',
            address: process.env.EMAIL_USER
        },
        to,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${htmlContent}
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                        <p>Device Details:</p>
                        <ul style="list-style: none; padding-left: 0;">
                            <li>Device: ${process.env.DEVICE_NAME}</li>
                            <li>Location: ${process.env.LOCATION}</li>
                            <li>User: ${process.env.USER_NAME}</li>
                            <li>Time: ${new Date().toLocaleString()}</li>
                        </ul>
                        <p style="color: #888;">This is an automated message from VIT Connect. Please do not reply.</p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}



// Register Route
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Send welcome email
        try {
            const welcomeHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #6200ea; margin-bottom: 20px;">Welcome to VIT Connect!</h2>
                        <p style="color: #444; line-height: 1.5;">Hi ${username},</p>
                        <p style="color: #444; line-height: 1.5;">Thank you for joining VIT Connect! Your account has been successfully created.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL || 'http://localhost:3000'}/dashboard" 
                               style="display: inline-block; padding: 12px 24px; background-color: #6200ea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Get Started
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Best regards,<br>The VIT Connect Team</p>
                    </div>
                </div>
            `;

            await sendEmail(
                email,
                'Welcome to VIT Connect!',
                welcomeHtml
            );
            console.log('Welcome email sent successfully');
        } catch (emailError) {
            console.error('Welcome email error:', emailError);
            // Continue with registration even if email fails
        }

        res.json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'Registration failed' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        res.json({ 
            success: true, 
            message: 'Login successful!',
            redirectPath: '/dashboard/index.html',
            userData: {
                username: user.username,
                email: user.email,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Login failed' });
    }
});

// Add rate limiting for forgot password requests
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3 // limit each IP to 3 requests per windowMs
});

// Add the forgot password route
app.post('/api/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ 
                success: true, 
                message: 'If this email exists, you will receive reset instructions.' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        // Store token in database
        await ResetToken.create({
            userId: user._id,
            token: resetToken,
            expires: expires
        });

        // Create reset URL
        const resetUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

        // Email template
        const resetHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #6200ea;">Reset Your Password</h1>
                <p>Hello ${user.username},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #6200ea; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this reset, please ignore this email or contact support.</p>
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated message from VIConnect. Please do not reply.
                </p>
            </div>
        `;

        // Send email
        await sendEmail(
            email,
            'Reset Your VIConnect Password',
            resetHtml
        );

        res.json({ 
            success: true, 
            message: 'Reset instructions sent to your email.' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.json({ 
            success: false, 
            message: 'An error occurred. Please try again later.' 
        });
    }
});

// Update the reset password route to include better error handling and logging
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Find valid token
        const resetToken = await ResetToken.findOne({
            token: token,
            expires: { $gt: new Date() },
            used: false
        });

        if (!resetToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset token.' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        const user = await User.findByIdAndUpdate(resetToken.userId, {
            password: hashedPassword
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Mark token as used
        resetToken.used = true;
        await resetToken.save();

        res.json({ 
            success: true, 
            message: 'Password reset successful.' 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while resetting your password.' 
        });
    }
});



// Add this new route to fetch Gmail profile
app.get('/api/user-profile', async (req, res) => {
    try {
        const { email } = req.query;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.json({ success: false, message: 'Failed to fetch profile' });
    }
});

// Add this new route for username updates
app.post('/api/update-username', async (req, res) => {
    try {
        const { email, newUsername } = req.body;
        
        // Find and update the user
        const user = await User.findOneAndUpdate(
            { email },
            { username: newUsername },
            { new: true }
        );
        
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Username updated successfully',
            username: user.username
        });
    } catch (error) {
        console.error('Username update error:', error);
        res.json({ success: false, message: 'Failed to update username' });
    }
});

// Add route to update profile picture
app.post('/api/update-profile-pic', async (req, res) => {
    try {
        const { email, profilePic } = req.body;
        
        const user = await User.findOneAndUpdate(
            { email },
            { profilePic },
            { new: true }
        );
        
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePic: user.profilePic
        });
    } catch (error) {
        console.error('Profile picture update error:', error);
        res.json({ success: false, message: 'Failed to update profile picture' });
    }
});

// Update the chat endpoint to include more robust error handling
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Verify Gemini API configuration
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return res.status(500).json({ error: 'AI service not configured' });
        }

        // Generate response from Gemini
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        
        res.json({ success: true, response: text });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
});



// Add this route
app.post('/api/google-login', async (req, res) => {
    try {
        const { credential } = req.body;
        
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user if doesn't exist
            const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
            user = new User({
                username: name,
                email: email,
                password: hashedPassword,
                profilePic: picture
            });
            await user.save();

            // Send welcome email to new Google users
            try {
                const welcomeHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #6200ea;">Welcome to VIConnect!</h2>
                        <p>Hi ${name},</p>
                        <p>Thank you for joining VIConnect using your Google account.</p>
                        <p>You can now access all features of our platform.</p>
                    </div>
                `;
                await sendEmail(email, 'Welcome to VIConnect!', welcomeHtml);
            } catch (emailError) {
                console.error('Welcome email error:', emailError);
            }
        }

        res.json({
            success: true,
            message: 'Google login successful',
            redirectPath: '/dashboard/index.html',
            userData: {
                username: user.username,
                email: user.email,
                profilePic: user.profilePic || picture
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.json({ 
            success: false, 
            message: 'Google login failed',
            error: error.message 
        });
    }
});

// Add this route to handle password changes
app.post('/api/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect.' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.json({ 
            success: true, 
            message: 'Password updated successfully.' 
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while updating your password.' 
        });
    }
});

// Add this route to handle activity updates
app.post('/api/update-activity', async (req, res) => {
    try {
        const { email, isActive = true } = req.body;
        
        await User.findOneAndUpdate(
            { email },
            { 
                lastActive: new Date(),
                isActive
            }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update activity status' 
        });
    }
});

// ========== COMMUNITY FORUM API ==========

// Get all posts (newest first)
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(100);
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Fetch posts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
    try {
        const { author, authorEmail, authorPic, content, category } = req.body;
        if (!content || !authorEmail) {
            return res.status(400).json({ success: false, message: 'Content and email are required' });
        }
        const post = await Post.create({ author, authorEmail, authorPic, content, category: category || 'General' });
        res.json({ success: true, post });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ success: false, message: 'Failed to create post' });
    }
});

// Like / unlike a post
app.post('/api/posts/:id/like', async (req, res) => {
    try {
        const { email } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const idx = post.likes.indexOf(email);
        if (idx === -1) post.likes.push(email);
        else post.likes.splice(idx, 1);
        await post.save();
        res.json({ success: true, likes: post.likes });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ success: false, message: 'Failed to like post' });
    }
});

// Add a comment to a post
app.post('/api/posts/:id/comment', async (req, res) => {
    try {
        const { author, authorEmail, authorPic, text } = req.body;
        if (!text || !authorEmail) {
            return res.status(400).json({ success: false, message: 'Comment text and email are required' });
        }
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        post.comments.push({ author, authorEmail, authorPic, text });
        await post.save();
        res.json({ success: true, comments: post.comments });
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
});

// Delete a post (only author can delete)
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { email } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.authorEmail !== email) return res.status(403).json({ success: false, message: 'Unauthorized' });
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});