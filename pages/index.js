import { useState, useRef, useEffect } from "react";
import Head from "next/head";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.message },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content:
              "I'm having trouble responding right now. Please try again in a moment.",
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <>
      <Head>
        <title>Ask Paul — Your Spiritual Mentor</title>
        <meta
          name="description"
          content="A wise, compassionate spiritual mentor grounded in biblical principles"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --cream: #faf8f5;
          --cream-dark: #f5f1eb;
          --sage: #7d8c75;
          --sage-light: #a8b5a0;
          --sage-dark: #5c6956;
          --warm-brown: #8b7355;
          --text-primary: #3d3d3d;
          --text-secondary: #6b6b6b;
          --text-light: #999;
          --white: #ffffff;
          --shadow-soft: 0 2px 20px rgba(0, 0, 0, 0.06);
          --shadow-medium: 0 4px 30px rgba(0, 0, 0, 0.08);
        }

        html,
        body {
          height: 100%;
          font-family: "Inter", -apple-system, sans-serif;
          background: var(--cream);
          color: var(--text-primary);
          line-height: 1.6;
        }

        #__next {
          height: 100%;
        }
      `}</style>

      <style jsx>{`
        .container {
          height: 100%;
          display: flex;
          flex-direction: column;
          max-width: 800px;
          margin: 0 auto;
          background: var(--cream);
        }

        .header {
          padding: 24px 24px 20px;
          text-align: center;
          border-bottom: 1px solid rgba(125, 140, 117, 0.1);
          background: linear-gradient(
            180deg,
            var(--white) 0%,
            var(--cream) 100%
          );
        }

        .logo {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 2rem;
          font-weight: 500;
          color: var(--sage-dark);
          letter-spacing: 0.02em;
          margin-bottom: 4px;
        }

        .tagline {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .welcome {
          text-align: center;
          padding: 60px 20px;
          animation: fadeIn 0.8s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .welcome-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(
            135deg,
            var(--sage-light) 0%,
            var(--sage) 100%
          );
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: var(--shadow-medium);
        }

        .welcome-icon svg {
          width: 32px;
          height: 32px;
          color: var(--white);
        }

        .welcome h2 {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 1.6rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .welcome p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          max-width: 400px;
          margin: 0 auto;
        }

        .message {
          display: flex;
          gap: 12px;
          animation: messageIn 0.3s ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .message.assistant .message-avatar {
          background: linear-gradient(
            135deg,
            var(--sage-light) 0%,
            var(--sage) 100%
          );
          color: var(--white);
        }

        .message.user .message-avatar {
          background: var(--warm-brown);
          color: var(--white);
        }

        .message-content {
          max-width: 75%;
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.65;
        }

        .message.assistant .message-content {
          background: var(--white);
          border-radius: 18px 18px 18px 4px;
          box-shadow: var(--shadow-soft);
          color: var(--text-primary);
        }

        .message.user .message-content {
          background: var(--sage);
          color: var(--white);
          border-radius: 18px 18px 4px 18px;
        }

        .message-content p {
          margin-bottom: 12px;
        }

        .message-content p:last-child {
          margin-bottom: 0;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--sage-light);
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .input-container {
          padding: 16px 24px 24px;
          background: linear-gradient(
            0deg,
            var(--cream) 80%,
            transparent 100%
          );
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          background: var(--white);
          border-radius: 24px;
          padding: 8px 8px 8px 20px;
          box-shadow: var(--shadow-medium);
          border: 1px solid rgba(125, 140, 117, 0.15);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: var(--sage-light);
          box-shadow: var(--shadow-medium), 0 0 0 3px rgba(125, 140, 117, 0.1);
        }

        .input-wrapper textarea {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.95rem;
          font-family: inherit;
          resize: none;
          background: transparent;
          color: var(--text-primary);
          padding: 8px 0;
          min-height: 24px;
          max-height: 150px;
        }

        .input-wrapper textarea::placeholder {
          color: var(--text-light);
        }

        .send-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: var(--sage);
          color: var(--white);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, transform 0.15s ease;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          background: var(--sage-dark);
          transform: scale(1.05);
        }

        .send-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .send-button:disabled {
          background: var(--sage-light);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .send-button svg {
          width: 20px;
          height: 20px;
        }

        .footer {
          text-align: center;
          padding: 12px 24px 20px;
          font-size: 0.75rem;
          color: var(--text-light);
        }

        @media (max-width: 600px) {
          .header {
            padding: 20px 16px 16px;
          }

          .logo {
            font-size: 1.6rem;
          }

          .messages-container {
            padding: 16px;
          }

          .message-content {
            max-width: 85%;
            padding: 12px 16px;
            font-size: 0.9rem;
          }

          .input-container {
            padding: 12px 16px 20px;
          }
        }
      `}</style>

      <div className="container">
        <header className="header">
          <h1 className="logo">Ask Paul</h1>
          <p className="tagline">Your spiritual mentor</p>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <h2>Welcome, friend</h2>
              <p>
                I'm here to walk alongside you with wisdom from Scripture and a
                listening heart. What's on your mind today?
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "assistant" ? "P" : "Y"}
                </div>
                <div className="message-content">
                  {msg.content.split("\n\n").map((paragraph, pIndex) => (
                    <p key={pIndex}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">P</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <form onSubmit={sendMessage} className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your heart..."
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || isLoading}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </form>
        </div>

        <footer className="footer">
          Paul is a spiritual guide, not a replacement for professional
          counseling or pastoral care.
        </footer>
      </div>
    </>
  );
}
