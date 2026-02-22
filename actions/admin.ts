"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isUserAdmin } from "@/actions/adminAccess";
import { connectToDatabase } from "@/lib/db";
import Scholarship from "@/models/Scholarship";
import OpenAI from "openai";

// ── PDF text extraction (pure Node, no Python needed) ─────────────────────
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    // Dynamically import pdf-parse to avoid SSR issues
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const text = data.text?.trim() ?? "";
    if (text.length < 20) {
        throw new Error("PDF has insufficient readable text. Make sure it's not a scanned image-only PDF.");
    }
    return text;
}

// ── LLM extraction ────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are an exhaustive scholarship data extraction engine.

MISSION: Extract EVERY SINGLE scholarship from this document — tables, lists, paragraphs.
If a table has 30 rows, produce 30 JSON objects. Never truncate. Never summarize.

CRITICAL RULES:
1. Output ONLY a raw JSON array — no markdown, no explanation, no preamble
2. One JSON object per scholarship/scheme entry
3. Never guess — use null for any field not explicitly stated
4. amounts: numeric only (strip ₹, commas, "per annum")
5. Convert % CGPA to 10-point scale (75% → 7.5)
6. deadline: YYYY-MM-DD format only, or null
7. applyLink: must start with http, or null
8. description: 2-3 sentences max

REQUIRED OUTPUT FORMAT (array of objects):
[
  {
    "title": "Exact scheme name",
    "provider": "Ministry or institution name",
    "amount": 50000,
    "amountType": "CASH",
    "deadline": "2025-10-31",
    "minCGPA": 6.0,
    "maxIncome": 250000,
    "courseRestriction": "BE/BTech",
    "categoryRestriction": "SC/ST",
    "yearRestriction": "1st year",
    "applyLink": "https://scholarships.gov.in",
    "description": "Brief 2-3 sentence summary."
  }
]

START your response with [ and END with ]. No other text.

DOCUMENT TEXT:
`;

async function callLLM(text: string): Promise<any[]> {
    const apiKey = process.env.MEGALLM_API_KEY;
    const model = process.env.MEGALLM_MODEL || "deepseek-ai/deepseek-v3.1";

    if (!apiKey) {
        throw new Error("MEGALLM_API_KEY is not set in .env.local");
    }

    const client = new OpenAI({
        baseURL: "https://ai.megallm.io/v1",
        apiKey,
    });

    const response = await client.chat.completions.create({
        model,
        messages: [
            {
                role: "user",
                content:
                    EXTRACTION_PROMPT +
                    text +
                    "\n\nCRITICAL: Respond with RAW JSON only — start directly with [ and end with ].",
            },
        ],
        temperature: 0.1,
        max_tokens: 8192,
    });

    const raw = response.choices[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    // Find the JSON array
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`LLM did not return a JSON array. Got: ${cleaned.slice(0, 200)}`);

    return JSON.parse(match[0]);
}

// ── Normalize for deduplication ───────────────────────────────────────────
function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[_\-–—/\\|,.()[\]{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ── Insert scholarships, skip duplicates ──────────────────────────────────
async function insertScholarships(
    entries: any[],
    sourcePdf: string
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of entries) {
        if (!entry || typeof entry !== "object") {
            skipped++;
            continue;
        }

        const title = (entry.title ?? "").trim();
        const provider = (entry.provider ?? "").trim();

        if (!title || !provider) {
            skipped++;
            errors.push(`Skipped entry with missing title or provider`);
            continue;
        }

        const normTitle = normalize(title);
        const normProvider = normalize(provider);

        try {
            // Check for duplicates using BOTH normalized fields (new docs)
            // AND case-insensitive raw title match (old docs without norm fields).
            // This prevents re-inserting scholarships that were added by the old Python pipeline.
            const existing = await Scholarship.findOne({
                $or: [
                    // New-style dedup (normTitle/normProvider present)
                    { normTitle, normProvider },
                    // Old-style dedup (raw title/provider, case-insensitive)
                    {
                        title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
                        provider: { $regex: `^${provider.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
                    },
                ],
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Clean numeric fields
            const amount =
                entry.amount != null && !isNaN(Number(entry.amount))
                    ? Number(entry.amount)
                    : undefined;
            const minCGPA =
                entry.minCGPA != null && !isNaN(Number(entry.minCGPA))
                    ? Number(entry.minCGPA)
                    : undefined;
            const maxIncome =
                entry.maxIncome != null && !isNaN(Number(entry.maxIncome))
                    ? Number(entry.maxIncome)
                    : undefined;

            // Parse deadline
            let deadline: Date | undefined;
            if (
                entry.deadline &&
                typeof entry.deadline === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(entry.deadline)
            ) {
                deadline = new Date(entry.deadline);
            }

            await Scholarship.create({
                title,
                provider,
                normTitle,
                normProvider,
                amount,
                amountType:
                    entry.amountType === "CASH" || entry.amountType === "WAIVER"
                        ? entry.amountType
                        : undefined,
                deadline,
                minCGPA,
                maxIncome,
                courseRestriction: entry.courseRestriction ?? undefined,
                categoryRestriction: entry.categoryRestriction ?? undefined,
                yearRestriction: entry.yearRestriction ?? undefined,
                applyLink:
                    typeof entry.applyLink === "string" &&
                        entry.applyLink.startsWith("http")
                        ? entry.applyLink
                        : undefined,
                description: entry.description ?? undefined,
                location: "Pan-India",
                tags: [],
                sourcePdf,
            });

            inserted++;
            console.log(`✅ Inserted: "${title}"`);
        } catch (err: any) {
            skipped++;
            errors.push(`Insert error for "${title}": ${err.message}`);
            console.error(`Insert error for "${title}":`, err.message);
        }
    }

    return { inserted, skipped, errors };
}

