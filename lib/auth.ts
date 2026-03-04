/**
 * Auth utilities - Re-exports from user service for backward compatibility
 */

import { userService } from "./services/user-service"
import type { User } from "./schemas/user"

export type UserRole = "employee" | "facility_manager" | "admin" | "finance" | "sustainability"

// Keep AppUser type for backward compatibility
export type AppUser = User

export async function getCurrentUser(): Promise<AppUser> {
  return userService.getCurrentUser()
}

export async function getAllUsers(): Promise<AppUser[]> {
  return userService.getAllUsers()
}
