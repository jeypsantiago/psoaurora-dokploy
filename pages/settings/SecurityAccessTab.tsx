import React from "react";
import {
  ChevronRight,
  Edit2,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import type { Role, User } from "../../UserContext";

interface SecurityAccessTabProps {
  usersSubTab: "accounts" | "roles";
  onUsersSubTabChange: (tab: "accounts" | "roles") => void;
  users: User[];
  roles: Role[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onRemoveUser: (user: User) => void;
  onAddRole: () => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
  getRoleBadgeStyle: (badgeColor?: string) => React.CSSProperties;
}

export const SecurityAccessTab: React.FC<SecurityAccessTabProps> = ({
  usersSubTab,
  onUsersSubTabChange,
  users,
  roles,
  onAddUser,
  onEditUser,
  onRemoveUser,
  onAddRole,
  onEditRole,
  onDeleteRole,
  getRoleBadgeStyle,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <Card
        title="Security & Access"
        description="Manage user roles, accounts, and system-wide permissions"
        action={
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl min-w-max">
            <button
              onClick={() => onUsersSubTabChange("accounts")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${usersSubTab === "accounts" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
            >
              <Users size={12} /> Accounts
            </button>
            <button
              onClick={() => onUsersSubTabChange("roles")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${usersSubTab === "roles" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
            >
              <ShieldCheck size={12} /> Roles
            </button>
          </div>
        }
      >
        {usersSubTab === "accounts" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-blue-600" /> User Accounts
              </h4>
              <Button
                variant="outline"
                className="!py-1.5 !px-3 h-auto text-[10px] uppercase tracking-widest w-full sm:w-auto justify-center"
                onClick={onAddUser}
              >
                <UserPlus size={12} className="mr-2" /> New User
              </Button>
            </div>
            <div className="overflow-x-auto -mx-5 sm:mx-0">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                    <th className="pb-3 px-5 sm:px-0">User Account</th>
                    <th className="pb-3">Assigned Roles</th>
                    <th className="pb-3">Last Access</th>
                    <th className="pb-3 text-right px-5 sm:px-0">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {users.map((user) => (
                    <tr
                      key={user.email}
                      className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-4 px-5 sm:px-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              style={
                                roles.find((r) => r.name === role)
                                  ? getRoleBadgeStyle(
                                      roles.find((r) => r.name === role)
                                        ?.badgeColor,
                                    )
                                  : undefined
                              }
                              className="!text-[9px] border"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-xs text-zinc-500 font-medium">
                        {user.lastAccess}
                      </td>
                      <td className="py-4 text-right px-5 sm:px-0">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            className="!p-2"
                            onClick={() => onEditUser(user)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            className="!p-2"
                            onClick={() => onRemoveUser(user)}
                          >
                            <Trash2
                              size={14}
                              className="text-zinc-400 hover:text-red-500"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {usersSubTab === "roles" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" /> Roles &
                Permission Matrix
              </h4>
              <Button
                variant="outline"
                className="!py-1.5 !px-3 h-auto text-[10px] uppercase tracking-widest w-full sm:w-auto justify-center"
                onClick={onAddRole}
              >
                <Plus size={12} className="mr-2" /> New Role
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
                  onClick={() => onEditRole(role)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      style={getRoleBadgeStyle(role.badgeColor)}
                      className="mb-2 border"
                    >
                      {role.name}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRole(role.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 h-8">
                      {role.description}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4">
                    {role.permissions.length === 1 && role.permissions[0] === "all"
                      ? "Administrative Access"
                      : `${role.permissions.length} Custom Permissions`}
                  </p>
                  <div className="relative group/tooltip">
                    <button className="text-[10px] font-bold text-zinc-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                      View Permissions <ChevronRight size={12} />
                    </button>
                    <div className="absolute left-0 bottom-full mb-4 w-64 p-4 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50 pointer-events-none">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
                        Granted Capabilities
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {role.permissions.includes("all") ? (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400">
                              All System Access
                            </span>
                          </div>
                        ) : (
                          role.permissions.map((p) => (
                            <div key={p} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                              <span className="text-[10px] uppercase font-bold text-zinc-300">
                                {p.replace(".", " • ")}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="absolute left-6 top-full -mt-2 w-4 h-4 bg-zinc-900 dark:bg-zinc-800 rotate-45"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
