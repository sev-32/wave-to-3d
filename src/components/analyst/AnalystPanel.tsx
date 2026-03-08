import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Camera,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  type ScreenshotRecord,
  fetchScreenshots,
  deleteScreenshot,
  updateScreenshotAnalysis,
} from '@/lib/screenshots';
import { streamAnalysis } from '@/lib/aiAnalyst';

interface AnalystPanelProps {
  onRequestCapture: () => void;
  latestCapture: ScreenshotRecord | null;
}

type ChatMsg = { role: 'user' | 'assistant'; content: string };

export function AnalystPanel({ onRequestCapture, latestCapture }: AnalystPanelProps) {
  const [open, setOpen] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotRecord[]>([]);
  const [selected, setSelected] = useState<ScreenshotRecord | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load screenshots
  const loadScreenshots = useCallback(async () => {
    const data = await fetchScreenshots();
    setScreenshots(data);
  }, []);

  useEffect(() => { loadScreenshots(); }, [loadScreenshots]);

  // When new capture arrives, refresh and select it
  useEffect(() => {
    if (latestCapture) {
      loadScreenshots();
      setSelected(latestCapture);
      setOpen(true);
    }
  }, [latestCapture, loadScreenshots]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleAnalyze = useCallback(async (screenshot: ScreenshotRecord, userPrompt?: string) => {
    if (!screenshot.public_url || streaming) return;
    setStreaming(true);

    const prompt = userPrompt || 'Analyze this water simulation screenshot. Identify any issues and provide specific recommendations to improve realism.';
    
    setChat(prev => [...prev, { role: 'user', content: userPrompt || '🔍 Analyze this screenshot' }]);

    let assistantText = '';
    const updateAssistant = (chunk: string) => {
      assistantText += chunk;
      setChat(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        }
        return [...prev, { role: 'assistant', content: assistantText }];
      });
    };

    await streamAnalysis({
      imageUrl: screenshot.public_url,
      prompt,
      mode,
      conversationHistory: chat.slice(-10),
      onDelta: updateAssistant,
      onDone: () => {
        setStreaming(false);
        updateScreenshotAnalysis(screenshot.id, assistantText, []);
      },
      onError: (err) => {
        setStreaming(false);
        setChat(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err}` }]);
      },
    });
  }, [streaming, mode, chat]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !selected) return;
    const msg = input.trim();
    setInput('');
    handleAnalyze(selected, msg);
  }, [input, selected, handleAnalyze]);

  const handleDelete = useCallback(async (s: ScreenshotRecord) => {
    await deleteScreenshot(s.id, s.storage_path);
    setScreenshots(prev => prev.filter(x => x.id !== s.id));
    if (selected?.id === s.id) setSelected(null);
  }, [selected]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-1/2 right-0 -translate-y-1/2 z-30 flex items-center gap-1 px-2 py-4 rounded-l-lg bg-card/90 backdrop-blur border border-r-0 border-border shadow-lg hover:bg-card transition-colors"
      >
        <Brain className="w-4 h-4 text-primary" />
        <ChevronLeft className="w-3 h-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="absolute top-0 right-0 bottom-0 z-30 w-[420px] flex flex-col bg-card/95 backdrop-blur-md border-l border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">AI Analyst</span>
          <Badge variant={mode === 'deep' ? 'default' : 'secondary'} className="text-xs cursor-pointer" onClick={() => setMode(m => m === 'quick' ? 'deep' : 'quick')}>
            {mode === 'deep' ? <><Sparkles className="w-3 h-3 mr-1" /> Deep</> : <><Zap className="w-3 h-3 mr-1" /> Quick</>}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onRequestCapture} title="Capture now">
            <Camera className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Screenshot Gallery */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Captures ({screenshots.length})</span>
          <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={loadScreenshots}>Refresh</Button>
        </div>
        <ScrollArea className="h-20">
          <div className="flex gap-2 pb-1">
            {screenshots.map(s => (
              <div
                key={s.id}
                className={`relative shrink-0 w-16 h-12 rounded cursor-pointer border-2 overflow-hidden transition-all ${
                  selected?.id === s.id ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => { setSelected(s); setChat([]); }}
              >
                {s.public_url && <img src={s.public_url} alt="" className="w-full h-full object-cover" />}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
                  className="absolute top-0 right-0 p-0.5 bg-destructive/80 text-destructive-foreground rounded-bl opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white px-0.5 truncate">
                  {s.trigger_type}
                </div>
              </div>
            ))}
            {screenshots.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No captures yet. Click the camera icon or drop the sphere.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Screenshot Preview */}
      {selected?.public_url && (
        <div className="px-3 py-2 border-b border-border">
          <img src={selected.public_url} alt="Selected capture" className="w-full h-32 object-cover rounded border border-border" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{selected.trigger_type} • {selected.phase}</span>
            <Button
              variant="default"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={() => handleAnalyze(selected)}
              disabled={streaming}
            >
              {streaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
              Analyze
            </Button>
          </div>
        </div>
      )}

      {/* Chat / Analysis */}
      <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
        <div className="space-y-3">
          {chat.length === 0 && !selected && (
            <div className="text-center py-8">
              <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a capture or take a new one to begin analysis</p>
            </div>
          )}
          {chat.length === 0 && selected && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Click "Analyze" or ask a question about this capture</p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'ml-8' : 'mr-2'}`}>
              <div className={`rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto w-fit'
                  : 'bg-muted text-foreground prose prose-sm max-w-none'
              }`}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              {mode === 'deep' ? 'Deep analysis with Gemini 3.1 Pro...' : 'Quick analysis with Gemini 3 Flash...'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <Separator />
      <div className="p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={selected ? "Ask about this capture..." : "Select a capture first"}
          className="min-h-[40px] max-h-[80px] text-sm resize-none"
          disabled={!selected || streaming}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!selected || !input.trim() || streaming}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
