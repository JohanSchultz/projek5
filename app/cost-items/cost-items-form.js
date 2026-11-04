"use client";

import CostItemsGrid from "./cost-items-grid";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const readonlyBaseClassName =
  "rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

const readonlyFieldClassName = `${readonlyBaseClassName} w-full`;
const readonlySmallFieldClassName = `${readonlyBaseClassName} w-32`;

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const selectClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function normalizeName(value) {
  return (value ?? "").trim();
}

function formatReportDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function getCostItemField(costItemRow, fieldName) {
  const key = Object.keys(costItemRow).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? costItemRow[key] : undefined;
}

function isValidTwoDecimalInput(value) {
  return value === "" || /^\d*\.?\d{0,2}$/.test(value);
}

function formatTwoDecimalFieldValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  const fixed = numericValue.toFixed(2);
  return fixed.replace(/\.?0+$/, "") || "0";
}

export default function CostItemsForm({ technicians }) {
  const searchParams = useSearchParams();
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [costItemId, setCostItemId] = useState("");
  const [selectedGridCostItemId, setSelectedGridCostItemId] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("0");
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);
  const [costItems, setCostItems] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingCostItems, setLoadingCostItems] = useState(false);
  const [costItemsError, setCostItemsError] = useState(null);

  async function loadCostItems(problemId) {
    setLoadingCostItems(true);
    setCostItemsError(null);

    try {
      const supabase = createClient();
      const { data, error: loadError } = await supabase.rpc(
        "pr_cost_item_by_problem_id",
        { p_problem_id: Number(problemId) }
      );

      if (loadError) {
        throw loadError;
      }

      setCostItems(data ?? []);
    } catch (loadError) {
      setCostItems([]);
      setCostItemsError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load cost items for this problem."
      );
    } finally {
      setLoadingCostItems(false);
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("issuesCostItemsContext");
    const problemId = searchParams.get("problemId");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContext(parsed);
        setSelectedTechnicianId(parsed.technicianId ?? "0");
        loadCostItems(parsed.problemId);
        return;
      } catch {
        setError("Could not read problem details from the Issues page.");
        return;
      }
    }

    if (!problemId) {
      setError("No problem was selected on the Issues page.");
      return;
    }

    setError(
      "Problem details were not found. Return to Issues and select Cost Items again."
    );
  }, [searchParams]);

  async function handleSave() {
    setSaveError(null);
    setSaveMessage(null);

    if (!context?.problemId) {
      setSaveError("No problem was selected on the Issues page.");
      return;
    }

    if (selectedTechnicianId === "0") {
      setSaveError("Please select a technician.");
      return;
    }

    if (!item.trim() || !qty.trim() || !unitPrice.trim()) {
      setSaveError("Please enter item, qty, and unit price.");
      return;
    }

    const qtyValue = Number(qty);
    const unitPriceValue = Number(unitPrice);

    if (Number.isNaN(qtyValue) || Number.isNaN(unitPriceValue)) {
      setSaveError("Qty and unit price must be numeric.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error: saveCostItemError } = await supabase.rpc("pi_cost_item", {
      p_descr: item.trim(),
      p_qty: qtyValue,
      p_unit_price: unitPriceValue,
      p_problem_id: Number(context.problemId),
      p_technician_id: Number(selectedTechnicianId),
    });

    setSaving(false);

    if (saveCostItemError) {
      setSaveError(saveCostItemError.message);
      return;
    }

    resetEditableFields();
    await loadCostItems(context.problemId);
    setSaveMessage("Cost item saved successfully.");
  }

  function resetEditableFields() {
    setItem("");
    setQty("");
    setUnitPrice("");
    setCostItemId("");
    setSelectedGridCostItemId(null);
    setSelectedTechnicianId(context?.technicianId ?? "0");
  }

  function resetAfterUpdate() {
    setItem("");
    setQty("");
    setUnitPrice("");
    setCostItemId("");
    setSelectedGridCostItemId(null);
    setSelectedTechnicianId("0");
  }

  function handleCostItemSelect(costItemRow) {
    setSaveError(null);
    setSaveMessage(null);
    const rowId = getCostItemField(costItemRow, "id");

    setSelectedGridCostItemId(rowId);
    setCostItemId(String(rowId ?? ""));
    setItem(String(getCostItemField(costItemRow, "descr") ?? ""));
    setQty(formatTwoDecimalFieldValue(getCostItemField(costItemRow, "qty")));
    setUnitPrice(
      formatTwoDecimalFieldValue(getCostItemField(costItemRow, "unit_price"))
    );

    const technician = technicians.find(
      (entry) =>
        normalizeName(entry.name) ===
        normalizeName(getCostItemField(costItemRow, "technician"))
    );

    setSelectedTechnicianId(technician ? String(technician.id) : "0");
  }

  async function handleUpdate() {
    setSaveError(null);
    setSaveMessage(null);

    if (!costItemId) {
      setSaveError("Please select a cost item from the grid.");
      return;
    }

    if (selectedTechnicianId === "0") {
      setSaveError("Please select a technician.");
      return;
    }

    if (!item.trim() || !qty.trim() || !unitPrice.trim()) {
      setSaveError("Please enter item, qty, and unit price.");
      return;
    }

    const qtyValue = Number(qty);
    const unitPriceValue = Number(unitPrice);

    if (Number.isNaN(qtyValue) || Number.isNaN(unitPriceValue)) {
      setSaveError("Qty and unit price must be numeric.");
      return;
    }

    setUpdating(true);

    const supabase = createClient();
    const { error: updateCostItemError } = await supabase.rpc("pu_cost_item", {
      p_id: Number(costItemId),
      p_descr: item.trim(),
      p_qty: qtyValue,
      p_unit_price: unitPriceValue,
      p_technician_id: Number(selectedTechnicianId),
    });

    setUpdating(false);

    if (updateCostItemError) {
      setSaveError(updateCostItemError.message);
      return;
    }

    resetAfterUpdate();
    await loadCostItems(context.problemId);
    setSaveMessage("Cost item updated successfully.");
  }

  async function handleDelete() {
    setSaveError(null);
    setSaveMessage(null);

    if (!costItemId) {
      setSaveError("Please select a cost item from the grid.");
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { error: deleteCostItemError } = await supabase.rpc("pd_cost_item", {
        p_id: Number(costItemId),
      });

      if (deleteCostItemError) {
        setSaveError(deleteCostItemError.message);
        return;
      }

      resetAfterUpdate();
      await loadCostItems(context.problemId);
      setSaveMessage("Cost item deleted successfully.");
    } finally {
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!context) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading problem details...
      </p>
    );
  }

  const isEditing = Boolean(costItemId);
  const canSave =
    Boolean(item.trim()) && Boolean(qty.trim()) && Boolean(unitPrice.trim());

  function handleQtyChange(event) {
    const value = event.target.value;

    if (isValidTwoDecimalInput(value)) {
      setQty(value);
    }
  }

  function handleUnitPriceChange(event) {
    const value = event.target.value;

    if (isValidTwoDecimalInput(value)) {
      setUnitPrice(value);
    }
  }

  return (
    <div className="space-y-4">
      <input
        id="cost_item_id"
        name="cost_item_id"
        type="text"
        readOnly
        value={costItemId}
        hidden
      />

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Building
          </label>
          <input
            type="text"
            readOnly
            value={context.building ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Area
          </label>
          <input
            type="text"
            readOnly
            value={context.area ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Technician
          </label>
          <input
            type="text"
            readOnly
            value={context.technician ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Estimated Hours
          </label>
          <input
            type="text"
            readOnly
            value={context.estimatedHours ?? ""}
            className={readonlySmallFieldClassName}
          />
        </div>

        <div className="text-right">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Report Date
          </label>
          <input
            type="text"
            readOnly
            value={formatReportDate(context.reportDate)}
            className={`${readonlyFieldClassName} w-44`}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Comments
        </label>
        <textarea
          readOnly
          rows={6}
          value={context.comments ?? ""}
          className={`${readonlyFieldClassName} min-h-40 resize-none`}
        />
      </div>

      <hr className="border-zinc-300 dark:border-zinc-700" />

      <div>
        <label
          htmlFor="technician"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Technicians
        </label>
        <select
          id="technician"
          name="technicianId"
          value={selectedTechnicianId}
          onChange={(event) => setSelectedTechnicianId(event.target.value)}
          className={selectClassName}
        >
          <option value="0">- SELECT -</option>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full gap-[2%]">
        <div className="w-[60%] min-w-0">
          <label
            htmlFor="item"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Item
          </label>
          <input
            id="item"
            name="item"
            type="text"
            value={item}
            onChange={(event) => setItem(event.target.value)}
            className={`${inputClassName} w-full`}
          />
        </div>

        <div className="w-[12%] min-w-0">
          <label
            htmlFor="qty"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Qty
          </label>
          <input
            id="qty"
            name="qty"
            type="text"
            inputMode="decimal"
            value={qty}
            onChange={handleQtyChange}
            className={`${inputClassName} w-full`}
          />
        </div>

        <div className="w-[22%] min-w-0">
          <label
            htmlFor="unitPrice"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Unit Price
          </label>
          <input
            id="unitPrice"
            name="unitPrice"
            type="text"
            inputMode="decimal"
            value={unitPrice}
            onChange={handleUnitPriceChange}
            className={`${inputClassName} w-full`}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || updating || deleting || !canSave}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/50 px-5 text-sm font-medium text-blue-950 transition-colors hover:bg-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/30 dark:bg-blue-500/30 dark:text-blue-50 dark:hover:bg-blue-500/50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={handleUpdate}
          disabled={saving || updating || deleting || !isEditing}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/50 px-5 text-sm font-medium text-orange-950 transition-colors hover:bg-orange-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-orange-400/30 dark:bg-orange-500/30 dark:text-orange-50 dark:hover:bg-orange-500/50"
        >
          {updating ? "Updating..." : "Update"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || updating || deleting || !isEditing}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-red-500/40 bg-red-500/50 px-5 text-sm font-medium text-red-950 transition-colors hover:bg-red-500/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/30 dark:bg-red-500/30 dark:text-red-50 dark:hover:bg-red-500/50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {saveMessage ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {saveMessage}
        </p>
      ) : null}

      {saveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {saveError}
        </p>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cost Items
        </h2>
        <CostItemsGrid
          costItems={costItems}
          loading={loadingCostItems}
          selectedCostItemId={selectedGridCostItemId}
          onSelectCostItem={handleCostItemSelect}
        />
        {costItemsError ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {costItemsError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
