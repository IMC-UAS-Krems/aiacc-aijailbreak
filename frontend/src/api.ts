export interface Message { role: 'user' | 'assistant'; content: string }
export interface Level { id: number; name: string; implemented: boolean; available: boolean }
export interface ChatRequest { level_id: number; messages: Message[] }

export async function api<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Cannot connect to the local game service. Please try again.');
  }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('The local service returned an invalid response. Please try again.'); }
  if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'The local service is unavailable. Please try again.');
  return result as T;
}
