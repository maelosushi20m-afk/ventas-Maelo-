import { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card text-center py-8">
      {icon && <div className="text-brand-gold mb-2 flex justify-center">{icon}</div>}
      <div className="font-semibold">{title}</div>
      {description && <div className="text-sm text-gray-400 mt-1">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
