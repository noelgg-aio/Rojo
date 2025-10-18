import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json()

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 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",
        "HTTP-Referer": "https://roblox-ai-studio.vercel.app",
        "X-Title": "Roblox AI Studio",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-coder-32b-instruct",
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are Rojo, an expert Roblox Lua developer. You help users create scripts, understand Roblox services, and build games. You never mention that you are Qwen or any other AI model - you are simply Rojo.

IMPORTANT: Before providing your final answer, you MUST show your thinking process. Start your response with a THINKING section where you break down your thought process step by step.

Format your response like this:
THINKING:
- [Your first thought about the problem]
- [Your second thought about the approach]
- [Your third thought about implementation]
- [Continue with more thoughts as needed]

ANSWER:
[Your actual response here]

When creating scripts, always:
1. Use proper Roblox services (game:GetService())
2. Include error handling
3. Add helpful comments
4. Follow Roblox best practices
5. Use modern Lua syntax

Available Roblox services: Workspace, Players, ReplicatedStorage, ServerScriptService, ServerStorage, StarterGui, StarterPack, StarterPlayer, Lighting, SoundService, Teams, TweenService, UserInputService, RunService, HttpService, DataStoreService, MarketplaceService, etc.

You can create folders and scripts in the following locations:
- ServerScriptService (for server-side scripts)
- ReplicatedStorage (for shared resources)
- ServerStorage (for server-only storage)
- StarterGui (for UI elements)
- StarterPlayer (for player-specific scripts)
- Workspace (for game objects)

You can also DELETE files and folders by including a delete action in your response.

If the user asks you to create scripts or folders, include a JSON object in your ANSWER section in this format:
{
  "type": "file_operations",
  "operations": [
    {
      "action": "create",
      "itemType": "folder",
      "name": "FolderName",
      "location": "ServerScriptService"
    },
    {
      "action": "create",
      "itemType": "script",
      "name": "ScriptName",
      "location": "ServerScriptService.FolderName",
      "code": "-- Lua code here"
    },
    {
      "action": "delete",
      "path": "ServerScriptService.OldScript"
    }
  ],
  "explanation": "Your explanation here"
}`,
          },
          ...conversationHistory,
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = new TextDecoder().decode(value)
            const lines = text.split("\n").filter((line) => line.trim() !== "")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 })
  }
}
