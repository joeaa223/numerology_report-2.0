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
    const { birthday } = req.body;

    if (!birthday) {
        return res.status(400).json({ error: 'Birthday is required' });
    }

    console.log(`Starting report generation for birthday: ${birthday}`);
    const startTime = Date.now();

    try {
        const calculator = new NumerologyCalculator();
        const result = calculator.calculate(birthday);
        console.log('Numerology calculations completed');

        console.log('Starting AI report generation...');
        const report = await getReport({
            personality: result.mainPersonality,
            age: result.age,
            lifePath: result.lifePath.number,
            isMaster: result.lifePath.isMaster,
            karmicDebtOrigin: result.lifePath.karmicDebtOrigin,
            birthday: result.birthday,
            challenges: result.challenges,
            personalYear: result.personalYear
        });
        
        const endTime = Date.now();
        console.log(`AI report generation completed in ${(endTime - startTime) / 1000}s`);
        
        // The report from Gemini is a JSON string in our case, so we parse it.
        const reportJson = JSON.parse(report);
        
        res.json({
            report: reportJson[0], // The report itself is nested in an array
            calculations: result
        });

    } catch (error) {
        const endTime = Date.now();
        console.error(`Error generating report after ${(endTime - startTime) / 1000}s:`, error);
        
        let errorMessage = '生成报告时出现错误，请稍后再试。';
        let statusCode = 500;
        
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
            errorMessage = 'AI生成超时，请稍后重试。生成过程通常需要1-3分钟。';
            statusCode = 408;
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
            errorMessage = 'API调用频率过高，请稍后再试。';
            statusCode = 429;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = '网络连接问题，请检查网络后重试。';
            statusCode = 503;
        } else if (error.message.includes('API key') || error.message.includes('credentials')) {
            errorMessage = '服务配置错误，请联系管理员。';
            statusCode = 503;
        }
        
        res.status(statusCode).json({ 
            error: errorMessage, 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
