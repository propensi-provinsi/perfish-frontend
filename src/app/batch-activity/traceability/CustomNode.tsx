"use client";

import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { FiDownload, FiFileText, FiUpload, FiBox, FiTrendingUp } from "react-icons/fi";

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  type: "PURCHASE_ORDER" | "INBOUND_RECEIPT" | "CENTER_BATCH" | "SALES_ALLOCATION";
  subLabel?: string;
  partner?: string;
  status?: string;
}

export function CustomNode({ data }: NodeProps<Node<CustomNodeData, 'customNode'>>) {
  const isCenter = data.type === "CENTER_BATCH";
  const isPurchaseOrder = data.type === "PURCHASE_ORDER";
  const isInbound = data.type === "INBOUND_RECEIPT";
  const isSales = data.type === "SALES_ALLOCATION";

  let bgClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
  let iconClass = "text-gray-500 bg-gray-100";
  let Icon = FiBox;

  if (isCenter) {
    bgClass = "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/50 shadow-blue-500/30";
    iconClass = "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300";
    Icon = FiTrendingUp;
  } else if (isPurchaseOrder) {
    bgClass = "bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 border-violet-200 dark:border-violet-800 shadow-violet-500/20";
    iconClass = "text-violet-600 bg-violet-100 dark:bg-violet-900/50 dark:text-violet-400";
    Icon = FiFileText;
  } else if (isInbound) {
    bgClass = "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-800 shadow-emerald-500/20";
    iconClass = "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400";
    Icon = FiDownload;
  } else if (isSales) {
    bgClass = "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-200 dark:border-orange-800 shadow-orange-500/20";
    iconClass = "text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400";
    Icon = FiUpload;
  }

  return (
    <div className={`relative min-w-[240px] px-4 py-3 rounded-2xl border shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl ${bgClass}`}>
      {/* Target handle - input from left */}
      {!isPurchaseOrder && !isInbound && <Handle type="target" position={Position.Left} className="w-3 h-3 border-2 bg-white dark:bg-gray-800 border-gray-400" />}

      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl ${iconClass} shadow-sm`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="flex-1 pb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
            {isCenter ? "MASTER BATCH" : isPurchaseOrder ? "PURCHASE ORDER" : isInbound ? "INBOUND RECEIVING" : "SALES & OUTBOUND"}
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">
            {data.label}
          </div>
          {data.subLabel && (
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {data.subLabel}
            </div>
          )}
          {data.partner && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
               <span className="font-medium text-gray-700 dark:text-gray-300">By/To:</span> {data.partner}
            </div>
          )}
        </div>
      </div>
      
      {data.status && (
        <div className="absolute -top-2.5 -right-2.5 px-2.5 py-0.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold rounded-full shadow-sm ring-2 ring-white dark:ring-gray-800">
          {data.status}
        </div>
      )}

      {/* Source handle - output to right */}
      {!isSales && <Handle type="source" position={Position.Right} className="w-3 h-3 border-2 bg-white dark:bg-gray-800 border-gray-400" />}
    </div>
  );
}
