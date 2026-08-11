import multer from "multer";
import path from "path";
import fs from "fs";

// Create destination directories if not existing
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".docx", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File extension not permitted. Supported extensions: PNG, JPG, JPEG, PDF, DOCX, XLSX."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
  },
});
