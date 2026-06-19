// src/app/owner/team/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { db } from "@/db/db";
import NotificationBell from "@/app/components/notifications/NotificationBell";

type Employee = {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  profile_id: string | null;
};

export default function TeamManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.id) {
      fetchEmployees();
    }
  }, [status, session, router]);

  const fetchEmployees = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { data: business } = await db
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (business) {
        const { data, error } = await db
          .from("employees")
          .select("*")
          .eq("business_id", business.id)
          .eq("role", "employee");

        if (error) {
          console.error("Error fetching employees:", error);
        } else {
          setEmployees(data || []);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteEmployeeId(id);
    setIsDeleteModalOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingEmployee.name,
          surname: editingEmployee.surname,
          email: editingEmployee.email,
          role: editingEmployee.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Employee updated successfully!" });
        setIsEditModalOpen(false);
        fetchEmployees();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update employee" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteEmployeeId) return;

    try {
      const response = await fetch(`/api/employees/${deleteEmployeeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Employee deleted successfully!" });
        setIsDeleteModalOpen(false);
        fetchEmployees();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete employee" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.name} ${emp.surname} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-emerald-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      
      <style>{`
        .nav-link { 
          position: relative;
          font-weight: 500;
          color: #4B5563;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #059669; }
        .nav-link.active { color: #059669; }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2px;
          background: #059669;
          border-radius: 2px;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .employee-row {
          transition: all 0.2s;
        }
        .employee-row:hover {
          background-color: #F9FAFB;
        }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">Team Management</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/owner-dashboard" className="nav-link active">Dashboard</Link>
              <Link href="/owner/team" className="nav-link active">Team</Link>
              <Link href="/reports" className="nav-link">Reports</Link>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/owner-dashboard"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ← Back
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden py-2 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              <Link href="/owner-dashboard" className="text-emerald-600 font-medium px-3 py-2">Dashboard</Link>
              <Link href="/owner/team" className="text-emerald-600 font-medium px-3 py-2">Team</Link>
              <Link href="/reports" className="text-gray-600 px-3 py-2">Reports</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        {/* Team Management Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">👥 Team Members</h2>
              <p className="text-sm text-gray-500">Manage your team members</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <label htmlFor="search-team" className="sr-only">Search team members</label>
                <input
                  id="search-team"
                  type="text"
                  placeholder="Search team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Search team members"
                />
              </div>
              <Link
                href="/owner-dashboard#add-employee"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">👤</div>
                <p>No employees yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Employee" to build your team</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="employee-row p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
                      {emp.name?.charAt(0)}{emp.surname?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{emp.name} {emp.surname}</p>
                      <p className="text-sm text-gray-500">{emp.email}</p>
                    </div>
                    <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                      {emp.role || 'Employee'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      aria-label={`Edit ${emp.name} ${emp.surname}`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label={`Delete ${emp.name} ${emp.surname}`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with count */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Employee</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  placeholder="Enter first name"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="edit-surname" className="block text-sm font-medium text-gray-700 mb-1">
                  Surname *
                </label>
                <input
                  id="edit-surname"
                  type="text"
                  value={editingEmployee.surname}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, surname: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  placeholder="Enter last name"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  placeholder="employee@example.com"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="edit-role"
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Select role"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteEmployeeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800">Delete Employee</h2>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete this employee?
              </p>
              <p className="text-sm text-red-500 font-medium mt-1">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}