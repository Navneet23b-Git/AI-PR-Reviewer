# AI-Powered GitHub Code Reviewer 🤖

An automated Code Review bot built with Node.js and Google's Gemini AI. This service listens to GitHub Pull Request events via Webhooks and automatically analyzes the code diffs to provide constructive feedback on bugs, logic errors, security vulnerabilities, and code style.

## Features ✨
- **Real-time Webhook Integration:** Instantly detects when a Pull Request is opened or updated on GitHub.
- **Precision Diff Analysis:** Extracts only the exact code changes (additions/deletions) to minimize payload size and focus the AI on what matters.
- **Intelligent Feedback:** Powered by Google's `gemini-2.5-flash` model, it acts as a senior software engineer to identify logical flaws and security risks (like hardcoded credentials or infinite loops).
- **Automated GitHub Comments:** Uses the GitHub API to post the AI's review directly into the Pull Request conversation.

## Tech Stack 🛠️
- **Backend:** Node.js, Express.js
- **Language:** TypeScript
- **AI Integration:** Google Gemini API (`@google/genai`)
- **GitHub SDK:** Octokit

## Prerequisites ⚙️
To run this project locally, you will need:
1. A **Google Gemini API Key** (from Google AI Studio).
2. A **GitHub App** created on your account with Read & Write permissions for Pull Requests.
3. **ngrok** (or a similar tool) to expose your local development server to the internet so GitHub can send webhooks to it.

## Local Setup Instructions 🚀

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_APP_ID=your_app_id_here
GITHUB_PRIVATE_KEY_PATH=./path_to_your_downloaded_private_key.pem
PORT=3000
```

### 4. Start the Development Server
```bash
npm run dev
```
*(Ensure you have `ngrok` running in a separate terminal: `ngrok http 3000`)*

## How it Works 🧠
1. A developer opens a Pull Request on a repository where the GitHub App is installed.
2. GitHub fires a Webhook to your `ngrok` URL.
3. `ngrok` forwards the payload to the local Express server.
4. The server authenticates with GitHub using the App ID and Private Key, and fetches the precise code diff.
5. The diff is sent to the Gemini AI with a strict system prompt.
6. The AI's response is formatted and posted back to the Pull Request as an automated comment.

---
*Built for educational purposes and technical demonstrations.*
