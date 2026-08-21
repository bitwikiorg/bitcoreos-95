'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function CornerChat() {
  const router = useRouter();
  const [question, setQuestion] = useState('');

  function openAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (value) sessionStorage.setItem('bitcoreos-chat-seed', value);
    router.push('/ask');
  }

  return (
    <form className="corner-chat raised" onSubmit={openAsk} aria-label="Ask BIThub">
      <div className="corner-chat-head">
        <span className="corner-chat-mark" aria-hidden="true">◎</span>
        <b>Ask BIThub</b>
        <small>Hub + Wiki</small>
      </div>
      <div className="corner-chat-row sunken">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything…"
          aria-label="Question for BIThub"
        />
        <button type="submit" aria-label="Open chat">↗</button>
      </div>
    </form>
  );
}
