import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { App } from 'octokit';
import { GoogleGenAI } from '@google/genai';

let app: App;
let ai: GoogleGenAI;

async function initializeServices() {
  if (app && ai) return; // Already initialized

  // Read the private key directly from environment
  let privateKey = process.env.GITHUB_PRIVATE_KEY || '';

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in Vercel Environment Variables");
  if (!process.env.GITHUB_APP_ID) throw new Error("GITHUB_APP_ID is missing in Vercel Environment Variables");
  if (!privateKey) throw new Error("GITHUB_PRIVATE_KEY is missing in Vercel Environment Variables");
  if (!process.env.GITHUB_WEBHOOK_SECRET) throw new Error("GITHUB_WEBHOOK_SECRET is missing in Vercel Environment Variables");

  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Dynamically import octokit to fix Vercel CommonJS ESM bug
  // We use new Function to completely hide the import from Vercel's esbuild transpiler
  const octokitModule = await new Function("return import('octokit')")();
  const AppClass = octokitModule.App;

  app = new AppClass({
    appId: process.env.GITHUB_APP_ID,
    privateKey: privateKey,
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET
    },
  });
}

// Native Vercel Serverless Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow simple GET requests to check if it's online
  if (req.method === 'GET') {
    return res.status(200).send('AI Code Reviewer API is running natively on Vercel!');
  }

  try {
    await initializeServices();
  } catch (error: any) {
    console.error("Initialization Error:", error);
    // This will print the exact missing key to the GitHub Webhook response tab!
    return res.status(500).json({ error: "Configuration Error", message: error.message });
  }

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
              return res.status(200).json({ message: "No diff found" });
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
          return res.status(200).json({ success: true, message: "Review posted successfully!" });

        } catch (error: any) {
          console.error("Error during PR review process:", error);
          return res.status(500).json({ error: "Server crashed!", message: error.message, stack: error.stack });
        }
    }
  }

  // Acknowledge receipt of the webhook for unhandled events
  return res.status(200).json({ message: "Webhook received but ignored" });
}
