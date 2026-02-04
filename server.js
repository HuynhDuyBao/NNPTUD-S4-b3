const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy untuk API (optional)
app.get('/api/v1/*', (req, res) => {
    res.status(200).json({ message: 'API proxy endpoint' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server đang chạy tại http://localhost:${PORT}`);
    console.log(`✓ Nhấn Ctrl+C để dừng server`);
});
