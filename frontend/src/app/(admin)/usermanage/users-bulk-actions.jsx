"use client"
import PropTypes from "prop-types";
import { useCallback, useState } from "react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { UserCheck, UserX, Trash2, Mail } from "lucide-react"

UsersBulkActions.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onClearSelection: PropTypes.func.isRequired,
  users: PropTypes.array,
  selectedIds: PropTypes.array,
  onUpdated: PropTypes.func,
};

export function UsersBulkActions({ selectedCount, onClearSelection, users = [], selectedIds = [], onUpdated }) {
  const [submitting, setSubmitting] = useState(false)

  const handle = useCallback(async (action) => {
    if (selectedIds.length === 0) return
    try {
      setSubmitting(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const endpoint = action === 'activate' ? '/admin/users/activate' : action === 'deactivate' ? '/admin/users/deactivate' : '/admin/users'
      const method = action === 'delete' ? 'DELETE' : 'POST'
      const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds })
      })
      if (!res.ok) throw new Error('Request failed')
      onClearSelection()
      onUpdated && onUpdated()
    } catch (e) {
      console.error('Bulk action failed', e)
    } finally {
      setSubmitting(false)
    }
  }, [selectedIds, onUpdated, onClearSelection])

  return (
    <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{selectedCount} selected</Badge>
        <Button variant="link" onClick={onClearSelection} className="h-auto p-0">
          Clear selection
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" disabled={submitting} onClick={() => handle('activate')}>
          <UserCheck className="h-4 w-4" />
          Activate
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled={submitting} onClick={() => handle('deactivate')}>
          <UserX className="h-4 w-4" />
          Deactivate
        </Button>
        <Button variant="destructive" size="sm" className="gap-2" disabled={submitting} onClick={() => handle('delete')}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}
