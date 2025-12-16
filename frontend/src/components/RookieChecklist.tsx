import React, { useState } from 'react';
import { submitRookieChecklist } from '../services/onboarding';

const RookieChecklist: React.FC = () => {
  const masterItems = [
    'verify_email',
    'complete_training',
    'open_first_case',
  ];

  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(item: string) {
    setSelected((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await submitRookieChecklist({ user_email: email || undefined, items: selected });
      setStatus('success');
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside data-testid="rookie-checklist">
      <h3>Rookie Checklist</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Email (optional):{' '}
          <input
            data-testid="rookie-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <ul>
          {masterItems.map((it) => (
            <li key={it}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(it)}
                  onChange={() => toggle(it)}
                />{' '}
                {it}
              </label>
            </li>
          ))}
        </ul>

        <button data-testid="rookie-submit" type="submit" disabled={loading || selected.length === 0}>
          {loading ? 'Submitting…' : 'Submit Checklist'}
        </button>

        {status === 'success' && <div data-testid="rookie-success">Submitted successfully</div>}
        {status === 'error' && <div data-testid="rookie-error">Submission failed</div>}
      </form>
    </aside>
  );
};

export default RookieChecklist;
