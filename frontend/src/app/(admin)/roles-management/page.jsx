"use client"

import React, { useState, useEffect } from "react"
import { useLoading } from '../../hooks/useLoading'
import Loader from '../../components/loader/page'
import {
  Users,
  UserCheck,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Settings,
  Key,
  Ban,
  UserX,
  Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Switch } from "../../../components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { toast } from "react-hot-toast"
import { cn } from "../../../lib/utils"

export default function RolesManagement() {
  const { loading, withLoading } = useLoading()
  const [staffUsers, setStaffUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [activeTab, setActiveTab] = useState("delivery-staff")
  const [showPassword, setShowPassword] = useState(false)

  // Fetch staff users on component mount
  useEffect(() => {
    fetchStaffUsers()
  }, [])

  const fetchStaffUsers = async () => {
    await withLoading(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.users) {
          // Filter for staff roles (deliveryStaff and inventoryManager)
          const staffOnly = data.users.filter(user => 
            user.role === 'deliveryStaff' || user.role === 'inventoryManager'
          )
          setStaffUsers(staffOnly)
        }
      } catch (error) {
        console.error('Error fetching staff users:', error)
        toast.error('Failed to fetch staff users')
      }
    })
  }

  const handleBlockUser = async (userId, shouldBlock) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${shouldBlock ? 'deactivate' : 'activate'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userIds: [userId],
          reason: blockReason
        })
      })

      if (response.ok) {
        toast.success(`User ${shouldBlock ? 'blocked' : 'unblocked'} successfully`)
        fetchStaffUsers() // Refresh the list
        setShowBlockDialog(false)
        setBlockReason("")
      } else {
        throw new Error('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error(`Failed to ${shouldBlock ? 'block' : 'unblock'} user`)
    }
  }

  const handleChangePassword = async (userId) => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newPassword: newPassword
        })
      })

      if (response.ok) {
        toast.success('Password changed successfully')
        setShowPasswordDialog(false)
        setNewPassword("")
        setConfirmPassword("")
      } else {
        throw new Error('Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    }
  }

  const handleUpdateUserDetails = async (userId, updatedData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        toast.success('User details updated successfully')
        fetchStaffUsers() // Refresh the list
        setEditingUser(null)
      } else {
        throw new Error('Failed to update user details')
      }
    } catch (error) {
      console.error('Error updating user details:', error)
      toast.error('Failed to update user details')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (user) => {
    if (user.isBlocked) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Blocked</Badge>
    }
    
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null
    const now = new Date()
    const hoursDiff = lastActive ? (now - lastActive) / (1000 * 60 * 60) : Infinity
    
    if (hoursDiff < 1) {
      return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Online</Badge>
    } else if (hoursDiff < 24) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Recently Active</Badge>
    } else {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Offline</Badge>
    }
  }

  const deliveryStaff = staffUsers.filter(user => user.role === 'deliveryStaff')
  const inventoryManagers = staffUsers.filter(user => user.role === 'inventoryManager')

  const UserCard = ({ user }) => (
    <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-14 w-14 ring-2 ring-gray-100">
              <AvatarImage 
                src={user.profileImage || user.profilePicture || user.avatar} 
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg">
                {user.firstName?.charAt(0)?.toUpperCase() || 'U'}{user.lastName?.charAt(0)?.toUpperCase() || 'N'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {user.role === 'inventoryManager' ? 'Inventory Manager' : 'Delivery Staff'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            {getStatusBadge(user)}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{user.phone || 'No phone number'}</span>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{user.address || 'No address provided'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Joined {formatDate(user.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Last active {formatDate(user.lastActiveAt)}</span>
          </div>

          {user.twoFactorEnabled && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>2FA Enabled</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* First Row - View and Edit */}
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(user)}
              className="flex-1 h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              <span className="text-xs">View</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(user)}
              className="flex-1 h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              <span className="text-xs">Edit</span>
            </Button>
          </div>

          {/* Second Row - Password and Block */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUser(user)
                setShowPasswordDialog(true)
              }}
              className="flex-1 h-8"
            >
              <Key className="h-3 w-3 mr-1" />
              <span className="text-xs">Password</span>
            </Button>

            <Button
              variant={user.isBlocked ? "default" : "destructive"}
              size="sm"
              onClick={() => {
                setSelectedUser(user)
                setShowBlockDialog(true)
              }}
              className="flex-1 h-8"
            >
              {user.isBlocked ? (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  <span className="text-xs">Unblock</span>
                </>
              ) : (
                <>
                  <Ban className="h-3 w-3 mr-1" />
                  <span className="text-xs">Block</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      {loading && <Loader />}
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Roles Management</h1>
            <p className="text-gray-600">Manage delivery staff and inventory managers</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900">{staffUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Staff</p>
                    <p className="text-2xl font-bold text-gray-900">{deliveryStaff.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inventory Managers</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryManagers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Ban className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blocked Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {staffUsers.filter(user => user.isBlocked).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="delivery-staff">Delivery Staff ({deliveryStaff.length})</TabsTrigger>
              <TabsTrigger value="inventory-managers">Inventory Managers ({inventoryManagers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="delivery-staff" className="space-y-6">
              {deliveryStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                  {deliveryStaff.map((user) => (
                    <UserCard key={user._id} user={user} />
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Staff Found</h3>
                    <p className="text-gray-500">No delivery staff members are currently registered.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="inventory-managers" className="space-y-6">
              {inventoryManagers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                  {inventoryManagers.map((user) => (
                    <UserCard key={user._id} user={user} />
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Managers Found</h3>
                    <p className="text-gray-500">No inventory managers are currently registered.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser && !showPasswordDialog && !showBlockDialog} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profileImage} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg">
                    {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  {getStatusBadge(selectedUser)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedUser.address || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm capitalize">{selectedUser.role.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Joined {formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Last login {formatDate(selectedUser.lastLogin)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Last active {formatDate(selectedUser.lastActiveAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Security Settings</h4>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Two-Factor Authentication</span>
                  </div>
                  <Badge variant={selectedUser.twoFactorEnabled ? "default" : "secondary"}>
                    {selectedUser.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={editingUser.address}
                  onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateUserDetails(editingUser._id, editingUser)}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleChangePassword(selectedUser?._id)}
                className="flex-1"
                disabled={!newPassword || !confirmPassword}
              >
                <Save className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false)
                  setNewPassword("")
                  setConfirmPassword("")
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock User Modal */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.isBlocked ? 'Unblock User' : 'Block User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {selectedUser?.isBlocked 
                    ? 'This will restore user access to the system.'
                    : 'This will prevent the user from accessing the system.'
                  }
                </p>
              </div>
            </div>

            {!selectedUser?.isBlocked && (
              <div>
                <Label htmlFor="blockReason">Reason for blocking (optional)</Label>
                <Textarea
                  id="blockReason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter reason for blocking this user..."
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleBlockUser(selectedUser?._id, !selectedUser?.isBlocked)}
                className="flex-1"
                variant={selectedUser?.isBlocked ? "default" : "destructive"}
              >
                {selectedUser?.isBlocked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unblock User
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Block User
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockDialog(false)
                  setBlockReason("")
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}