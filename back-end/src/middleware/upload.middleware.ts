import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(), // stores image in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});
