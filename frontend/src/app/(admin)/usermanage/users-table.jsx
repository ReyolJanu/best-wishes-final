"use client"
import PropTypes from 'prop-types';
import { useMemo, useState } from "react"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Checkbox } from "../../../components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import {
  MoreHorizontal,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export function UsersTable({ users, loading, selectedUsers, onSelectionChange, filters, onUpdated }) {
  const [sortDirection, setSortDirection] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [sortField, setSortField] = useState("") 
  

  const handleSort = (field) =>{
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(users.map((user) => user.id))
    }
  }

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter((id) => id !== userId))
    } else {
      onSelectionChange([...selectedUsers, userId])
    }
  }

  const filteredUsers = useMemo(() => {
    const list = (users || []).filter((user) => {
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
        // include the whole end day
        to.setHours(23,59,59,999)
        const created = user.accountCreated ? new Date(user.accountCreated) : null
        if (!created || created > to) return false
      }
      return true
    })

    if (sortField) {
      list.sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return list
  }, [users, filters, sortField, sortDirection])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox checked={selectedUsers.length === users.length} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Logins</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("accountCreated")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Account Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("totalBuyingAmount")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Total Buying Amount
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : paginatedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-8 w-8 rounded-full" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                </TableCell>
                <TableCell className="text-center">{user.logins ?? '-'}</TableCell>
                <TableCell className="text-center">{user.orders ?? 0}</TableCell>
                <TableCell className="text-gray-600">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</TableCell>
                <TableCell className="text-gray-600">{user.accountCreated ? new Date(user.accountCreated).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="font-semibold text-green-600">${Number(user.totalBuyingAmount || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {/* <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem> */}
                      <DropdownMenuSeparator />
                      {user.status === "Active" ? (
                        <DropdownMenuItem onClick={async () => {
                          try {
                            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
                            await fetch(`${API_URL}/admin/users/deactivate`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [user.id] }) })
                            onUpdated && onUpdated()
                          } catch (e) { console.error(e) }
                        }}>
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={async () => {
                          try {
                            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
                            await fetch(`${API_URL}/admin/users/activate`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [user.id] }) })
                            onUpdated && onUpdated()
                          } catch (e) { console.error(e) }
                        }}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={async () => {
                        try {
                          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
                          await fetch(`${API_URL}/admin/users`, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [user.id] }) })
                          onUpdated && onUpdated()
                        } catch (e) { console.error(e) }
                      }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
          {filteredUsers.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

UsersTable.propTypes = {
  selectedUsers: PropTypes.array.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  filters: PropTypes.any,
}
