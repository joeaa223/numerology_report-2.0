import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load .env file
import { NumerologyCalculator, getReport } from './numerology_report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to generate the numerology report
app.post('/api/generate-report', async (req, res) => {
    const { birthday, gender } = req.body;

    if (!birthday) {
        return res.status(400).json({ error: 'Birthday is required' });
    }

    try {
        const calculator = new NumerologyCalculator();
        const result = calculator.calculate(birthday, gender);

        const report = await getReport({
            personality: result.mainPersonality,
            age: result.age,
            lifePath: result.lifePath.number,
            isMaster: result.lifePath.isMaster,
            karmicDebtOrigin: result.lifePath.karmicDebtOrigin,
            birthday: result.birthday,
            challenges: result.challenges,
            personalYear: result.personalYear,
            gender: result.gender
        });
        
        // The report from Gemini is a JSON string in our case, so we parse it.
        const reportJson = JSON.parse(report);
        
        res.json({
            report: reportJson[0], // The report itself is nested in an array
            calculations: result
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});