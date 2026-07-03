"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const octokit_1 = require("octokit");
const genai_1 = require("@google/genai");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express
const server = (0, express_1.default)();
const port = process.env.PORT || 3000;
server.use(express_1.default.json());
// Initialize Gemini
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Read the private key for GitHub App
const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH || '';
const privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');
// Initialize GitHub App
const app = new octokit_1.App({
    appId: process.env.GITHUB_APP_ID,
    privateKey: privateKey,
    webhooks: {
        secret: process.env.GITHUB_WEBHOOK_SECRET
    },
});
server.get('/', (req, res) => {
    res.send('AI Code Reviewer is running!');
});
server.post('/webhook', async (req, res) => {
    const event = req.headers['x-github-event'];
    console.log(`Received GitHub event: ${event}`);
    if (event === 'pull_request') {
        const action = req.body.action;
        console.log(`Pull Request Action: ${action}`);
        if (action === 'opened' || action === 'synchronize') {
            const prNumber = req.body.pull_request.number;
            const repoOwner = req.body.repository.owner.login;
            const repoName = req.body.repository.name;
            const installationId = req.body.installation.id;
            console.log(`Analyzing PR #${prNumber} in repo: ${repoOwner}/${repoName}`);
            try {
                // 1. Get an authenticated Octokit client for this specific repository installation
                const octokit = await app.getInstallationOctokit(installationId);
                // 2. Fetch the Pull Request Diff (the actual code changes)
                const diffResponse = await octokit.rest.pulls.get({
                    owner: repoOwner,
                    repo: repoName,
                    pull_number: prNumber,
                    mediaType: {
                        format: 'diff'
                    }
                });
                const diff = diffResponse.data;
                console.log(`Successfully fetched PR diff. Length: ${diff.length} characters`);
                if (!diff || diff.length === 0) {
                    console.log("No diff found. Skipping review.");
                    return res.status(200).send('OK');
                }
                // 3. Send the diff to Gemini for analysis
                console.log("Sending diff to Gemini for analysis...");
                const prompt = `You are a strict, senior software engineer reviewing a Pull Request.
Please review the following code diff and provide constructive feedback.
Focus on bugs, logic errors, security vulnerabilities, and code style.
If the code looks perfect, just say "LGTM! (Looks Good To Me) No issues found."

Code Diff:
${diff}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3.1-pro',
                    contents: prompt,
                });
                const aiReview = response.text;
                console.log("Received response from Gemini.");
                // 4. Post the AI's review as a comment on the GitHub PR
                await octokit.rest.issues.createComment({
                    owner: repoOwner,
                    repo: repoName,
                    issue_number: prNumber,
                    body: `### 🤖 AI Code Review\n\n${aiReview}`
                });
                console.log("Successfully posted review to GitHub!");
            }
            catch (error) {
                console.error("Error during PR review process:", error);
            }
        }
    }
    // Acknowledge receipt of the webhook
    res.status(200).send('OK');
});
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
