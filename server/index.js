import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import AWS from "aws-sdk";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* AWS S3 Configuration */
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/* FILE STORAGE */
const upload = multer(); // No need to specify storage for S3 uploads

/* Function to Upload File to S3 */
const uploadToS3 = (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `img/${file.originalname}`, // Specify the directory path
    Body: file.buffer,
    ACL: "public-read", // Set ACL to allow public read access
    ContentType: file.mimetype,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.Location); // Resolve with the S3 URL
      }
    });
  });
};


/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), async (req, res) => {
  try {
    const imageUrl = await uploadToS3(req.file);
    req.body.picturePath = imageUrl;
    await register(req, res);
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({ error: "Error uploading file to S3" });
  }
});

app.post("/posts", verifyToken, upload.single("picture"), async (req, res) => {
  try {
    if(!req.file) {
      await createPost(req, res);
      return  
      
    }
    const imageUrl = await uploadToS3(req.file);
    req.body.picturePath = imageUrl;
    await createPost(req, res);
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({ error: "Error uploading file to S3" });
  }
});

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
