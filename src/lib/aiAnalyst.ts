const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-screenshot`;

type Msg = { role: 'user' | 'assistant'; content: string };

interface StreamAnalysisOptions {
  imageUrl?: string;
  imageBase64?: string;
  prompt?: string;
  referenceContext?: string;
  conversationHistory?: Msg[];
  mode?: 'quick' | 'deep';
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export async function streamAnalysis(opts: StreamAnalysisOptions) {
  const { onDelta, onDone, onError, ...body } = opts;

  try {
    const resp = await fetch(ANALYZE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      onError(errBody.error || `HTTP ${resp.status}`);
      return;
    }

    if (!resp.body) { onError('No response body'); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buf.indexOf('\n')) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buf = line + '\n' + buf;
          break;
        }
      }
    }

    // Flush
    if (buf.trim()) {
      for (let raw of buf.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const json = raw.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : 'Unknown error');
  }
}
