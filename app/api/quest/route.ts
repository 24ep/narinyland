
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { partner1, partner2 } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a single, short, heartwarming 'Daily Love Quest' for a couple named ${partner1} and ${partner2}. 
    The quest should be a small romantic task they can do together today. 
    Keep it under 15 words. Include 1 emoji. No extra text or titles.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ quest: text.trim() });
  } catch (error: any) {
    console.error('Quest generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
