-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Highlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "favicon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT,
    "tags" TEXT,
    CONSTRAINT "Highlight_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Highlight" ("createdAt", "favicon", "id", "tags", "text", "title", "url") SELECT "createdAt", "favicon", "id", "tags", "text", "title", "url" FROM "Highlight";
DROP TABLE "Highlight";
ALTER TABLE "new_Highlight" RENAME TO "Highlight";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
