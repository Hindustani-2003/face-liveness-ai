import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, faceImages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _tablesEnsured = false;

async function ensureTables(db: ReturnType<typeof drizzle>) {
  if (_tablesEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) UNIQUE,
        name VARCHAR(255),
        email VARCHAR(320) UNIQUE,
        passwordHash VARCHAR(255),
        dateOfBirth VARCHAR(10),
        department VARCHAR(255),
        faceImageUrl TEXT,
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        lastSignedIn TIMESTAMP
      );
    `);

    const alterQueries = [
      `ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN dateOfBirth VARCHAR(10)`,
      `ALTER TABLE users ADD COLUMN department VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN faceImageUrl TEXT`
    ];

    for (const q of alterQueries) {
      try {
        await db.execute(sql.raw(q));
      } catch (e) {
        // Ignore column duplicate errors
      }
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS faceImages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        imageUrl TEXT NOT NULL,
        embedding TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    _tablesEnsured = true;
  } catch (error) {
    console.warn("[Database] Table auto-creation check warning:", error);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  if (_db && !_tablesEnsured) {
    await ensureTables(_db);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createFaceUser(userData: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
  department: string;
  faceImageUrl: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values({
    openId: userData.openId,
    name: userData.name,
    email: userData.email,
    passwordHash: userData.passwordHash,
    dateOfBirth: userData.dateOfBirth,
    department: userData.department,
    faceImageUrl: userData.faceImageUrl,
    loginMethod: "face",
    role: "user",
  });

  return result;
}

export async function updateUserOpenId(userId: number, openId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ openId }).where(eq(users.id, userId));
}

export async function addFaceImage(userId: number, imageUrl: string, embedding?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.insert(faceImages).values({
    userId,
    imageUrl,
    embedding,
  });
}

export async function getFaceImagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get face images: database not available");
    return [];
  }

  return await db.select().from(faceImages).where(eq(faceImages.userId, userId));
}

export async function getAllFaceImages() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get face images: database not available");
    return [];
  }

  return await db.select().from(faceImages);
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Deleting the user row will cascade delete the faceImages rows due to foreign key constraint
  await db.delete(users).where(eq(users.id, id));
}
