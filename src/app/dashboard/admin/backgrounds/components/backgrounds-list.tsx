"use client";

import { useState } from "react";
import { type Background, updateBackground, deleteBackground } from "@/app/actions/backgrounds";
import { Button } from "@heroui/react";
import { Edit2, Trash2, Check, X, ShieldAlert, Loader2 } from "lucide-react";

export function BackgroundsList({ initialBackgrounds }: { initialBackgrounds: Background[] }) {
  const [backgrounds, setBackgrounds] = useState<Background[]>(initialBackgrounds);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; category: string; is_free: boolean }>({ name: "", category: "mesh", is_free: false });
  const [loading, setLoading] = useState(false);

  const startEdit = (bg: Background) => {
    setEditingId(bg.id);
    setEditForm({ name: bg.name, category: bg.category, is_free: bg.is_free });
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    try {
      await updateBackground(id, editForm);
      setBackgrounds(backgrounds.map(b => b.id === id ? { ...b, ...editForm } as Background : b));
      setEditingId(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this background? This cannot be undone.")) return;
    try {
      await deleteBackground(id);
      setBackgrounds(backgrounds.filter(b => b.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (backgrounds.length === 0) {
    return <div className="p-8 text-center text-sm text-zinc-500">No backgrounds uploaded yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-100">
          <tr>
            <th className="px-6 py-3 font-semibold">Preview</th>
            <th className="px-6 py-3 font-semibold">Details</th>
            <th className="px-6 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {backgrounds.map((bg) => (
            <tr key={bg.id} className="bg-white hover:bg-zinc-50/50 transition-colors">
              <td className="px-6 py-4 w-32">
                <div className="size-16 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-100 flex items-center justify-center relative">
                  {bg.thumbnail_url ? (
                    <img src={bg.thumbnail_url} alt={bg.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-zinc-400">No img</span>
                  )}
                  {!bg.is_free && (
                    <div className="absolute top-1 right-1 size-4 bg-rose-500 rounded-full flex items-center justify-center text-white" title="Premium">
                      <ShieldAlert className="size-2.5" />
                    </div>
                  )}
                </div>
              </td>
              
              <td className="px-6 py-4">
                {editingId === bg.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                    />
                    <div className="flex gap-4">
                      <select
                        value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value as any })}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                      >
                        <option value="mesh">Mesh</option>
                        <option value="image">Image</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.is_free}
                          onChange={e => setEditForm({ ...editForm, is_free: e.target.checked })}
                          className="rounded border-zinc-300"
                        />
                        Is Free
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-zinc-900">{bg.name}</div>
                    <div className="text-zinc-500 text-xs mt-1 capitalize">{bg.category} • {bg.is_free ? "Free" : "Premium"}</div>
                  </div>
                )}
              </td>

              <td className="px-6 py-4 text-right space-x-2">
                {editingId === bg.id ? (
                  <>
                    <Button size="sm" variant="ghost" isPending={loading} onPress={() => handleSave(bg.id)} isIconOnly>
                      {loading ? <Loader2 className="size-4 animate-spin" size="sm" /> : <Check className="size-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onPress={() => setEditingId(null)} isIconOnly>
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onPress={() => startEdit(bg)} isIconOnly>
                      <Edit2 className="size-4 text-zinc-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onPress={() => handleDelete(bg.id)} isIconOnly>
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
