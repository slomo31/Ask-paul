import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Head from "next/head";
import { useRouter } from "next/router";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const router = useRouter();

  // Check auth state
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
        await loadConversations(session.user.id);
      }
      setAuthLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
          await loadConversations(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setConversations([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const loadConversations = async (userId) => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    
    if (data) {
      setConversations(data);
    }
  };

  const loadConversation = async (convId) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({ role: m.role, content: m.content })));
      setConversationId(convId);
      setShowSidebar(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setShowSidebar(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const saveMessage = async (convId, role, content) => {
    if (!user) return;
    
    await supabase.from("messages").insert({
      conversation_id: convId,
      role,
      content,
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let currentConvId = conversationId;

    // Create conversation if logged in and no conversation exists
    if (user && !currentConvId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: input.trim().slice(0, 50) + (input.trim().length > 50 ? "..." : ""),
        })
        .select()
        .single();

      if (newConv) {
        currentConvId = newConv.id;
        setConversationId(newConv.id);
        setConversations(prev => [newConv, ...prev]);
      }
    }

    // Save user message
    if (user && currentConvId) {
      await saveMessage(currentConvId, "user", userMessage.content);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          userName: profile?.name || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = { role: "assistant", content: data.message };
        setMessages([...newMessages, assistantMessage]);
        
        // Save assistant message
        if (user && currentConvId) {
          await saveMessage(currentConvId, "assistant", data.message);
        }
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "I'm having trouble responding right now. Please try again in a moment.",
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm having trouble connecting. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      loadConversations(user?.id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessages([]);
    setConversationId(null);
    router.push("/login");
  };

  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    await supabase.from("conversations").delete().eq("id", convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (convId === conversationId) {
      startNewConversation();
    }
  };

  if (authLoading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#faf8f5",
        fontFamily: "Inter, sans-serif",
        color: "#6b6b6b"
      }}>
        Loading...
      </div>
    );
  }

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
        .layout {
          height: 100%;
          display: flex;
        }

        .sidebar {
          width: 280px;
          background: var(--white);
          border-right: 1px solid rgba(125, 140, 117, 0.1);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(125, 140, 117, 0.1);
        }

        .new-chat-btn {
          width: 100%;
          padding: 12px;
          background: var(--sage);
          color: var(--white);
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .new-chat-btn:hover {
          background: var(--sage-dark);
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .conversation-item {
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 4px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.15s ease;
        }

        .conversation-item:hover {
          background: var(--cream);
        }

        .conversation-item.active {
          background: var(--cream-dark);
          color: var(--text-primary);
        }

        .conversation-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-btn {
          opacity: 0;
          background: none;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 4px;
          margin-left: 8px;
          transition: opacity 0.15s ease, color 0.15s ease;
        }

        .conversation-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: #c53030;
        }

        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(125, 140, 117, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .user-name {
          color: var(--text-primary);
          font-weight: 500;
        }

        .logout-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 99;
        }

        .overlay.open {
          display: block;
        }

        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .header {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid rgba(125, 140, 117, 0.1);
          background: linear-gradient(180deg, var(--white) 0%, var(--cream) 100%);
        }

        .menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-content {
          flex: 1;
          text-align: center;
        }

        .logo {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--sage-dark);
          letter-spacing: 0.02em;
        }

        .tagline {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .auth-btn {
          background: var(--sage);
          color: var(--white);
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .auth-btn:hover {
          background: var(--sage-dark);
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
          background: linear-gradient(135deg, var(--sage-light) 0%, var(--sage) 100%);
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
          background: linear-gradient(135deg, var(--sage-light) 0%, var(--sage) 100%);
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
          0%, 60%, 100% {
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
          background: linear-gradient(0deg, var(--cream) 80%, transparent 100%);
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

        @media (min-width: 768px) {
          .sidebar {
            transform: translateX(0);
            position: relative;
          }

          .overlay {
            display: none !important;
          }

          .menu-btn {
            display: none;
          }

          .main {
            margin-left: 0;
          }
        }

        @media (max-width: 767px) {
          .header {
            padding: 16px;
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

      <div className="layout">
        {user && (
          <>
            <div className={`overlay ${showSidebar ? "open" : ""}`} onClick={() => setShowSidebar(false)} />
            <aside className={`sidebar ${showSidebar ? "open" : ""}`}>
              <div className="sidebar-header">
                <button className="new-chat-btn" onClick={startNewConversation}>
                  + New Conversation
                </button>
              </div>
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${conv.id === conversationId ? "active" : ""}`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <span className="conversation-title">{conv.title || "New conversation"}</span>
                    <button 
                      className="delete-btn" 
                      onClick={(e) => deleteConversation(conv.id, e)}
                      title="Delete conversation"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="sidebar-footer">
                <div className="user-info">
                  <span className="user-name">{profile?.name || user.email}</span>
                  <button className="logout-btn" onClick={handleLogout}>Log out</button>
                </div>
              </div>
            </aside>
          </>
        )}

        <div className="main">
          <header className="header">
            {user && (
              <button className="menu-btn" onClick={() => setShowSidebar(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            )}
            <div className="header-content">
              <h1 className="logo">Ask Paul</h1>
              <p className="tagline">Your spiritual mentor</p>
            </div>
            {!user && (
              <button className="auth-btn" onClick={() => router.push("/login")}>
                Log In
              </button>
            )}
          </header>

          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <h2>Welcome{profile?.name ? `, ${profile.name}` : ", friend"}</h2>
                <p>
                  I'm here to walk alongside you with wisdom from Scripture and a
                  listening heart. What's on your mind today?
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === "assistant" ? "P" : (profile?.name?.charAt(0).toUpperCase() || "Y")}
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </form>
          </div>

          <footer className="footer">
            Paul is a spiritual guide, not a replacement for professional counseling or pastoral care.
            {!user && " • Log in to save your conversations."}
          </footer>
        </div>
      </div>
    </>
  );
}
