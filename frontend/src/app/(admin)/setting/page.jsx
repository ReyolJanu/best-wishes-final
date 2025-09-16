"use client";
import { useState } from 'react';
import { SidebarInset, SidebarTrigger } from "../../../components/ui/sidebar"
import { Separator } from "../../../components/ui/separator"
import { useDispatch, useSelector } from 'react-redux';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Switch } from "../../../components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { User, Lock, Bell, Shield, Camera, Upload } from "lucide-react"
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useSelector((state) => state.userState);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile/image`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProfileData(prev => ({
          ...prev,
          profileImage: data.profileImage
        }));
        toast.success('Profile image updated successfully');
        // You might want to update the Redux state here too
      } else {
        toast.error(data.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully');
        // You might want to update the Redux state here
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleRemoveImage = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile/image`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setProfileData(prev => ({ ...prev, profileImage: '' }));
        toast.success('Profile image removed successfully');
      } else {
        toast.error(data.message || 'Failed to remove profile image');
      }
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          {/* <SidebarTrigger className="-ml-1" /> */}
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin">Admin Panel</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Admin Profile
                  </CardTitle>
                  <CardDescription>Update your personal information and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-gray-200">
                        <AvatarImage 
                          src={profileData.profileImage || "/placeholder.svg"} 
                          alt="Profile"
                        />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xl font-semibold">
                          {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full p-2 h-8 w-8 bg-white border-2 shadow-sm"
                          onClick={() => document.getElementById('profile-image-upload').click()}
                          disabled={isUploading}
                        >
                          <Camera className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Profile Picture</h3>
                      <p className="text-sm text-gray-500 mb-3">
                        Upload a new profile picture. JPG, PNG or GIF (max 5MB).
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('profile-image-upload').click()}
                          disabled={isUploading}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {isUploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                        {profileData.profileImage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      type="text" 
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password"   value={user.password}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable 2FA</div>
                      <div className="text-sm text-muted-foreground">
                        Require a verification code in addition to your password
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <Button variant="outline">Configure 2FA</Button>
                </CardContent>
              </Card> */}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Order Notifications</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified about new orders and status changes
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Low Stock Alerts</div>
                        <div className="text-sm text-muted-foreground">
                          Receive alerts when products are running low
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Security Alerts</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified about security events and login attempts
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Marketing Updates</div>
                        <div className="text-sm text-muted-foreground">
                          Receive updates about new features and promotions
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  <Button>Save Preferences</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarInset>
  )
}
