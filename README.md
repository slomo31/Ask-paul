# Ask Paul — Your Spiritual Mentor

A calm, wise, compassionate AI spiritual mentor grounded in biblical principles. Built with Next.js and powered by Claude.

## Quick Start (Local Development)

### 1. Install Node.js
Download and install from [nodejs.org](https://nodejs.org/) (get the LTS version).

### 2. Open Terminal
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter

### 3. Navigate to the project folder
```bash
cd path/to/ask-paul
```

### 4. Install dependencies
```bash
npm install
```

### 5. Set up your API key
The `.env.local` file should already contain your Anthropic API key. If you need to update it:
- Open `.env.local` in a text editor
- Replace the key value with your key from [console.anthropic.com](https://console.anthropic.com)

### 6. Run the app
```bash
npm run dev
```

### 7. Open in browser
Go to [http://localhost:3000](http://localhost:3000)

---

## Deploy to the Internet (Vercel)

### 1. Create accounts
- Sign up at [github.com](https://github.com) (free)
- Sign up at [vercel.com](https://vercel.com) using your GitHub account (free)

### 2. Upload code to GitHub
- Create a new repository on GitHub called "ask-paul"
- Follow GitHub's instructions to push your code

### 3. Deploy on Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import your "ask-paul" repository
- **Important**: Add your environment variable:
  - Click "Environment Variables"
  - Name: `ANTHROPIC_API_KEY`
  - Value: Your API key (the `sk-ant-api03-...` string)
- Click "Deploy"

Your app will be live at `your-project-name.vercel.app`!

---

## Project Structure

```
ask-paul/
├── pages/
│   ├── index.js          # Main chat interface
│   └── api/
│       └── chat.js       # API route (talks to Claude)
├── lib/
│   └── prompt.js         # Paul's personality/instructions
├── .env.local            # Your API key (keep secret!)
├── .env.example          # Example env file (safe to share)
└── package.json          # Project dependencies
```

## Customizing Paul

Edit `lib/prompt.js` to adjust Paul's personality, tone, or guidelines.

---

## Security Notes

- Never share your `.env.local` file or commit it to GitHub
- The `.gitignore` file prevents this automatically
- Your API key runs on the server, never exposed to users
