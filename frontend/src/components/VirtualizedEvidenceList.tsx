import React, { useMemo, useState, useEffect } from "react";
import type { EvidenceMetadata } from "@/types/evidence";
import type { FixedSizeListProps } from '@/types/common';

interface Props {
  items: EvidenceMetadata[];
  rowHeight?: number;
  renderItem: (item: EvidenceMetadata, index: number) => React.ReactNode;
  height?: number;
}

export default function VirtualizedEvidenceList({
  items,
  rowHeight = 96,
  renderItem,
  height = 600,
}: Props) {
  const [hasWindowLib, setHasWindowLib] = useState(false);
  const [FixedSizeList, setFixedSizeList] =
    useState<React.ComponentType<FixedSizeListProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    import("react-window")
      .then((mod) => {
        if (mounted) {
          setFixedSizeList(() => mod.FixedSizeList);
          setHasWindowLib(true);
        }
      })
      .catch(() => {
        // react-window not available — fallback to simple list
        setHasWindowLib(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const itemData = useMemo(() => items, [items]);

  if (hasWindowLib && FixedSizeList) {
    const List = FixedSizeList;
    return (
      <List
        height={Math.min(height, items.length * rowHeight)}
        itemCount={items.length}
        itemSize={rowHeight}
        width="100%"
        itemData={itemData}
      >
        {({ index, style }: { index: number; style: React.CSSProperties }) => (
          <div style={style} key={itemData[index].id}>
            {renderItem(itemData[index], index)}
          </div>
        )}
      </List>
    );
  }

  // Fallback: regular grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((it, i) => (
        <div key={it.id}>{renderItem(it, i)}</div>
      ))}
    </div>
  );
}
