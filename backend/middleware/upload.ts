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
    const safeFieldname = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, "");
    cb(
      null,
      safeFieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf", ".docx", ".xlsx"];

const MIME_TYPE_MAP: Record<string, string[]> = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".pdf": ["application/pdf"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip"
  ],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip"
  ]
};

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error("File extension not permitted. Supported extensions: PNG, JPG, JPEG, PDF, DOCX, XLSX."), false);
  }

  const allowedMimes = MIME_TYPE_MAP[ext];
  if (!allowedMimes || !allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`MIME type '${file.mimetype}' does not match file extension '${ext}'.`), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
  },
});
