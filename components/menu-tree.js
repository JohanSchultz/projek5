"use client";

import Link from "next/link";
import { useState } from "react";

const MENU_TREE = [
  {
    id: "admin",
    label: "Admin",
    children: [
      { id: "buildings", label: "Buildings" },
      { id: "technicians", label: "Technicians", href: "/technicians" },
    ],
  },
  {
    id: "function",
    label: "Function",
    children: [
      { id: "repairs", label: "Repairs" },
      { id: "assessment", label: "Assessment", href: "/photos" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    children: [{ id: "problem-status", label: "Problem Status" }],
  },
];

function Chevron({ expanded }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
        expanded ? "rotate-90" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TreeNode({ node, depth = 0, expandedNodes, toggleNode, selectedId, onSelect }) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          onClick={() => toggleNode(node.id)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          aria-expanded={isExpanded}
        >
          <Chevron expanded={isExpanded} />
          <span>{node.label}</span>
        </button>

        {isExpanded ? (
          <ul className="space-y-1">
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const className = `block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
    isSelected
      ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
  }`;

  const style = { paddingLeft: `${depth * 16 + 36}px` };

  if (node.href) {
    return (
      <li>
        <Link href={node.href} className={className} style={style}>
          {node.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={className}
        style={style}
        aria-current={isSelected ? "page" : undefined}
      >
        {node.label}
      </button>
    </li>
  );
}

export default function MenuTree() {
  const [expandedNodes, setExpandedNodes] = useState(
    () => new Set(MENU_TREE.map((node) => node.id))
  );
  const [selectedId, setSelectedId] = useState(null);

  function toggleNode(id) {
    setExpandedNodes((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <nav aria-label="Application menu">
      <ul className="space-y-1">
        {MENU_TREE.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </ul>
    </nav>
  );
}
