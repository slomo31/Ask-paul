import { useState } from "react";
import { supabase } from "../lib/supabase";
import Head from "next/head";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });

        if (error) throw error;

        // Update the profile with name
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ name: name })
            .eq("id", data.user.id);
        }

        setMessage("Check your email to confirm your account, then log in.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isSignUp ? "Sign Up" : "Log In"} — Ask Paul</title>
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
          --error: #c53030;
          --success: #2f855a;
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
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .card {
          background: var(--white);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-medium);
        }

        .logo {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 2rem;
          font-weight: 500;
          color: var(--sage-dark);
          text-align: center;
          margin-bottom: 8px;
        }

        .tagline {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 32px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .input-group input {
          padding: 12px 16px;
          border: 1px solid rgba(125, 140, 117, 0.2);
          border-radius: 10px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--sage);
          box-shadow: 0 0 0 3px rgba(125, 140, 117, 0.1);
        }

        .submit-button {
          padding: 14px;
          background: var(--sage);
          color: var(--white);
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-top: 8px;
        }

        .submit-button:hover:not(:disabled) {
          background: var(--sage-dark);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toggle {
          text-align: center;
          margin-top: 20px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .toggle button {
          background: none;
          border: none;
          color: var(--sage-dark);
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
        }

        .error {
          background: #fef2f2;
          color: var(--error);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          text-align: center;
        }

        .message {
          background: #f0fdf4;
          color: var(--success);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>

      <div className="container">
        <div className="card">
          <h1 className="logo">Ask Paul</h1>
          <p className="tagline">Your spiritual mentor</p>

          {error && <div className="error">{error}</div>}
          {message && <div className="message">{message}</div>}

          <form className="form" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="input-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should Paul call you?"
                  required={isSignUp}
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Log In"}
            </button>
          </form>

          <div className="toggle">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setIsSignUp(false)}>Log in</button>
              </>
            ) : (
              <>
                New here?{" "}
                <button onClick={() => setIsSignUp(true)}>Create an account</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
