import { cookies } from "next/headers"
import { userRepository } from "../repositories/user-repository"
import type { User } from "../schemas/user"

const DEFAULT_USER_ID = "00a00000-0000-0000-0000-000000000001"

export const userService = {
  /**
   * Get the current user from cookies
   */
  async getCurrentUser(): Promise<User> {
    const cookieStore = await cookies()
    const userId = cookieStore.get("app_user_id")?.value || DEFAULT_USER_ID

    const user = await userRepository.findById(userId)
    if (!user) {
      // Fallback to default user
      const fallback = await userRepository.findById(DEFAULT_USER_ID)
      if (!fallback) {
        throw new Error("Default user not found")
      }
      return fallback
    }

    return user
  },

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return userRepository.findAll()
  },

  /**
   * Get user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return userRepository.findById(userId)
  },

  /**
   * Switch user (for demo purposes)
   */
  async switchUser(userId: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set("app_user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  },

  /**
   * Switch locale
   */
  async switchLocale(locale: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set("app_locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  },
}
