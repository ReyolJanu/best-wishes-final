"use client"

import React from "react"
import CreateUserButton from "./CreateUserButton"

/**
 * RoleManagerHeader Component
 * A minimal wrapper that adds the Create User button to the role management header
 * Designed to be mounted with minimal changes to existing code
 * 
 * Props:
 * - onUserCreated: Function to refresh the users list after creation
 * - children: Original header content
 */
export default function RoleManagerHeader({ onUserCreated, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex-1">
        {children}
      </div>
      <div className="flex-shrink-0">
        <CreateUserButton 
          onUserCreated={onUserCreated}
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  )
}