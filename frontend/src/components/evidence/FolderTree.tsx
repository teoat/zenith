import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Image,
  Film,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
} from "lucide-react";

interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "pdf" | "image" | "video" | "document";
  children?: TreeNode[];
}

const MOCK_TREE: TreeNode[] = [
  {
    id: "1",
    name: "Case #492 - Shell Corp",
    type: "folder",
    children: [
      {
        id: "1a",
        name: "Bank Statements",
        type: "folder",
        children: [
          { id: "1a1", name: "Chase_Oct2023.pdf", type: "pdf" },
          { id: "1a2", name: "Chase_Nov2023.pdf", type: "pdf" },
        ],
      },
      {
        id: "1b",
        name: "Incorporation Docs",
        type: "folder",
        children: [
          { id: "1b1", name: "Articles.pdf", type: "pdf" },
          { id: "1b2", name: "Operating_Agreement.pdf", type: "pdf" },
        ],
      },
      {
        id: "1c",
        name: "Screenshots",
        type: "folder",
        children: [
          { id: "1c1", name: "transaction_screen.png", type: "image" },
          { id: "1c2", name: "login_timestamp.png", type: "image" },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Case #481 - Wire Fraud",
    type: "folder",
    children: [{ id: "2a", name: "Email_Export.pdf", type: "pdf" }],
  },
];

interface FolderTreeItemProps {
  node: TreeNode;
  level: number;
  onSelect: (node: TreeNode) => void;
}

const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  node,
  level,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(level === 0);

  const getIcon = () => {
    if (node.type === "folder") {
      return isOpen ? (
        <FolderOpen size={16} className="text-amber-500" />
      ) : (
        <Folder size={16} className="text-amber-500" />
      );
    }
    if (node.type === "pdf")
      return <FileText size={16} className="text-red-500" />;
    if (node.type === "image")
      return <Image size={16} className="text-blue-500" />;
    if (node.type === "video")
      return <Film size={16} className="text-purple-500" />;
    return <FileText size={16} className="text-slate-400" />;
  };

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.children && node.children.length > 0 ? (
          <span className="w-4 h-4 flex items-center justify-center">
            {isOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}
        {getIcon()}
        <span className="text-sm flex-1 truncate text-slate-700 dark:text-slate-300">
          {node.name}
        </span>
        <button
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          aria-label="More options"
        >
          <MoreHorizontal size={12} className="text-slate-400" />
        </button>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FolderTreeProps {
  onSelect?: (node: TreeNode) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ onSelect = () => {} }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Folder size={16} className="text-amber-500" />
          Case Binders
        </h3>
        <button
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
          aria-label="Add folder"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {MOCK_TREE.map((node) => (
          <FolderTreeItem
            key={node.id}
            node={node}
            level={0}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTree;
