"use client"

import React, { useState } from "react"
import { UserPlus } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog"
import CreateUserForm from "./CreateUserForm"

/**
 * CreateUserButton Component
 * Renders a button that opens the Create User modal
 * This component is designed to be injected into the Role Manager without modifying existing code
 * 
 * Props:
 * - onUserCreated: Function called after successful user creation for list refresh
 * - className: Optional CSS classes for button styling
 */
export default function CreateUserButton({ onUserCreated, className = "" }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = (newUser) => {
    setIsModalOpen(false)
    // Call the parent callback to refresh the users list
    if (onUserCreated) {
      onUserCreated(newUser)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
        variant="default"
      >
        <UserPlus className="h-4 w-4" />
        Create User
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <CreateUserForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}