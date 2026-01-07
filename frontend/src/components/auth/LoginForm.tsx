import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AccessibleButton } from "@/components/ui/AccessibleButton";
import { useApiError } from "@/hooks/useApiError";
import ErrorMessage from "@/components/ErrorMessage";

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState(""); // New state for MFA code
  const [mfaRequired, setMfaRequired] = useState(false); // New state for MFA challenge

  const { error, handleError, clearError } = useApiError();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      // Pass mfaCode if present
      await login({
        email,
        password,
        mfa_code: mfaRequired ? mfaCode : undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes("MFA code required")) {
        setMfaRequired(true);
        clearError();
      } else {
        handleError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      data-testid="login-form"
    >
      <ErrorMessage error={error || undefined} onDismiss={clearError} />

      {!mfaRequired ? (
        <>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                aria-required="true"
                placeholder="your@email.com"
                data-testid="username-input"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
                aria-required="true"
                placeholder="Enter your password"
                data-testid="password-input"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-right duration-300">
          <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-md flex items-start">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>
              Multi-Factor Authentication is enabled. Please enter the code from
              your authenticator app.
            </span>
          </div>

          <label
            htmlFor="mfaCode"
            className="block text-sm font-medium text-gray-700"
          >
            Authentication Code
          </label>
          <div className="mt-1">
            <input
              id="mfaCode"
              name="mfaCode"
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              maxLength={6}
              placeholder="123456"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))} // Only numbers
              aria-label="Six-digit authentication code"
              aria-required="true"
              aria-describedby="mfa-help"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm tracking-widest text-center text-lg dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMfaRequired(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      <div>
        <AccessibleButton
          type="submit"
          loading={loading}
          data-testid="login-button"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {mfaRequired ? "Verify & Sign in" : "Sign in"}
        </AccessibleButton>
      </div>
    </form>
  );
};
