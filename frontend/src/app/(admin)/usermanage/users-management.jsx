"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { UsersTable } from "./users-table"
import { UsersFilters } from "./user-filters"
import { UsersBulkActions } from "./users-bulk-actions"
import { UsersStats } from "./users-stats"
import { Modal } from "../../../components/ui/modal"
import { UserDetailsModal } from "./user-details-modal"

export function UsersManagement() {
  const [selectedUsers, setSelectedUsers] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateRange: "all",
    minSpent: "",
    maxSpent: "",
    dateFrom: "",
    dateTo: "",
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState("")
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const refreshUsers = useCallback(async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_URL}/admin/users`, { credentials: 'include' })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      console.error('Failed to fetch users', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshUsers() }, [refreshUsers])

  const filteredUsers = useMemo(() => {
    // apply the same filters as table for export
    return (users || []).filter((user) => {
      if (
        filters.search &&
        !user.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !user.email?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }
      if (filters.status !== "all" && user.status?.toLowerCase() !== filters.status) {
        return false
      }
      if (filters.minSpent && (user.totalBuyingAmount ?? 0) < Number.parseFloat(filters.minSpent)) {
        return false
      }
      if (filters.maxSpent && (user.totalBuyingAmount ?? 0) > Number.parseFloat(filters.maxSpent)) {
        return false
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom)
        const created = user.accountCreated ? new Date(user.accountCreated) : null
        if (!created || created < from) return false
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo)
        to.setHours(23,59,59,999)
        const created = user.accountCreated ? new Date(user.accountCreated) : null
        if (!created || created > to) return false
      }
      return true
    })
  }, [users, filters])

  const handleExport = useCallback(async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setExporting(true)
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

      // Get selected users data
      const selectedUsersData = users.filter(user => selectedUsers.includes(user.id))

      doc.setFontSize(14)
      doc.text('Selected Users Summary', 40, 40)
      const generatedAt = new Date().toLocaleString()
      doc.setFontSize(10)
      doc.text(`Generated at: ${generatedAt}`, 40, 58)
      doc.text(`${selectedUsersData.length} users selected`, 40, 72)

      const head = [[
        'Name', 'Email', 'Status', 'Orders', 'Total Amount', 'Account Created', 'Last Login'
      ]]
      const body = selectedUsersData.map(u => [
        u.name || '',
        u.email || '',
        u.status || '',
        String(u.orders ?? 0),
        `$${Number(u.totalBuyingAmount || 0).toFixed(2)}`,
        u.accountCreated ? new Date(u.accountCreated).toLocaleDateString() : '-',
        u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-',
      ])

      autoTable(doc, {
        head,
        body,
        startY: 88,
        styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
        headStyles: { fillColor: [147, 51, 234] }, // purple (Tailwind bg-purple-600)
        columnStyles: {
          0: { cellWidth: 150 }, // Name
          1: { cellWidth: 210 }, // Email
          2: { cellWidth: 70 },  // Status
          3: { cellWidth: 60, halign: 'right' }, // Orders
          4: { cellWidth: 90, halign: 'right' }, // Total Amount
          5: { cellWidth: 110 }, // Account Created
          6: { cellWidth: 140 }, // Last Login
        },
      })

      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setIsPreviewOpen(true)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExporting(false)
    }
  }, [selectedUsers, users])

  const handleViewUser = useCallback((user) => {
    setSelectedUser(user)
    setIsUserDetailsOpen(true)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage your system users and track their activities</p>
        </div>
      </div>

      <UsersStats users={users} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <UsersFilters filters={filters} onFiltersChange={setFilters} onExport={handleExport} selectedCount={selectedUsers.length} />

          {selectedUsers.length > 0 && (
            <UsersBulkActions selectedCount={selectedUsers.length} onClearSelection={() => setSelectedUsers([])} users={users} selectedIds={selectedUsers} onUpdated={refreshUsers} />
          )}

          <UsersTable users={users} loading={loading} selectedUsers={selectedUsers} onSelectionChange={setSelectedUsers} filters={filters} onUpdated={refreshUsers} onViewUser={handleViewUser} />
        </CardContent>
      </Card>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          if (pdfUrl) URL.revokeObjectURL(pdfUrl)
          setPdfUrl("")
          setIsPreviewOpen(false)
        }}
        title="Preview: Users Summary PDF"
        message="Review the PDF preview below. Click Download to save the file."
        type="confirm"
        confirmText="Download"
        iconColor="text-purple-600"   // <-- HERE
        onConfirm={() => {
          if (!pdfUrl) return
          const a = document.createElement('a')
          a.href = pdfUrl
          a.download = 'users-summary.pdf'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }}
      >
        <div className="h-[70vh] w-full">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="h-full w-full rounded" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">Generating preview…</div>
          )}
        </div>
      </Modal>

      <UserDetailsModal
        isOpen={isUserDetailsOpen}
        onClose={() => {
          setIsUserDetailsOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
      />
    </div>
  )
}
