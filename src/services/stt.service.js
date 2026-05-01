const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * Transcribes audio buffer to text using Groq Whisper API.
 * Uses Node 18+ native fetch + Blob — no extra packages needed.
 *
 * @param {Buffer} audioBuffer - The raw audio buffer from multer
 * @param {string} mimeType - The MIME type of the audio (e.g., 'audio/webm')
 * @returns {Promise<string>} The transcribed text
 */
export const transcribeAudio = async (audioBuffer, mimeType = 'audio/webm') => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Cannot transcribe audio.');
  }

  if (!audioBuffer || audioBuffer.length < 100) {
    throw new Error('Audio buffer is empty or too small to transcribe.');
  }

  // Determine file extension from mime type
  const ext = mimeType.includes('wav') ? 'wav'
    : mimeType.includes('mp4') ? 'mp4'
    : mimeType.includes('mpeg') ? 'mp3'
    : mimeType.includes('ogg') ? 'ogg'
    : 'webm';

  // Use native FormData + Blob (Node 18+ compatible with built-in fetch)
  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  form.append('file', blob, `audio.${ext}`);
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'text');
  form.append('language', 'en');

  const response = await fetch(GROQ_WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // Do NOT set Content-Type manually — fetch sets it automatically with boundary
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Groq Whisper API Error: ${JSON.stringify(error)}`);
  }

  // response_format=text returns plain text directly
  const transcript = await response.text();
  return transcript.trim();
};
