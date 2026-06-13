import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppUser } from "@/types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })) as AppUser[];
    }
  });
}
