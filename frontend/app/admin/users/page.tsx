'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getAllUsers, createUser, updateUser, deleteUser } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
  created_at: string
}

export default function AdminUsersPage() {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'customer'>('customer')

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect to dashboard if not admin
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [isAdmin, isAuthenticated, authLoading, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setError('') // Clear previous errors
    
    try {
      await createUser({ name: name.trim(), email: email.trim(), password, role })
      alert('User created successfully!')
      setShowCreateDialog(false)
      resetForm()
      fetchUsers()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create user'
      setError(errorMsg)
      alert(`Error: ${errorMsg}`)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    try {
      await updateUser(selectedUser.id, { name, email, role })
      setShowEditDialog(false)
      resetForm()
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    setError('') // Clear previous errors
    
    try {
      console.log('Deleting user:', userId)
      const result = await deleteUser(userId)
      console.log('Delete result:', result)
      alert(result.message || 'User deleted successfully')
      fetchUsers()
    } catch (err: any) {
      console.error('Delete user error:', err)
      const errorMsg = err.message || 'Failed to delete user'
      setError(errorMsg)
      alert(`Error: ${errorMsg}`)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setName(user.name)
    setEmail(user.email)
    setRole(user.role)
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('customer')
    setSelectedUser(null)
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Checking authentication...</p>
      </div>
    )
  }

  // Don't render if not authenticated or not admin (will redirect)
  if (!isAuthenticated || !isAdmin) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-300">Manage all system users</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="btn-primary"
        >
          ➕ Create User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
        </div>
      ) : (
        <div className="card-gradient">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 text-gray-300">Role</th>
                  <th className="text-left py-3 px-4 text-gray-300">Created</th>
                  <th className="text-right py-3 px-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">{user.name}</td>
                    <td className="py-3 px-4 text-gray-300">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditDialog(user)}
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-gradient max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create New User</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
              
              <div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'customer')}
                  className="input"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  onClick={handleCreateUser} 
                  className="btn-primary flex-1"
                  disabled={!name || !email || !password || password.length < 6}
                >
                  Create User
                </button>
                <button
                  onClick={() => {
                    setShowCreateDialog(false)
                    resetForm()
                    setError('')
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-gradient max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Edit User</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'customer')}
                className="input"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex space-x-4">
                <button onClick={handleUpdateUser} className="btn-primary flex-1">
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditDialog(false)
                    resetForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
