import React, { useRef } from 'react';
import Draggable from 'react-draggable';

interface DraggableWrapperProps {
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  handle?: string;
  className?: string;
}

export const DraggableWrapper: React.FC<DraggableWrapperProps> = ({ 
  children, 
  defaultPosition, 
  handle,
  className = "absolute z-50"
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={defaultPosition}
      handle={handle}
      bounds="parent"
    >
      <div ref={nodeRef} className={className}>
        {children}
      </div>
    </Draggable>
  );
};
