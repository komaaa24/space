"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Send, Trash2, X, Loader2, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";

interface VariantDb {
  id: string;
  attributes: { name: string; value: string }[];
  stock: number;
}

interface CatalogItemDb {
  id: string;
  name: string;
  price: string;
  category: string;
  emoji: string;
  inStock: boolean;
  sentCount: number;
  createdAt: string;
  variants: VariantDb[];
}

export default function CatalogPage() {
  const [catalogAllowed, setCatalogAllowed] = useState<boolean | null>(null);
  const [products, setProducts] = useState<CatalogItemDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [saving, setSaving] = useState(false);
  const [newVariants, setNewVariants] = useState<
    { attrs: { name: string; value: string }[]; stock: string }[]
  >([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftAttrs, setDraftAttrs] = useState<{ name: string; value: string }[]>([
    { name: "", value: "" },
  ]);
  const [draftStock, setDraftStock] = useState("");
  const [savingVariant, setSavingVariant] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/catalog");
    const data = await res.json();
    setProducts(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCatalogAllowed(Boolean(data.user?.access?.features?.catalog)))
      .catch(() => setCatalogAllowed(false));
    load();
  }, []);

  const categories = [...new Set(products.map((p) => p.category))];
  const visible = activeCategory ? products.filter((p) => p.category === activeCategory) : products;
  const catalogLocked = catalogAllowed === false;

  function addNewVariantBlock() {
    setNewVariants((prev) => [...prev, { attrs: [{ name: "", value: "" }], stock: "" }]);
  }

  function removeNewVariantBlock(i: number) {
    setNewVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateNewVariantAttr(
    blockIdx: number,
    attrIdx: number,
    field: "name" | "value",
    value: string,
  ) {
    setNewVariants((prev) =>
      prev.map((block, bIdx) =>
        bIdx !== blockIdx
          ? block
          : {
              ...block,
              attrs: block.attrs.map((a, aIdx) =>
                aIdx === attrIdx ? { ...a, [field]: value } : a,
              ),
            },
      ),
    );
  }

  function addNewVariantAttrRow(blockIdx: number) {
    setNewVariants((prev) =>
      prev.map((block, bIdx) =>
        bIdx !== blockIdx ? block : { ...block, attrs: [...block.attrs, { name: "", value: "" }] },
      ),
    );
  }

  function updateNewVariantStock(blockIdx: number, stock: string) {
    setNewVariants((prev) =>
      prev.map((block, bIdx) => (bIdx !== blockIdx ? block : { ...block, stock })),
    );
  }

  async function addProduct() {
    if (!name.trim() || !price.trim() || !category.trim()) return;
    setSaving(true);
    try {
      const variants = newVariants
        .map((v) => ({
          attributes: v.attrs.filter((a) => a.name.trim() && a.value.trim()),
          stock: Number(v.stock) || 0,
        }))
        .filter((v) => v.attributes.length > 0);

      await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: price.trim(),
          category: category.trim(),
          emoji: emoji.trim() || "📦",
          variants,
        }),
      });
      setShowModal(false);
      setName("");
      setPrice("");
      setCategory("");
      setEmoji("📦");
      setNewVariants([]);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleStock(p: CatalogItemDb) {
    await fetch(`/api/catalog/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: !p.inStock }),
    });
    await load();
  }

  function toggleExpanded(id: string) {
    setExpandedId(expandedId === id ? null : id);
    setDraftAttrs([{ name: "", value: "" }]);
    setDraftStock("");
  }

  function updateDraftAttr(i: number, field: "name" | "value", value: string) {
    setDraftAttrs((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    );
  }

  function addDraftAttrRow() {
    setDraftAttrs((prev) => [...prev, { name: "", value: "" }]);
  }

  async function addVariant(itemId: string) {
    const attributes = draftAttrs.filter((a) => a.name.trim() && a.value.trim());
    if (attributes.length === 0) return;
    setSavingVariant(true);
    try {
      await fetch(`/api/catalog/${itemId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes, stock: Number(draftStock) || 0 }),
      });
      setDraftAttrs([{ name: "", value: "" }]);
      setDraftStock("");
      await load();
    } finally {
      setSavingVariant(false);
    }
  }

  async function updateVariantStock(itemId: string, variantId: string, stock: number) {
    await fetch(`/api/catalog/${itemId}/variants/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    await load();
  }

  async function deleteVariant(itemId: string, variantId: string) {
    await fetch(`/api/catalog/${itemId}/variants/${variantId}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Katalog"
        subtitle="AI agent mijozlarga shu mahsulotlarni taklif qiladi va yuboradi"
        action={
          <PrimaryButton onClick={() => setShowModal(true)} disabled={catalogLocked}>
            <Plus className="w-4 h-4" /> Mahsulot qo'shish
          </PrimaryButton>
        }
      />

      <div className="relative">
        {catalogLocked && (
          <div className="absolute inset-0 z-20 rounded-3xl bg-white/45 backdrop-blur-[1px]">
            <div className="sticky top-28 mx-auto mt-8 w-full max-w-md rounded-2xl border border-electric-100 bg-white/95 p-5 text-center shadow-[0_20px_60px_rgba(15,94,255,0.16)]">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-electric-50 text-electric-600">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-extrabold">Katalog VIP tarifda ochiq</h2>
              <p className="mt-1 text-sm text-slate-500">
                Mahsulotlar, variantlar va sklad qanday ishlashini ko&apos;rishingiz mumkin,
                lekin boshqarish uchun VIP tarif kerak.
              </p>
              <Link
                href="/#pricing"
                className="mt-4 inline-flex rounded-xl bg-electric-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,94,255,0.28)]"
              >
                Tariflarni ko&apos;rish
              </Link>
            </div>
          </div>
        )}

        <div className={catalogLocked ? "pointer-events-none select-none opacity-45" : undefined}>
          {loading ? (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-white border border-line border-dashed p-10 text-center text-sm text-slate-400">
              Hali hech qanday mahsulot qo'shilmagan — "Mahsulot qo'shish" tugmasi bilan boshlang
            </div>
          ) : (
            <>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                activeCategory === null
                  ? "bg-electric-500 text-white"
                  : "bg-white border border-line text-slate-500 hover:border-electric-300"
              }`}
            >
              Barchasi {products.length}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`text-[13px] font-medium px-3.5 py-2 rounded-xl transition-colors ${
                  activeCategory === c
                    ? "bg-electric-500 text-white"
                    : "bg-white border border-line text-slate-500 hover:border-electric-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white border border-line hover:border-electric-300 transition-all p-5 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#f4f7ff] flex items-center justify-center text-2xl">
                    {p.emoji}
                  </div>
                  <button onClick={() => toggleStock(p)}>
                    <Badge color={p.inStock ? "green" : "red"} dot>
                      {p.inStock ? "Sotuvda" : "Tugagan"}
                    </Badge>
                  </button>
                </div>
                <div className="mt-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {p.category}
                  </div>
                  <div className="font-bold text-[14.5px] mt-1 leading-snug">{p.name}</div>
                  <div className="text-electric-600 font-extrabold text-lg mt-2">
                    {p.price} <span className="text-xs font-medium">so'm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Send className="w-3 h-3" /> AI {p.sentCount} marta yuborgan
                  </span>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => toggleExpanded(p.id)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-electric-600 mt-3"
                >
                  {expandedId === p.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  Variantlar {p.variants.length > 0 ? `(${p.variants.length})` : ""}
                </button>

                {expandedId === p.id && (
                  <div className="mt-3 pt-3 border-t border-line space-y-3">
                    {p.variants.length > 0 && (
                      <div className="space-y-1.5">
                        {p.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between gap-2 text-[12px] bg-[#f4f7ff] rounded-lg px-2.5 py-1.5"
                          >
                            <span className="truncate">
                              {v.attributes.map((a) => `${a.name}: ${a.value}`).join(", ")}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                defaultValue={v.stock}
                                onBlur={(e) =>
                                  updateVariantStock(p.id, v.id, Number(e.target.value) || 0)
                                }
                                className="w-14 text-center rounded-md border border-line text-[12px] py-0.5"
                              />
                              <button
                                onClick={() => deleteVariant(p.id, v.id)}
                                className="text-red-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {draftAttrs.map((a, i) => (
                        <div key={i} className="flex gap-1.5">
                          <input
                            value={a.name}
                            onChange={(e) => updateDraftAttr(i, "name", e.target.value)}
                            placeholder="Xususiyat (masalan O'lcham)"
                            className={`${inputCls} text-[12px] py-1.5`}
                          />
                          <input
                            value={a.value}
                            onChange={(e) => updateDraftAttr(i, "value", e.target.value)}
                            placeholder="Qiymati (masalan L)"
                            className={`${inputCls} text-[12px] py-1.5`}
                          />
                        </div>
                      ))}
                      <button
                        onClick={addDraftAttrRow}
                        className="text-[11px] font-semibold text-electric-600"
                      >
                        + yana xususiyat
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={draftStock}
                        onChange={(e) => setDraftStock(e.target.value)}
                        placeholder="Sklad soni"
                        className={`${inputCls} text-[12px] py-1.5`}
                      />
                      <button
                        onClick={() => addVariant(p.id)}
                        disabled={savingVariant}
                        className="shrink-0 text-[12px] font-semibold bg-electric-500 hover:bg-electric-600 text-white px-3 rounded-xl disabled:opacity-60"
                      >
                        {savingVariant ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Qo'shish"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Yangi mahsulot</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewVariants([]);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className={`${inputCls} w-16 text-center text-xl`}
                maxLength={4}
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mahsulot nomi"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Narxi (so'm)"
                className={inputCls}
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Kategoriya"
                className={inputCls}
              />
            </div>

            <div className="pt-2 border-t border-line space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Variantlar (ixtiyoriy) — o'lcham, rang va h.k.
              </div>
              {newVariants.map((block, blockIdx) => (
                <div key={blockIdx} className="rounded-xl bg-[#f9fafc] p-2.5 space-y-1.5">
                  {block.attrs.map((a, attrIdx) => (
                    <div key={attrIdx} className="flex gap-1.5">
                      <input
                        value={a.name}
                        onChange={(e) =>
                          updateNewVariantAttr(blockIdx, attrIdx, "name", e.target.value)
                        }
                        placeholder="Xususiyat (masalan O'lcham)"
                        className={`${inputCls} text-[12px] py-1.5`}
                      />
                      <input
                        value={a.value}
                        onChange={(e) =>
                          updateNewVariantAttr(blockIdx, attrIdx, "value", e.target.value)
                        }
                        placeholder="Qiymati (masalan L)"
                        className={`${inputCls} text-[12px] py-1.5`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addNewVariantAttrRow(blockIdx)}
                    className="text-[11px] font-semibold text-electric-600"
                  >
                    + yana xususiyat
                  </button>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={block.stock}
                      onChange={(e) => updateNewVariantStock(blockIdx, e.target.value)}
                      placeholder="Sklad soni"
                      className={`${inputCls} text-[12px] py-1.5`}
                    />
                    <button
                      onClick={() => removeNewVariantBlock(blockIdx)}
                      className="shrink-0 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addNewVariantBlock}
                className="text-[12px] font-semibold text-electric-600"
              >
                + variant qo'shish
              </button>
            </div>

            <PrimaryButton onClick={addProduct} disabled={saving} className="w-full justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qo'shish"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
