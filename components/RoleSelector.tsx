import { Laptop2, ShieldCheck, Users } from "lucide-react";
import { motion } from "framer-motion";
import { type ComponentType, type Dispatch, type SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AudienceRole } from "@/types/generation";
import { cn } from "@/lib/utils";

const roles: Array<{
  label: AudienceRole;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    label: "Student",
    description: "Gentle onboarding, analogies, and definitions.",
    icon: Users,
  },
  {
    label: "Full Stack Developer",
    description: "Deep dives, request bodies, and integration tips.",
    icon: Laptop2,
  },
  {
    label: "Security Researcher",
    description: "Attack surface, auth controls, and guardrails.",
    icon: ShieldCheck,
  },
  {
    label: "Other",
    description: "Describe a custom audience to target.",
    icon: Users,
  },
];

interface RoleSelectorProps {
  value: AudienceRole;
  onChange: Dispatch<SetStateAction<AudienceRole>>;
  customRole: string;
  onCustomRoleChange: (value: string) => void;
}

export function RoleSelector({
  value,
  onChange,
  customRole,
  onCustomRoleChange,
}: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Select Your Role
          </p>
          <p className="text-sm text-white/65">
            Choose the audience that needs clarity the most.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const isActive = value === role.label;
          return (
            <motion.button
              key={role.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(role.label)}
              className={cn(
                "group relative flex flex-col gap-3 rounded-3xl border border-white/10 p-5 text-left transition-all duration-200",
                "bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:border-white/40",
                isActive && "border-[#7b5cff] shadow-glow"
              )}
              type="button"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-2xl border border-white/10 bg-white/5 p-3",
                    isActive && "bg-[#7b5cff]/20"
                  )}
                >
                  <role.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{role.label}</p>
                  <p className="text-xs text-white/60">{role.description}</p>
                </div>
              </div>
              {isActive && <div className="h-1 w-12 rounded-full bg-[#7b5cff]" />}
            </motion.button>
          );
        })}
      </div>
      {value === "Other" && (
        <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5">
          <Label htmlFor="custom-role" className="text-white/70">
            Describe your audience
          </Label>
          <Input
            id="custom-role"
            placeholder="e.g. UI Designer, Product Manager, QA Engineer"
            value={customRole}
            onChange={(event) => onCustomRoleChange(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
