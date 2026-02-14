🎓 scholarLogic
Next-Generation Scholarship Matching Platform

ScholarLogic is a full-stack platform designed to bridge the gap between complex scholarship PDFs and students. Built with a focus on automation and user-centric design.

🛠️ Project Stack
Framework: Next.js 15+ (App Router)

Authentication: Clerk

Database: MongoDB Atlas via Mongoose

UI Components: ShadCN + Tailwind CSS

🏗️ Architecture & Folder Structure
To ensure code quality and consistency, all contributors must follow this structure:

/models: Mongoose schemas (The "Data Contract").

/actions: Server Actions for database mutations (No manual API routes).

/lib: Shared utility logic and DB connection.

/components: Reusable UI elements.

/app: Routing and page logic.

📋 Teammate Instructions
Member 2: Frontend & Student Features

Focus: User profiles and the matching engine.

Student Profile: Create a page where users can save their CGPA and Income.

Matching Logic: Filter the scholarships on the homepage by comparing user data (from Clerk/DB) with scholarship requirements.

UI/UX: Enhance the dashboard with loading skeletons and success notifications.

Member 3: AI Bridge & Python Automation

Focus: PDF data extraction and database injection.

Extraction Script: Write a Python script to parse scholarship PDFs into JSON.

Database Push: Use PyMongo to push data directly to the scholarships collection in the scholarLogic database.

Schema Alignment: Ensure extracted data matches our schema: title, provider, amount, deadline, and applyLink.

🔐 Environment Setup
Create a .env.local file with the following keys. Never commit this file to GitHub.

Plaintext
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
🚀 Getting Started
npm install

npm run dev

Access the admin portal at /admin to test manual data entry.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
