#!/usr/bin/env node
/**
 * 经本地 llm-proxy 探活（需 npm run dev:llm-proxy）
 */
const PROXY = process.env.LLM_PROXY_URL || 'http://127.0.0.1:8787'

async function main() {
  const body = {
    model: 'MiniMax-M2.7',
    messages: [
      {
        role: 'user',
        content:
          '你是菜谱助手。只输出 JSON 数组，1 道菜，字段 title,ingredients[{name,amount}],steps[{content}],time,difficulty,emoji。食材必须包含：番茄,鸡蛋',
      },
    ],
    max_tokens: 1200,
    temperature: 0.3,
  }
  let res
  try {
    res = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    console.error('FAIL: 无法连接 llm-proxy，请先 npm run dev:llm-proxy')
    console.error(String(e.message || e))
    process.exit(1)
  }
  const text = await res.text()
  if (!res.ok) {
    console.error('FAIL: proxy HTTP', res.status, text.slice(0, 300))
    process.exit(1)
  }
  let json
  try {
    json = JSON.parse(text)
  } catch {
    console.error('FAIL: proxy 返回非 JSON')
    process.exit(1)
  }
  const content = json?.choices?.[0]?.message?.content
  if (!content) {
    console.error('FAIL: 无 choices[0].message.content')
    process.exit(1)
  }
  const hasTitle = /"title"\s*:/.test(content) || content.includes('番茄')
  console.log('OK: llm-proxy 菜谱生成探活通过', {
    status: res.status,
    contentLen: content.length,
    hasRecipeShape: hasTitle,
  })
}

main()
