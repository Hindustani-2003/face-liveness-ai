import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getUserByEmail, 
  createFaceUser, 
  addFaceImage, 
  getAllFaceImages,
  getFaceImagesByUserId,
  getUserById,
  updateUserOpenId,
  deleteUser,
} from "./db";
import { 
  hashPassword, 
  verifyPassword,
  validateEmail,
  validatePassword,
  validateName,
  validateDepartment,
  validateDateOfBirth,
} from "./auth";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import fs from "node:fs";
import { localStorageGetPath } from "./localStorage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // Face registration endpoint
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        dateOfBirth: z.string().refine(val => validateDateOfBirth(val), "Invalid date of birth"),
        department: z.string().min(1, "Department is required"),
        faceImageData: z.string().min(1, "Face image data is required"),
        faceEmbedding: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate inputs
        if (!validateName(input.name)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid name",
          });
        }

        if (!validateEmail(input.email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid email",
          });
        }

        if (!validatePassword(input.password)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password must be at least 6 characters",
          });
        }

        if (!validateDepartment(input.department)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid department",
          });
        }

        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Create user
        try {
          // Upload face image to storage
          const buffer = Buffer.from(input.faceImageData.split(',')[1] || input.faceImageData, 'base64');
          const storageResult = await storagePut(`faces/face_${Date.now()}.jpg`, buffer, 'image/jpeg');

          const openId = `face_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

          const result = await createFaceUser({
            openId,
            name: input.name,
            email: input.email,
            passwordHash,
            dateOfBirth: input.dateOfBirth,
            department: input.department,
            faceImageUrl: storageResult.url,
          });

          // Get the created user ID and store face image record with embedding
          const newUser = await getUserByEmail(input.email);
          if (newUser && input.faceEmbedding) {
            await addFaceImage(newUser.id, storageResult.url, input.faceEmbedding);
          }

          return {
            success: true,
            message: "Registration successful",
          };
        } catch (error) {
          console.error("Registration error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to register user",
          });
        }
      }),

    // Get all users for face matching
    getAllUsers: publicProcedure.query(async () => {
      try {
        const users = await getAllFaceImages();
        return users.map(img => ({
          imageUrl: img.imageUrl,
          userId: img.userId,
          embedding: img.embedding ? JSON.parse(img.embedding) : null,
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }
    }),

    // Get specific user by email for one-to-one login validation
    getUserByEmailForLogin: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
      }))
      .mutation(async ({ input }) => {
        try {
          const user = await getUserByEmail(input.email);
          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Email ID not registered.",
            });
          }

          const faceImages = await getFaceImagesByUserId(user.id);
          if (faceImages.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "No registered face image found for this user.",
            });
          }

          return {
            id: user.id,
            name: user.name,
            embedding: faceImages[0].embedding ? JSON.parse(faceImages[0].embedding) : null,
            imageUrl: faceImages[0].imageUrl,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error looking up user by email:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to query database",
          });
        }
      }),


    // Get user profile by ID
    getProfile: publicProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input }) => {
        try {
          const user = await getUserById(input.userId);
          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            dateOfBirth: user.dateOfBirth,
            department: user.department,
            faceImageUrl: user.faceImageUrl,
            createdAt: user.createdAt,
          };
        } catch (error) {
          console.error("Error fetching profile:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch profile",
          });
        }
      }),

    // Verify face match (login)
    verifyFaceMatch: publicProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await getUserById(input.userId);
          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            });
          }

          const openId = user.openId ?? `face_user_${user.id}`;
          if (!user.openId) {
            await updateUserOpenId(user.id, openId);
          }

          const sessionToken = await sdk.createSessionToken(openId, {
            name: user.name ?? "User",
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS,
          });

          return {
            success: true,
            userId: user.id,
            name: user.name,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error verifying face match:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to verify face match",
          });
        }
      }),

    deleteAccount: publicProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await getUserById(input.userId);
          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            });
          }

          const faceImagesList = await getFaceImagesByUserId(input.userId);

          if (user.faceImageUrl && user.faceImageUrl.startsWith("/uploads/")) {
            const relPath = user.faceImageUrl.replace("/uploads/", "");
            const filePath = localStorageGetPath(relPath);
            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }

          for (const img of faceImagesList) {
            if (img.imageUrl && img.imageUrl.startsWith("/uploads/")) {
              const relPath = img.imageUrl.replace("/uploads/", "");
              const filePath = localStorageGetPath(relPath);
              if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }

          await deleteUser(input.userId);

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

          return {
            success: true,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error deleting account:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete account",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
