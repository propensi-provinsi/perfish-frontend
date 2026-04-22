"use client";

import { useMemo, useState } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Edge,
  Node,
  MarkerType
} from "@xyflow/react";
import { FiDownload, FiUpload, FiBox, FiTrendingUp, FiX, FiExternalLink } from "react-icons/fi";
import '@xyflow/react/dist/style.css';
import { CustomNode, CustomNodeData } from "./CustomNode";
import type { BatchTraceabilityResponse } from "@/types/batch";

const nodeTypes = {
  customNode: CustomNode,
};

interface TraceabilityGraphProps {
  data: BatchTraceabilityResponse;
}

export default function TraceabilityGraph({ data }: TraceabilityGraphProps) {
  
  const initialNodes = useMemo(() => {
    const nodes: Node<CustomNodeData>[] = [];
    const X_SPACING = 350;
    const Y_SPACING = 150;

    // 1. Center Node (Master Batch)
    nodes.push({
      id: "center-batch",
      type: "customNode",
      position: { x: X_SPACING, y: 150 }, // Fixed vertical center
      data: {
        label: data.batchDetails.batchNumber,
        type: "CENTER_BATCH" as const,
        subLabel: `${data.batchDetails.fishSpeciesName} • ${data.batchDetails.currentQuantity} ${data.batchDetails.unit}`,
        status: data.batchDetails.status
      }
    });

    // 2. Upstream Nodes (Inbound)
    data.upstream.forEach((up, index) => {
      nodes.push({
        id: `up-${up.id}`,
        type: "customNode",
        position: { x: 0, y: index * Y_SPACING + 50 },
        data: {
          label: up.referenceNo,
          type: "INBOUND_RECEIPT" as const,
          subLabel: `${up.date || '-'} • ${up.quantityStr}`,
          partner: up.partnerName,
          status: up.status,
        }
      });
    });

    // 3. Downstream Nodes (Sales Allocation)
    data.downstream.forEach((down, index) => {
      nodes.push({
        id: `down-${down.id}`,
        type: "customNode",
        position: { x: X_SPACING * 2, y: index * Y_SPACING + 50 },
        data: {
          label: down.referenceNo,
          type: "SALES_ALLOCATION" as const,
          subLabel: `${down.date || '-'} • ${down.quantityStr}`,
          partner: down.partnerName,
          status: down.status,
        }
      });
    });

    return nodes;
  }, [data]);

  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];
    const edgeStyle = { strokeWidth: 2, stroke: '#9ca3af' };
    const markerEnd = { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#9ca3af' };

    data.upstream.forEach((up) => {
      edges.push({
        id: `e-up-${up.id}`,
        source: `up-${up.id}`,
        target: "center-batch",
        type: "smoothstep",
        animated: true,
        style: edgeStyle,
        markerEnd
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
        markerEnd
      });
    });

    return edges;
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', display: 'block', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedNode(node as Node<CustomNodeData>)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-slate-50 dark:bg-gray-900/30"
      >
        <Background color="#cbd5e1" gap={24} size={2} />
        <Controls className="bg-white dark:bg-gray-800 shadow-md border-0 rounded-lg overflow-hidden" />
      </ReactFlow>

      {/* SIDE DRAWER FOR NODE DETAILS */}
      {selectedNode && (
        <>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedNode(null)}
          />
          {/* Drawer Panel */}
          <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 flex flex-col border-l border-gray-100 dark:border-gray-700 animate-in slide-in-from-right-full duration-300">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                {selectedNode.data.type === "CENTER_BATCH" ? <FiTrendingUp className="text-blue-500"/> : 
                 selectedNode.data.type === "INBOUND_RECEIPT" ? <FiDownload className="text-emerald-500"/> : 
                 <FiUpload className="text-orange-500"/>}
                Detail Informasi Node
              </h3>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Tipe Entitas</label>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {selectedNode.data.type.replace('_', ' ')}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Referensi ID / Kode</label>
                <div className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {selectedNode.data.label}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Deskripsi / Spesies & Qty</label>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {selectedNode.data.subLabel || '-'}
                </div>
              </div>

              {selectedNode.data.partner && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                    {selectedNode.data.type === "INBOUND_RECEIPT" ? "Supplier" : "Customer / Tujuan"}
                  </label>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {selectedNode.data.partner}
                  </div>
                </div>
              )}

              {selectedNode.data.status && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Status Terakhir</label>
                  <div className="text-sm font-bold px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded inline-block">
                    {selectedNode.data.status}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              {selectedNode.data.type === "INBOUND_RECEIPT" && (
                <a 
                  href={`/inbound/receipt/${selectedNode.id.replace('up-', '')}`}
                  className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-emerald-500 text-emerald-600 dark:border-emerald-600 dark:text-emerald-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-sm"
                >
                  Lihat Detail Inbound <FiExternalLink />
                </a>
              )}
              {selectedNode.data.type === "SALES_ALLOCATION" && (
                <button 
                  disabled
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  Detail Sales Order (Coming Soon)
                </button>
              )}
              {selectedNode.data.type === "CENTER_BATCH" && (
                <a 
                  href={`/master-data/batch`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-500/20"
                >
                  Ke Master Data Batch <FiExternalLink />
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
