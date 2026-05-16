const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up Multer to store files in memory for fast processing
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API Route to handle future file uploads or data saving
app.post('/api/upload', upload.single('excelFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  // The file is available in req.file.buffer if backend processing is needed later
  res.json({ 
    message: 'File received by server successfully', 
    filename: req.file.originalname 
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});