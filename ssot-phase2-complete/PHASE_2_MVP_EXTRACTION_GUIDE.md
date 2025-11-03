# Phase 2: MVP Schema Extraction Guide

**Created:** 3 November 2025  
**Purpose:** Step-by-step instructions to extract and prepare MVP schema for diff analysis

---

## Quick Start: Copy MVP Schema

The fastest way to get started:

```bash
# Navigate to Suburbmates project
cd /Users/carlg/Documents/suburbmates

# Copy MVP schema from reference project
cp ../suburbmates2/drizzle/schema.ts ./docs/schema_mvp_reference.ts

# Verify the copy was successful
ls -lh ./docs/schema_mvp_reference.ts

# Add to git
git add ./docs/schema_mvp_reference.ts
git commit -m "docs: Add MVP schema reference for Phase 2 diff analysis"
```

---

## Option A: Direct File Copy (Recommended)

**Best for:** Full schema preservation with comments

### Step 1: Copy the MVP schema file

```bash
cp /Users/carlg/Documents/suburbmates2/drizzle/schema.ts \
   /Users/carlg/Documents/suburbmates/docs/schema_mvp_reference.ts
```

### Step 2: Verify file integrity

```bash
# Check file size and line count
wc -l /Users/carlg/Documents/suburbmates/docs/schema_mvp_reference.ts

# Verify MySQL table exports
grep -c "mysqlTable" /Users/carlg/Documents/suburbmates/docs/schema_mvp_reference.ts

# Count relations
grep -c "relations" /Users/carlg/Documents/suburbmates/docs/schema_mvp_reference.ts
```

### Step 3: Commit to git

```bash
cd /Users/carlg/Documents/suburbmates
git add docs/schema_mvp_reference.ts
git commit -m "docs: Reference MVP schema for Phase 2 analysis

Add MVP schema.ts from suburbmates2 for comprehensive diff analysis.
This serves as the source of truth for comparing:
- Current baseline (6 tables, 56 columns)
- MVP expected features (listings, reviews, payments, etc.)
- Type definitions and relations

Ready for schema_diff_phase2.json generation."
```

---

## Option B: Extract to Structured JSON

**Best for:** Easier programmatic comparison

### Step 1: Create extraction script

```bash
cat > /Users/carlg/Documents/suburbmates/scripts/extract_schema_json.js << 'EOF'
const fs = require('fs');
const path = require('path');

/**
 * Extract Drizzle ORM schema.ts into structured JSON
 * Input: schema.ts file path
 * Output: Structured JSON with tables, columns, relations
 */

function extractSchema(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract table definitions
  const tableRegex = /export const (\w+) = mysqlTable\(\s*"([^"]+)"/gs;
  const tables = [];
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const varName = match[1];
    const tableName = match[2];
    tables.push({
      variableName: varName,
      sqlName: tableName,
      description: `Table: ${tableName}`,
    });
  }

  // Extract relations
  const relationRegex = /export const (\w+)Relations = relations\((\w+),/gs;
  const relations = [];

  while ((match = relationRegex.exec(content)) !== null) {
    const relationName = match[1];
    const sourceTable = match[2];
    relations.push({
      relationName,
      sourceTable,
    });
  }

  return {
    metadata: {
      source: path.basename(filePath),
      extractedAt: new Date().toISOString(),
      projectName: 'Suburbmates',
    },
    summary: {
      totalTables: tables.length,
      totalRelations: relations.length,
    },
    tables,
    relations,
  };
}

// Main execution
if (require.main === module) {
  const inputFile = process.argv[2] || './drizzle/schema.ts';
  const outputFile = process.argv[3] || './docs/schema_extracted.json';

  try {
    console.log(`📖 Extracting schema from: ${inputFile}`);
    const result = extractSchema(inputFile);

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`✅ Extraction complete!`);
    console.log(`📊 Found: ${result.summary.totalTables} tables, ${result.summary.totalRelations} relations`);
    console.log(`💾 Output saved to: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Extraction failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { extractSchema };
EOF
```

### Step 2: Run extraction on MVP schema

```bash
cd /Users/carlg/Documents/suburbmates

# Extract MVP schema
node scripts/extract_schema_json.js \
  ../suburbmates2/drizzle/schema.ts \
  docs/schema_mvp_extracted.json

# Extract current schema for comparison
node scripts/extract_schema_json.js \
  drizzle/schema.ts \
  docs/schema_current_extracted.json
```

### Step 3: Compare extractions

```bash
# Show table count difference
echo "=== MVP Tables ===" && jq '.summary.totalTables' docs/schema_mvp_extracted.json
echo "=== Current Tables ===" && jq '.summary.totalTables' docs/schema_current_extracted.json

# Show MVP table names
echo "=== MVP Tables List ===" && jq '.tables[].sqlName' docs/schema_mvp_extracted.json | sort
echo "=== Current Tables List ===" && jq '.tables[].sqlName' docs/schema_current_extracted.json | sort
```

---

## Option C: Manual Documentation

**Best for:** Quick assessment without full automation

### Step 1: Read MVP schema manually

```bash
# Open in your editor
code /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# Or view in terminal
head -100 /Users/carlg/Documents/suburbmates2/drizzle/schema.ts
```

### Step 2: List all tables in MVP

```bash
# Extract all table definitions from MVP
grep "export const.*= mysqlTable" \
  /Users/carlg/Documents/suburbmates2/drizzle/schema.ts | \
  sed 's/.*export const //; s/ = mysqlTable.*//' | \
  sort