// ── Main server action ────────────────────────────────────────────────────
export async function uploadAndProcessPdf(formData: FormData) {
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;

    const hasAccess = await isUserAdmin(userEmail);
    if (!hasAccess) {
        return { success: false, error: "Unauthorized access." };
    }

    const file = formData.get("pdf") as File | null;
    if (!file) return { success: false, error: "No file uploaded." };

    try {
        // 1. Convert to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 2. Extract text from PDF (Node.js, no Python)
        let text: string;
        try {
            text = await extractTextFromPdf(buffer);
        } catch (err: any) {
            return { success: false, error: `PDF read failed: ${err.message}` };
        }

        // 3. Call LLM to extract scholarships
        let entries: any[];
        try {
            entries = await callLLM(text);
        } catch (err: any) {
            return { success: false, error: `AI extraction failed: ${err.message}` };
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            return { success: false, error: "AI returned no scholarship data from this PDF." };
        }

        // 4. Insert into MongoDB via Mongoose
        await connectToDatabase();

        // Backfill normTitle/normProvider on old docs so dedup catches them.
        // This is idempotent and fast (skips docs that already have the fields).
        const docsWithoutNorm = await Scholarship.find({
            normTitle: { $exists: false },
        }).select("title provider").lean();

        if (docsWithoutNorm.length > 0) {
            const bulkOps = docsWithoutNorm.map((doc: any) => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: {
                        $set: {
                            normTitle: normalize((doc.title ?? "").toString()),
                            normProvider: normalize((doc.provider ?? "").toString()),
                        },
                    },
                },
            }));
            await Scholarship.bulkWrite(bulkOps);
            console.log(`Backfilled normTitle/normProvider on ${docsWithoutNorm.length} old docs`);
        }
        const { inserted, skipped, errors } = await insertScholarships(
            entries,
            file.name
        );

        console.log(
            `PDF pipeline done: inserted=${inserted}, skipped=${skipped}, errors=${errors.length}`
        );

        // 5. Revalidate so home page shows new scholarships immediately
        revalidatePath("/home");
        revalidatePath("/");

        return {
            success: true,
            inserted,
            skipped,
        };
    } catch (err: any) {
        console.error("uploadAndProcessPdf error:", err);
        return { success: false, error: err.message ?? "Unknown server error." };
    }
}