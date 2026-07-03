import express from 'express';
import dotenv from 'dotenv';
import { App } from 'octokit';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

// Initialize Express
const server = express();
const port = process.env.PORT || 3000;
server.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

// Read the private key for GitHub App (handles Vercel env variables with \n or local file path)
let privateKey = process.env.GITHUB_PRIVATE_KEY || '';

if (!privateKey && process.env.GITHUB_PRIVATE_KEY_PATH) {
  const fs = require('fs');
  const path = require('path');
  privateKey = fs.readFileSync(path.resolve(process.env.GITHUB_PRIVATE_KEY_PATH), 'utf8');
}

if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

// Initialize GitHub App
const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: privateKey,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!
  },
});

server.get('/api', (req, res) => {
  res.send('AI Code Reviewer API is running!');
});

server.post('/api/webhook', async (req, res) => {
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
          // 1. Get an authenticated Octokit client
          const octokit = await app.getInstallationOctokit(installationId);
          
          // 2. Fetch the Pull Request Diff
          const diffResponse = await octokit.rest.pulls.get({
            owner: repoOwner,
            repo: repoName,
            pull_number: prNumber,
            mediaType: {
              format: 'diff'
            }
          });
          
          const diff = diffResponse.data as unknown as string;
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
              model: 'gemini-2.5-flash',
              contents: prompt,
          });
          
          const aiReview = response.text;
          console.log("Received response from Gemini.");

          // 4. Post the AI's review as a comment
          await octokit.rest.issues.createComment({
            owner: repoOwner,
            repo: repoName,
            issue_number: prNumber,
            body: `### 🤖 AI Code Review\n\n${aiReview}`
          });
          
          console.log("Successfully posted review to GitHub!");

        } catch (error) {
          console.error("Error during PR review process:", error);
        }
    }
  }

  // Acknowledge receipt of the webhook
  res.status(200).send('OK');
});

// For local development, we still want to listen on a port
if (process.env.NODE_ENV !== 'production') {
  server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

// Export the server for Vercel Serverless Functions
module.exports = server;
