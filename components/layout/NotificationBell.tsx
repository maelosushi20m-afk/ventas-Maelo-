"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import toast from "react-hot-toast";

export function NotificationBell() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
    let first = true;
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!first) {
        const added = snap.docChanges().filter((c) => c.type === "added");
        added.forEach((c) => {
          const d: any = c.doc.data();
          toast(d.mensaje, { icon: "🔔" });
        });
      }
      first = false;
      setNotifs(data);
    });
  }, []);

  const unread = notifs.filter((n) => !n.leida).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 hover:bg-brand-gray rounded-lg">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-brand-dark border border-brand-gray rounded-lg shadow-xl z-50 max-h-96 overflow-auto">
          {notifs.length === 0 && <div className="p-4 text-sm text-gray-400">Sin notificaciones</div>}
          {notifs.map((n) => (
            <div key={n.id} className="p-3 border-b border-brand-gray text-sm">
              {n.mensaje}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
