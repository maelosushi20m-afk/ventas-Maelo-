"use client";
import { ChangeEvent, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";

export function ImageUpload({
  folder,
  value,
  onChange
}: {
  folder: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handle = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Máximo 5MB");
    setUploading(true);
    try {
      const path = `${folder}/${Date.now()}_${file.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      onChange(url);
      toast.success("Imagen subida");
    } catch (err: any) {
      toast.error(err.message || "Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && <img src={value} alt="preview" className="w-full h-32 object-cover rounded-lg" />}
      <label className="btn-ghost cursor-pointer w-full">
        <Upload size={16} /> {uploading ? "Subiendo…" : "Subir imagen"}
        <input type="file" accept="image/*" onChange={handle} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
}
