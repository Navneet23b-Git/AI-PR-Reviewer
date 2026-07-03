import './index.css'

function App() {
  // Replace this with your actual GitHub App Name later!
  const GITHUB_APP_NAME = "NavLLM-code-reviewer"; 
  const installUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new`;

  return (
    <>
      <nav>
        <div className="logo">
          🤖 <span>AI Reviewer</span>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>Powered by Gemini 2.5 Flash</div>
      </nav>

      <div className="hero">
        <h1>Ship Code Faster with <br/> AI Code Reviews</h1>
        <p>Instantly catch bugs, fix security vulnerabilities, and improve code quality on every Pull Request. Connect your repository in 1 click.</p>
        
        <div className="btn-group">
          <a href={installUrl} target="_blank" rel="noreferrer" className="btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/>
            </svg>
            Install on GitHub
          </a>
          <a href="#features" className="btn btn-secondary">Learn More</a>
        </div>
      </div>

      <main id="features" className="features">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">Instant Feedback</h3>
          <p className="feature-text">No more waiting for human reviewers. The AI analyzes your diffs the second you open a Pull Request.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3 className="feature-title">Catch Security Flaws</h3>
          <p className="feature-text">Identify leaked API keys, SQL injections, and logic bugs before they ever reach production.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <h3 className="feature-title">Zero Configuration</h3>
          <p className="feature-text">No keys to paste, no YAML files to edit. Just click Install and the webhook magic handles the rest.</p>
        </div>
      </main>
    </>
  )
}

export default App
