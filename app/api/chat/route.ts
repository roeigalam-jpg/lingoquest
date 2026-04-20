import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, system, track, nickname } = body;

    const level = track === 'explorers' ? 'beginner (ages 5-7), use very simple words' 
                : track === 'voyagers' ? 'intermediate (ages 8-11), use simple sentences' 
                : 'advanced (ages 12-14), use fuller sentences';

    const systemPrompt = `${system}

IMPORTANT RULES:
- Student name: ${nickname}
- English level: ${level}
- ALWAYS respond in this format:
  Line 1: Your English response (short, under 15 words)
  Line 2: Hebrew translation in parentheses
- If the student makes a spelling or grammar mistake, FIRST correct it kindly:
  "Almost! It's '[correct]' not '[wrong]' ✏️"
  Then continue the conversation.
- Be very encouraging! Use emojis!
- Ask follow-up questions to keep conversation going
- Keep it fun and appropriate for children
- If student writes in Hebrew, encourage them to try in English and give them the English words`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 250,
        system: systemPrompt,
        messages: messages.slice(-8), // Keep last 8 messages for context
      }),
    });

    const data = await response.json();
    
    if (data.content?.[0]?.text) {
      return NextResponse.json({ reply: data.content[0].text });
    }
    
    return NextResponse.json({ reply: null, error: 'No response' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ reply: null, error: error.message }, { status: 500 });
  }
}