const PROCESS_URL = 'https://api.tabscanner.com/api/2/process'
const RESULT_URL = 'https://api.tabscanner.com/api/result'

interface TabScannerLineItem {
  desc?: string
  descClean?: string
  qty?: number
  price?: number
  lineTotal?: number
}

interface TabScannerResult {
  establishment?: string
  lineItems?: TabScannerLineItem[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mimeToExtension(mimeType: string) {
  return mimeType.includes('png') ? 'png' : 'jpg'
}

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.TABSCANNER_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'TabScanner API key not configured' }, { status: 500 })
    }

    const contentType = mimeType ?? 'image/jpeg'
    const extension = mimeToExtension(contentType)
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([imageBuffer], { type: contentType }),
      `receipt.${extension}`,
    )
    formData.append('documentType', 'receipt')

    const processRes = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: { apikey: apiKey },
      body: formData,
    })

    const processData = await processRes.json()
    if (!processData.success || !processData.token) {
      console.error('[parse-receipt] process failed', processData)
      return Response.json({ error: 'Failed to submit receipt for processing' }, { status: 502 })
    }

    const token = processData.token as string

    await sleep(5000)

    const maxAttempts = 30
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const resultRes = await fetch(`${RESULT_URL}/${token}`, {
        headers: { apikey: apiKey },
      })
      const resultData = await resultRes.json()

      if (resultData.status_code === 301 || resultData.status === 'pending') {
        await sleep(1000)
        continue
      }

      if (!resultData.success || resultData.status === 'failed') {
        console.error('[parse-receipt] result failed', resultData)
        return Response.json({ error: 'Failed to parse receipt' }, { status: 502 })
      }

      const result = resultData.result as TabScannerResult | undefined
      const items = (result?.lineItems ?? [])
        .filter((line) => (line.descClean ?? line.desc ?? '').trim())
        .map((line) => {
          const quantity = line.qty && line.qty > 0 ? line.qty : 1
          const price =
            line.price && line.price > 0
              ? line.price
              : line.lineTotal && line.lineTotal > 0
                ? line.lineTotal / quantity
                : 0

          return {
            name: (line.descClean ?? line.desc ?? '').trim(),
            price: Math.round(price * 100) / 100,
            quantity,
          }
        })
        .filter((item) => item.price > 0)

      return Response.json({
        storeName: result?.establishment ?? '',
        items,
      })
    }

    return Response.json({ error: 'Receipt processing timed out' }, { status: 504 })
  } catch (err) {
    console.error('[parse-receipt]', err)
    return Response.json({ error: 'Failed to parse receipt' }, { status: 500 })
  }
}



// import { generateText } from 'ai'
// import { createOpenAI } from '@ai-sdk/openai'

// export async function POST(req: Request) {
//   try {
//     const { imageBase64, mimeType } = await req.json()

//     if (!imageBase64) {
//       return Response.json({ error: 'No image provided' }, { status: 400 })
//     }

//     const gateway = createOpenAI({
//       baseURL: 'https://ai-gateway.vercel.sh/v1',
//       apiKey: process.env.AI_GATEWAY_API_KEY ?? 'no-key',
//     })

//     const { text } = await generateText({
//       model: gateway('openai/gpt-4o'),
//       messages: [
//         {
//           role: 'user',
//           content: [
//             {
//               type: 'text',
//               text: `You are a receipt parser. Extract all line items from this receipt image.
// Return ONLY valid JSON in this exact format, nothing else:
// {
//   "storeName": "store name or empty string",
//   "items": [
//     { "name": "item name", "price": 1.99, "quantity": 1 }
//   ]
// }
// - price should be the price per unit as a number (e.g. 1.99)
// - quantity is the number of units
// - If the quantity is unclear, default to 1
// - Round prices to 2 decimal places
// - Do not include subtotals, taxes, or totals as items`,
//             },
//             {
//               type: 'image',
//               image: `data:${mimeType ?? 'image/jpeg'};base64,${imageBase64}`,
//             },
//           ],
//         },
//       ],
//     })

//     const parsed = JSON.parse(text.trim())
//     return Response.json(parsed)
//   } catch (err) {
//     console.error('[parse-receipt]', err)
//     return Response.json({ error: 'Failed to parse receipt' }, { status: 500 })
//   }
// }
