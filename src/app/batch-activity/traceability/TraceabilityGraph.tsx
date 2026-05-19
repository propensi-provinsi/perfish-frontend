"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  Node,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FiDownload, FiExternalLink, FiTrendingUp, FiUpload, FiX } from "react-icons/fi";
import { CustomNode, CustomNodeData } from "./CustomNode";
import type { BatchTraceabilityResponse } from "@/types/batch";

const nodeTypes = {
  customNode: CustomNode,
};

interface TraceabilityGraphProps {
  data: BatchTraceabilityResponse;
}

function fmt(value: number | string | null | undefined) {
  if (value == null || value === "") return "-";
  return String(value);
}

export default function TraceabilityGraph({ data }: TraceabilityGraphProps) {
  const nodes = useMemo(() => {
    const nodes: Node<CustomNodeData>[] = [];
    const xSpacing = 360;
    const ySpacing = 150;
    const isReceivingGroup = data.traceabilityMode === "RECEIVING_GROUP";

    nodes.push({
      id: "center-batch",
      type: "customNode",
      position: { x: xSpacing, y: 150 },
      data: {
        label: isReceivingGroup
          ? data.receivingGroup?.receiptCode ?? "Kelompok Penerimaan"
          : data.batchDetails?.batchNumber ?? "Batch",
        type: "CENTER_BATCH" as const,
        subLabel: isReceivingGroup
          ? `${data.receivingGroup?.supplierName ?? "-"} - ${data.receivingGroup?.batchCount ?? 0} batch - ${fmt(data.receivingGroup?.currentQuantityKg)} KG`
          : `${data.batchDetails?.fishSpeciesName ?? "-"} - ${fmt(data.batchDetails?.currentQuantity)} ${data.batchDetails?.unit ?? "KG"}`,
        status: isReceivingGroup ? data.receivingGroup?.status ?? undefined : data.batchDetails?.status,
      },
    });

    data.upstream.forEach((up, index) => {
      nodes.push({
        id: `up-${up.id}`,
        type: "customNode",
        position: { x: 0, y: index * ySpacing + 50 },
        data: {
          label: up.referenceNo,
          type: up.nodeType === "PURCHASE_ORDER" ? "PURCHASE_ORDER" as const : "INBOUND_RECEIPT" as const,
          subLabel: `${up.nodeType} - ${up.date || "-"} - ${up.quantityStr}`,
          partner: up.partnerName,
          status: up.status,
        },
      });
    });

    data.downstream.forEach((down, index) => {
      nodes.push({
        id: `down-${down.id}`,
        type: "customNode",
        position: { x: xSpacing * 2, y: index * ySpacing + 50 },
        data: {
          label: down.referenceNo,
          type: "SALES_ALLOCATION" as const,
          subLabel: `${down.nodeType} - ${down.date || "-"} - ${down.quantityStr}`,
          partner: down.partnerName,
          status: down.status,
        },
      });
    });

    return nodes;
  }, [data]);

  const edges = useMemo(() => {
    const edges: Edge[] = [];
    const edgeStyle = { strokeWidth: 2, stroke: "#9ca3af" };
    const markerEnd = { type: MarkerType.ArrowClosed, width: 20, height: 20, color: "#9ca3af" };

    data.upstream.forEach((up) => {
      edges.push({
        id: `e-up-${up.id}`,
        source: `up-${up.id}`,
        target: "center-batch",
        type: "smoothstep",
        animated: true,
        style: edgeStyle,
        markerEnd,
      });
    });

    data.downstream.forEach((down) => {
      edges.push({
        id: `e-down-${down.id}`,
        source: "center-batch",
        target: `down-${down.id}`,
        type: "smoothstep",
        animated: true,
        style: edgeStyle,
        markerEnd,
      });
    });

    return edges;
  }, [data]);

  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "600px", display: "block", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => setSelectedNode(node as Node<CustomNodeData>)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-slate-50 dark:bg-gray-900/30"
      >
        <Background color="#cbd5e1" gap={24} size={2} />
        <Controls className="overflow-hidden rounded-lg border-0 bg-white shadow-md dark:bg-gray-800" />
      </ReactFlow>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 max-h-[46%] w-[430px] max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {data.traceabilityMode === "RECEIVING_GROUP" ? "Ringkasan Kelompok Penerimaan" : "Komposisi & Lineage Batch"}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data.traceabilityMode === "RECEIVING_GROUP"
              ? `${data.childBatches?.length ?? 0} batch/kandang macan dalam kelompok ini`
              : `${data.composition?.length ?? 0} komponen basket/SKU`}
          </p>
        </div>
        <div className="max-h-64 overflow-auto p-4 text-xs text-gray-700 dark:text-gray-200">
          {data.traceabilityMode === "RECEIVING_GROUP" ? (
            <div className="space-y-2">
              {(data.childBatches ?? []).slice(0, 8).map((b) => (
                <div key={b.batchId} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <span className="font-mono font-semibold">{b.batchNumber}</span>
                  <span>{b.fishSpeciesName}</span>
                  <span className="tabular-nums">{b.currentQuantity} {b.unit}</span>
                </div>
              ))}
              {(data.childBatches?.length ?? 0) > 8 && (
                <p className="text-gray-500">+{(data.childBatches?.length ?? 0) - 8} batch lainnya</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(data.composition ?? []).map((item, idx) => (
                <div key={`${item.weighingLogId ?? idx}-${idx}`} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">{item.fishSkuCode ?? item.gradeCode ?? "Komponen"}</span>
                    <span className="tabular-nums">{item.netKg ?? "-"} kg</span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    Basket {item.basketNo ?? "-"} - Grade {item.gradeName ?? item.gradeCode ?? "-"} - Size {item.itemSize ?? "-"}
                    {item.rejectBasket ? " - Reject basket" : ""}
                  </div>
                </div>
              ))}
              {(data.mergeLineage?.length ?? 0) > 0 && (
                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Merge lineage</p>
                  {data.mergeLineage?.map((lineage) => (
                    <div key={lineage.lineageId} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      {lineage.donorBatchNumber} -&gt; {lineage.survivorBatchNumber} ({lineage.transferredQtyKg ?? "-"} kg)
                    </div>
                  ))}
                </div>
              )}
              {(data.batchTimeline?.length ?? 0) > 0 && (
                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Timeline operasional</p>
                  <div className="space-y-2">
                    {data.batchTimeline?.slice(-5).map((item, idx) => (
                      <div key={`${item.type}-${item.timestamp ?? idx}`} className="rounded-lg bg-blue-50 px-3 py-2 text-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
                        <div className="font-semibold">{item.title}</div>
                        <div className="mt-1 text-[11px]">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedNode && (
        <>
          <div
            className="absolute inset-0 z-40 bg-gray-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedNode(null)}
          />
          <div className="absolute right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-gray-100 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-right-full duration-300 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                {selectedNode.data.type === "CENTER_BATCH" ? (
                  <FiTrendingUp className="text-blue-500" />
                ) : selectedNode.data.type === "INBOUND_RECEIPT" ? (
                  <FiDownload className="text-emerald-500" />
                ) : (
                  <FiUpload className="text-orange-500" />
                )}
                Detail Node
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Tipe Entitas</label>
                <div className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {selectedNode.data.type.replace("_", " ")}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Referensi</label>
                <div className="text-lg font-extrabold text-gray-900 dark:text-white">{selectedNode.data.label}</div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Deskripsi</label>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{selectedNode.data.subLabel || "-"}</div>
              </div>

              {selectedNode.data.partner && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Partner</label>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{selectedNode.data.partner}</div>
                </div>
              )}

              {selectedNode.data.status && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Status</label>
                  <div className="inline-block rounded bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {selectedNode.data.status}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/30">
              {selectedNode.data.type === "CENTER_BATCH" && data.traceabilityMode === "BATCH" && (
                <a
                  href="/master-data/batch"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
                >
                  Ke Master Data Batch <FiExternalLink />
                </a>
              )}
              {selectedNode.data.type === "CENTER_BATCH" && data.traceabilityMode === "RECEIVING_GROUP" && (
                <a
                  href="/inbound-ikan"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
                >
                  Ke Dashboard Penerimaan <FiExternalLink />
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
