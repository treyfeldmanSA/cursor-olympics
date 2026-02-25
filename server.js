const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(bodyParser.json());
app.use(express.static('public'));

// Serve index.html explicitly if needed, but static middleware handles it
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /api/data
app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        res.json(JSON.parse(data));
    });
});

// POST /api/medals
// Expects: { country: "India", type: "gold" | "silver" | "bronze", increment: 1 }
app.post('/api/medals', (req, res) => {
    const { country, type, increment } = req.body;

    if (!country || !type || typeof increment !== 'number') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let jsonData = JSON.parse(data);

        if (!jsonData.medals[country]) {
            return res.status(400).json({ error: 'Country not found' });
        }

        jsonData.medals[country][type] += increment;

        fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.json({ success: true, medals: jsonData.medals });
        });
    });
});

// POST /api/event
// Expects: { name: "100m Dash", winner: "India", medal: "gold" }
app.post('/api/event', (req, res) => {
    const { name, winner, medal } = req.body;

    if (!name || !winner || !medal) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read data' });
        }

        let jsonData = JSON.parse(data);

        // Add event
        jsonData.events.push({
            id: Date.now(),
            name,
            winner,
            medal,
            timestamp: new Date().toISOString()
        });

        // Update medal count automatically
        if (jsonData.medals[winner]) {
            jsonData.medals[winner][medal] += 1;
        }

        fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.json({ success: true, events: jsonData.events, medals: jsonData.medals });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
