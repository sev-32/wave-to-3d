import { supabase } from '@/integrations/supabase/client';

export interface ScreenshotRecord {
  id: string;
  filename: string;
  storage_path: string;
  public_url: string | null;
  trigger_type: string;
  phase: string | null;
  metadata: Record<string, any>;
  ai_analysis: string | null;
  ai_recommendations: any[];
  created_at: string;
}

export async function captureAndSaveScreenshot(
  canvas: HTMLCanvasElement,
  triggerType: string,
  phase: string,
  metadata: Record<string, any> = {}
): Promise<ScreenshotRecord | null> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(null); return; }

      const timestamp = Date.now();
      const filename = `capture_${triggerType}_${phase}_${timestamp}.png`;
      const storagePath = `captures/${filename}`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('screenshots')
        .upload(storagePath, blob, { contentType: 'image/png', upsert: true });

      if (uploadErr) {
        console.error('Screenshot upload failed:', uploadErr);
        resolve(null);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl || null;

      // Save metadata
      const { data, error } = await supabase
        .from('screenshots')
        .insert({
          filename,
          storage_path: storagePath,
          public_url: publicUrl,
          trigger_type: triggerType,
          phase,
          metadata,
        })
        .select()
        .single();

      if (error) {
        console.error('Screenshot record insert failed:', error);
        resolve(null);
        return;
      }

      resolve(data as unknown as ScreenshotRecord);
    }, 'image/png');
  });
}

export async function fetchScreenshots(): Promise<ScreenshotRecord[]> {
  const { data, error } = await supabase
    .from('screenshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch screenshots:', error);
    return [];
  }
  return (data || []) as unknown as ScreenshotRecord[];
}

export async function deleteScreenshot(id: string, storagePath: string) {
  await supabase.storage.from('screenshots').remove([storagePath]);
  await supabase.from('screenshots').delete().eq('id', id);
}

export async function updateScreenshotAnalysis(id: string, analysis: string, recommendations: any[]) {
  await supabase
    .from('screenshots')
    .update({ ai_analysis: analysis, ai_recommendations: recommendations })
    .eq('id', id);
}
