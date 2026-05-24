import { z } from 'zod'

const itemSchema = z
  .object({
    name: z.string().min(1).max(80),
    amount: z.union([z.string(), z.number()]).optional(),
  })
  .transform((row) => ({
    name: row.name.trim(),
    amount:
      row.amount != null && String(row.amount).trim() !== ''
        ? String(row.amount).trim().slice(0, 40)
        : '适量',
  }))

export const pantryVisionSchema = z.object({
  kind: z.enum(['receipt', 'ingredients']),
  items: z.array(itemSchema).min(1).max(40),
})

export type PantryVisionResult = z.infer<typeof pantryVisionSchema>

export function parsePantryVisionJson(raw: unknown): PantryVisionResult | null {
  const parsed = pantryVisionSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}