```

### Step 3: Create comparison document

```bash
cat > /Users/carlg/Documents/suburbmates/docs/schema_mvp_summary.md << 'EOF'
# MVP Schema Summary

## Tables Found in MVP schema.ts

Run in terminal to populate this:
$(grep "export const.*= mysqlTable" ../suburbmates2/drizzle/schema.ts)

## Tables Found in Current schema.ts

- users
- businesses
- agreements
- consents
- email_tokens
- melbourne_suburbs

## Missing Tables (in Current vs MVP)

[To be filled after comparison]
EOF
```

---

## Verification Steps

### 1. Verify MVP schema structure

```bash
# Check it's a valid TypeScript file
head -20 /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# Count table definitions
grep -c "mysqlTable" /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# List table names
grep "mysqlTable" /Users/carlg/Documents/suburbmates2/drizzle/schema.ts | \
  sed 's/.*"//; s/".*//' | sort
```

### 2. Check for expected marketplace tables

```bash
grep -E "(listing|review|order|payment|image|category|cart|vendor)" \
  /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# Count how many marketplace-related tables
grep -iE "(listing|review|order|payment|image|category|cart|vendor)" \
  /Users/carlg/Documents/suburbmates2/drizzle/schema.ts | wc -l
```

### 3. Verify relations

```bash
# Count relations in MVP
grep -c "Relations" /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# List all relations
grep "Relation" /Users/carlg/Documents/suburbmates2/drizzle/schema.ts | \
  sed 's/.*export const //; s/Relations.*//'
```

---

## Troubleshooting

### Problem: "No such file or directory: suburbmates2"

```bash
# Verify suburbmates2 exists
ls -ld /Users/carlg/Documents/suburbmates2

# If it doesn't exist, check nearby directories
ls -ld /Users/carlg/Documents/suburbmates*

# List contents if it exists
ls -la /Users/carlg/Documents/suburbmates2/
```

### Problem: "Permission denied" when copying

```bash
# Check file permissions
ls -l /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# Fix permissions if needed
chmod 644 /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# Try copy again
cp /Users/carlg/Documents/suburbmates2/drizzle/schema.ts \
   /Users/carlg/Documents/suburbmates/docs/schema_mvp_reference.ts
```

### Problem: MVP schema is too large to read

```bash
# View just the first N lines
head -200 /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# View just table definitions
grep "mysqlTable" /Users/carlg/Documents/suburbmates2/drizzle/schema.ts

# Count lines
wc -l /Users/carlg/Documents/suburbmates2/drizzle/schema.ts
```

---

## Next Steps After Extraction

### 1. Commit MVP schema reference

```bash
cd /Users/carlg/Documents/suburbmates
git add docs/schema_mvp_reference.ts
git commit -m "docs: Add MVP schema reference for Phase 2"
```

### 2. Trigger Phase 2 analysis

```bash
# Message to AI Agent:
# "MVP schema available at docs/schema_mvp_reference.ts
#  Ready to run Phase 2 schema diff analysis"
```

### 3. AI Agent will generate

- `docs/schema_diff_phase2.json` - Full comparison
- `docs/schema_analysis_phase2.md` - Detailed findings
- `docs/migration_plan_phase2.md` - Integration strategy
- `docs/reports/phase-2.md` - Executive report

---

## Expected File Structure After Phase 2 Prep

```
docs/
├── schema_current.json                 # ✅ Current baseline (existing)
├── schema_current_extracted.json       # Optional: extracted structure
├── schema_mvp_reference.ts             # ✅ MVP schema copy (you add this)
├── schema_mvp_extracted.json           # Optional: extracted structure
├── schema_diff_phase2.json             # 🔄 Generated in Phase 2
├── schema_analysis_phase2.md           # 🔄 Generated in Phase 2
├── migration_plan_phase2.md            # 🔄 Generated in Phase 2
└── reports/
    └── phase-2.md                      # 🔄 Generated in Phase 2
```

---

## Commands Summary

### One-Liner to Get MVP Schema Ready

```bash
cp /Users/carlg/Documents/suburbmates2/drizzle/schema.ts \
   /Users/carlg/Documents/suburbmates/docs/schema_mvp_reference.ts && \
cd /Users/carlg/Documents/suburbmates && \
git add docs/schema_mvp_reference.ts && \
git commit -m "docs: Add MVP schema for Phase 2 analysis" && \
echo "✅ MVP schema ready for Phase 2!"
```

### Verify Ready Status

```bash
cd /Users/carlg/Documents/suburbmates
echo "=== Current Schema ===" && wc -l drizzle/schema.ts
echo "=== MVP Schema ===" && wc -l docs/schema_mvp_reference.ts 2>/dev/null || echo "Not yet copied"
```

---

**Status:** ✅ Extraction Guide Complete  
**Next Step:** User executes MVP schema extraction  
**Expected Time:** 5-10 minutes to complete extraction
