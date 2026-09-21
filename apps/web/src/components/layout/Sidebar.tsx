import {
  Building2,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router";
import { logout } from "../../features/auth/auth-services";
import { canManageUsers, formatRole } from "../../lib/user-display";
import { useAuthStore } from "../../store/useAuthStore";
import { Button } from "../ui/Button";

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const navItems = [
    {
      to: "/",
      label: "Overview",
      icon: LayoutDashboard,
      end: true,
      visible: true,
    },
    {
      to: "/users",
      label: "Users",
      icon: Users,
      visible: canManageUsers(user.role),
    },
    {
      to: "/branches",
      label: user.branchId ? "My Branch" : "Branches",
      icon: Building2,
      visible: true,
    },
    { to: "/profile", label: "My Profile", icon: UserRound, visible: true },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-line-soft px-5">
        <img
          className="h-11 w-11 rounded-full border-2 border-brand-gold object-cover"
          src="/icon.jpg"
          alt="Ann Htike logo"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-bold leading-tight text-ink">
            Ann Htike
          </p>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-red">
            Restaurant
          </p>
        </div>
        {onClose && (
          <Button
            className="h-9 w-9 px-0 lg:hidden"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-6"
        aria-label="Main navigation"
      >
        <p className="mb-3 px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-muted">
          Workspace
        </p>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-red-soft text-brand-red"
                      : "text-muted hover:bg-line-soft hover:text-ink"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
      </nav>

      <div className="border-t border-line-soft p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gold text-sm font-extrabold text-gold-ink">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted">
              {formatRole(user.role)}
            </p>
          </div>
        </div>
        <Button
          className="w-full justify-start"
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
        >
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
