import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Button, Tooltip, Popover, Input, Divider } from 'antd';
import {
  MousePointer2,
  Type,
  Image as ImageIcon,
  Minus,
  ArrowRight,
  Square,
  Circle as CircleIcon,
  Dot,
  Hexagon,
  Pencil,
  Eraser,
  Scan,
  Undo2,
  Redo2,
  Trash2
} from 'lucide-react';
import { useTestStore } from '../store/testStore';

interface DrawingCanvasProps {
  value?: string;
  onChange: (base64: string) => void;
  readOnly?: boolean;
}

type Mode = 'select' | 'text' | 'image' | 'line' | 'arrow' | 'rect' | 'circle' | 'dot' | 'polygon' | 'pencil' | 'eraser' | 'marquee';

const COLORS = [
  '#000000', '#404040', '#ffffff', '#ff4c4c', '#ff9900', '#ffcc00', '#99cc00', '#00cc00', '#00cccc', '#0099ff', '#9966ff', '#ff66ff',
  '#22194D', '#808080', '#cccccc', '#cc0000', '#cc6600', '#cc9900', '#669900', '#009900', '#009999', '#0066cc', '#6633cc', '#cc33cc'
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ value, onChange, readOnly = false }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';
  const [mode, setMode] = useState<Mode>('pencil');
  const [color, setColor] = useState(isDark ? '#ffffff' : '#000000');
  const [brushSize] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  // Sync default color on theme switch
  useEffect(() => {
    setColor(prev => {
      if (prev === '#000000' && isDark) return '#ffffff';
      if (prev === '#ffffff' && !isDark) return '#000000';
      return prev;
    });
  }, [isDark]);

  // Sync canvas background on theme switch
  useEffect(() => {
    if (canvas) {
      canvas.backgroundColor = isDark ? '#1a1a2e' : '#ffffff';
      canvas.requestRenderAll();
    }
  }, [isDark, canvas]);

  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUpdatingHistory = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    // Clear any previous canvas injections (solves React Strict Mode async dispose conflicts)
    wrapperRef.current.innerHTML = '';
    const canvasEl = document.createElement('canvas');
    canvasEl.className = 'absolute inset-0';
    wrapperRef.current.appendChild(canvasEl);

    let initCanvas: fabric.Canvas;
    try {
        initCanvas = new fabric.Canvas(canvasEl, {
          isDrawingMode: !readOnly && mode === 'pencil',
          width: wrapperRef.current.clientWidth || 600,
          height: 400,
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          selection: mode === 'marquee' || mode === 'select'
        });
    } catch (e) {
        console.warn('Canvas init skipped or failed:', e);
        return;
    }

    if (!initCanvas.freeDrawingBrush) {
      initCanvas.freeDrawingBrush = new fabric.PencilBrush(initCanvas);
    }
    if (initCanvas.freeDrawingBrush) {
      initCanvas.freeDrawingBrush.color = color;
      initCanvas.freeDrawingBrush.width = brushSize;
    }

    if (value) {
      isUpdatingHistory.current = true;
      try {
          let stateToLoad = value;
          if (value.startsWith('{')) {
              const parsed = JSON.parse(value);
              if (parsed.state) {
                  stateToLoad = JSON.stringify(parsed.state);
              }
          }
          initCanvas.loadFromJSON(stateToLoad).then(() => {
              initCanvas.renderAll();
              isUpdatingHistory.current = false;
              const json = JSON.stringify(initCanvas.toJSON());
              setHistory([json]);
              setHistoryIndex(0);
          });
      } catch (e) {
          if (value.startsWith('data:image')) {
              // Legacy base64 fallback
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((fabric as any).FabricImage) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (fabric as any).FabricImage.fromURL(value).then((img: any) => {
                      initCanvas.add(img);
                      initCanvas.renderAll();
                      isUpdatingHistory.current = false;
                      setHistory([JSON.stringify(initCanvas.toJSON())]);
                      setHistoryIndex(0);
                  });
              } else if (fabric.Image.fromURL) {
                  // @ts-ignore - legacy signature for older fabric versions
                  fabric.Image.fromURL(value, (img: any) => {
                      initCanvas.add(img);
                      initCanvas.renderAll();
                      isUpdatingHistory.current = false;
                      setHistory([JSON.stringify(initCanvas.toJSON())]);
                      setHistoryIndex(0);
                  });
              }
          } else {
              isUpdatingHistory.current = false;
              setHistory([JSON.stringify(initCanvas.toJSON())]);
              setHistoryIndex(0);
          }
      }
    } else {
        const json = JSON.stringify(initCanvas.toJSON());
        setHistory([json]);
        setHistoryIndex(0);
    }

    setCanvas(initCanvas);

    const handleResize = () => {
      if (wrapperRef.current && initCanvas) {
        initCanvas.setDimensions({ width: wrapperRef.current.clientWidth, height: 400 });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (initCanvas) {
         initCanvas.dispose().catch(console.error);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const saveState = useCallback((c: fabric.Canvas) => {
    if (readOnly || isUpdatingHistory.current) return;
    const base64 = c.toDataURL({ format: 'png', multiplier: 1 });
    const jsonState = c.toJSON();
    
    onChangeRef.current(JSON.stringify({ state: jsonState, base64 }));

    const json = JSON.stringify(jsonState);
    setHistory(prev => {
      // slice history in case we undo and then draw again
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, readOnly]);

  useEffect(() => {
    if (!canvas) return;

    const onPathCreated = () => saveState(canvas);
    const onObjectModified = () => saveState(canvas);

    canvas.on('path:created', onPathCreated);
    canvas.on('object:modified', onObjectModified);

    return () => {
      canvas.off('path:created', onPathCreated);
      canvas.off('object:modified', onObjectModified);
    };
  }, [canvas, saveState]);

  // Handle Mode changes
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = mode === 'pencil';
    canvas.selection = mode === 'marquee' || mode === 'select';
    
    if (mode === 'pencil' && !canvas.freeDrawingBrush) {
       canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    
    if (canvas.freeDrawingBrush) {
       canvas.freeDrawingBrush.color = color;
       canvas.freeDrawingBrush.width = brushSize;
    }

    canvas.getObjects().forEach(obj => {
       obj.selectable = mode === 'select' || mode === 'marquee';
       obj.evented = mode === 'select' || mode === 'marquee' || mode === 'eraser';
    });
    
    if (mode !== 'select' && mode !== 'marquee') {
       canvas.discardActiveObject();
       canvas.requestRenderAll();
    }
  }, [mode, canvas, color, brushSize]);

  // Drawing Shape Logic
  useEffect(() => {
    if (!canvas || readOnly) return;

    let isDrawingShape = false;
    let startX = 0;
    let startY = 0;
    let currentShape: fabric.Object | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMouseDown = (o: any) => {
      if (mode === 'select' || mode === 'marquee' || mode === 'pencil') return;

      const pointer = canvas.getViewportPoint(o.e);
      startX = pointer.x;
      startY = pointer.y;

      if (mode === 'eraser') {
          if (o.target) {
              canvas.remove(o.target);
              saveState(canvas);
          }
          return;
      }

      if (mode === 'text') {
        const text = new fabric.IText('Text', {
            left: startX,
            top: startY,
            fill: color,
            fontSize: 20,
            fontFamily: 'sans-serif'
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        setMode('select');
        saveState(canvas);
        return;
      }

      isDrawingShape = true;

      // The new instances
      if (mode === 'rect') {
          currentShape = new fabric.Rect({
              left: startX, top: startY, originX: 'left', originY: 'top',
              width: 0, height: 0, fill: 'transparent', stroke: color, strokeWidth: brushSize, selectable: false
          });
          canvas.add(currentShape);
      } else if (mode === 'circle') {
          currentShape = new fabric.Circle({
              left: startX, top: startY, originX: 'center', originY: 'center',
              radius: 0, fill: 'transparent', stroke: color, strokeWidth: brushSize, selectable: false
          });
          canvas.add(currentShape);
      } else if (mode === 'line') {
          currentShape = new fabric.Line([startX, startY, startX, startY], {
              stroke: color, strokeWidth: brushSize, selectable: false
          });
          canvas.add(currentShape);
      } else if (mode === 'dot') {
          currentShape = new fabric.Circle({
              left: startX, top: startY, originX: 'center', originY: 'center',
              radius: brushSize * 2, fill: color, selectable: false
          });
          canvas.add(currentShape);
          isDrawingShape = false;
          saveState(canvas);
      } else if (mode === 'polygon') {
          const radius = 30;
          const points = [];
          for (let i = 0; i < 6; i++) {
             points.push({ x: startX + radius * Math.cos(i * Math.PI / 3), y: startY + radius * Math.sin(i * Math.PI / 3) });
          }
          currentShape = new fabric.Polygon(points, {
             left: startX, top: startY, fill: 'transparent', stroke: color, strokeWidth: brushSize, selectable: false, originX: 'center', originY: 'center'
          });
          canvas.add(currentShape);
          isDrawingShape = false;
          saveState(canvas);
      } else if (mode === 'arrow') {
          currentShape = new fabric.Path(`M ${startX} ${startY} L ${startX} ${startY}`, {
              stroke: color, strokeWidth: brushSize, fill: 'transparent', selectable: false
          });
          canvas.add(currentShape);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMouseMove = (o: any) => {
      if (!isDrawingShape || !currentShape) return;
      const pointer = canvas.getViewportPoint(o.e);

      if (mode === 'rect') {
          const rect = currentShape as fabric.Rect;
          rect.set({ width: Math.abs(pointer.x - startX), height: Math.abs(pointer.y - startY) });
          rect.set({ left: Math.min(pointer.x, startX), top: Math.min(pointer.y, startY) });
      } else if (mode === 'circle') {
          const circle = currentShape as fabric.Circle;
          const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2;
          circle.set({ radius });
          circle.set({ left: startX + (pointer.x - startX) / 2, top: startY + (pointer.y - startY) / 2 });
      } else if (mode === 'line') {
          const line = currentShape as fabric.Line;
          line.set({ x2: pointer.x, y2: pointer.y });
      } else if (mode === 'arrow') {
          const path = currentShape as fabric.Path;
          const headlen = 15;
          const dx = pointer.x - startX;
          const dy = pointer.y - startY;
          const angle = Math.atan2(dy, dx);
          
          const pathStr = `M ${startX} ${startY} L ${pointer.x} ${pointer.y} M ${pointer.x - headlen * Math.cos(angle - Math.PI / 6)} ${pointer.y - headlen * Math.sin(angle - Math.PI / 6)} L ${pointer.x} ${pointer.y} L ${pointer.x - headlen * Math.cos(angle + Math.PI / 6)} ${pointer.y - headlen * Math.sin(angle + Math.PI / 6)}`;
          
          canvas.remove(path);
          currentShape = new fabric.Path(pathStr, {
              stroke: color, strokeWidth: brushSize, fill: 'transparent', selectable: false,
              strokeLineCap: 'round', strokeLineJoin: 'round'
          });
          canvas.add(currentShape);
      }

      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (isDrawingShape) {
          if (currentShape) {
             currentShape.set({ selectable: true });
             currentShape.setCoords();
          }
          isDrawingShape = false;
          currentShape = null;
          saveState(canvas);
      }
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [canvas, mode, color, brushSize, readOnly, saveState]);

  // Keyboard action for Deleting Objects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas || readOnly || (e.key !== 'Delete' && e.key !== 'Backspace')) return;
      if (canvas.getActiveObject() instanceof fabric.IText && (canvas.getActiveObject() as fabric.IText).isEditing) return;

      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        canvas.discardActiveObject();
        activeObjects.forEach(obj => canvas.remove(obj));
        saveState(canvas);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, readOnly, saveState]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
       const data = f.target?.result as string;
       
       // Handle fabric 6/7 difference or legacy Image.fromURL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
       if ((fabric as any).FabricImage) {
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           (fabric as any).FabricImage.fromURL(data).then((img: any) => {
                img.scaleToWidth(200);
                img.set({ left: 100, top: 100 });
                canvas.add(img);
                canvas.setActiveObject(img);
                saveState(canvas);
                setMode('select');
           });
       } else if (fabric.Image.fromURL) {
           fabric.Image.fromURL(data).then((img: fabric.Image) => {
               img.scaleToWidth(200);
               img.set({ left: 100, top: 100 });
               canvas.add(img);
               canvas.setActiveObject(img);
               saveState(canvas);
               setMode('select');
           });
       }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    isUpdatingHistory.current = true;
    canvas.loadFromJSON(history[newIdx]).then(() => {
        canvas.renderAll();
        setHistoryIndex(newIdx);
        isUpdatingHistory.current = false;
        onChangeRef.current(canvas.toDataURL({ format: 'png', multiplier: 1 }));
    });
  };

  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    isUpdatingHistory.current = true;
    canvas.loadFromJSON(history[newIdx]).then(() => {
        canvas.renderAll();
        setHistoryIndex(newIdx);
        isUpdatingHistory.current = false;
        onChangeRef.current(canvas.toDataURL({ format: 'png', multiplier: 1 }));
    });
  };

  const handleDelete = () => {
      if (!canvas) return;
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        canvas.discardActiveObject();
        activeObjects.forEach(obj => canvas.remove(obj));
        saveState(canvas);
      } else {
        canvas.clear();
        canvas.backgroundColor = isDark ? '#1a1a2e' : '#ffffff';
        saveState(canvas);
      }
  };

  const toolButtonProps = (m: Mode): import('antd').ButtonProps => ({
    type: mode === m ? 'primary' : 'text',
    onClick: () => setMode(m),
    className: `flex items-center justify-center w-8 h-8 p-0 rounded-md ${mode === m ? 'bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30' : (isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-black/5')}`
  });

  const ColorGrid = () => (
    <div className={`w-64 p-2 rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-6 gap-2 mb-4">
             {COLORS.map(c => (
                 <div 
                    key={c} 
                    className="w-8 h-8 rounded cursor-pointer border hover:scale-110 transition-transform" 
                    style={{ backgroundColor: c, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    onClick={() => setColor(c)}
                 />
             ))}
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded border shrink-0`} style={{ backgroundColor: color, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className={`flex-1 text-sm ${isDark ? 'bg-[#1a1a2e] text-white border-gray-700' : 'bg-white text-black'}`} />
        </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={wrapperRef} 
        className={`w-full border rounded-2xl overflow-hidden shadow-sm mt-4 relative ${isDark ? 'bg-[#1a1a2e] border-[#333]' : 'bg-white border-gray-200'}`} 
        style={{ minHeight: '400px' }}
      >
      </div>

      {!readOnly && (
        <div className={`mt-6 p-2 flex flex-wrap items-center justify-center gap-1.5 border rounded-2xl shadow-xl transition-all w-fit max-w-full ${isDark ? 'bg-[#1f1f38] border-[#333]' : 'bg-white border-gray-200'}`}>
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
          
          <Tooltip title="Select"><Button {...toolButtonProps('select')} icon={<MousePointer2 className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Text"><Button {...toolButtonProps('text')} icon={<Type className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Image"><Button {...toolButtonProps('image')} icon={<ImageIcon className="w-4 h-4" />} onClick={() => { setMode('image'); fileInputRef.current?.click(); }} /></Tooltip>
          
          <Divider type="vertical" className="h-6" />
          
          <Tooltip title="Line"><Button {...toolButtonProps('line')} icon={<Minus className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Arrow"><Button {...toolButtonProps('arrow')} icon={<ArrowRight className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Rectangle"><Button {...toolButtonProps('rect')} icon={<Square className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Circle"><Button {...toolButtonProps('circle')} icon={<CircleIcon className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Dot"><Button {...toolButtonProps('dot')} icon={<Dot className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Polygon"><Button {...toolButtonProps('polygon')} icon={<Hexagon className="w-4 h-4" />} /></Tooltip>
          
          <Divider type="vertical" className="h-6" />
          
          <Tooltip title="Pencil / Draw"><Button {...toolButtonProps('pencil')} icon={<Pencil className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Eraser"><Button {...toolButtonProps('eraser')} icon={<Eraser className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Marquee Select"><Button {...toolButtonProps('marquee')} icon={<Scan className="w-4 h-4" />} /></Tooltip>
          
          <Divider type="vertical" className="h-6" />
          
          <Tooltip title="Undo"><Button type="text" className="w-8 h-8 p-0 flex justify-center items-center text-gray-500 hover:text-indigo-400 disabled:opacity-30" disabled={historyIndex <= 0} onClick={handleUndo} icon={<Undo2 className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Redo"><Button type="text" className="w-8 h-8 p-0 flex justify-center items-center text-gray-500 hover:text-indigo-400 disabled:opacity-30" disabled={historyIndex >= history.length - 1} onClick={handleRedo} icon={<Redo2 className="w-4 h-4" />} /></Tooltip>
          <Tooltip title="Delete Selected / Clear"><Button type="text" className="w-8 h-8 p-0 flex justify-center items-center text-gray-500 hover:text-red-500 transition-colors" onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />} /></Tooltip>

          <Divider type="vertical" className="h-6" />

          <Popover content={<ColorGrid />} trigger="click" placement="topLeft" overlayInnerStyle={{ padding: 0, borderRadius: '0.5rem' }}>
            <Button className={`w-8 h-8 p-0 border flex justify-center items-center rounded-md cursor-pointer hover:scale-105 transition-transform ml-1 shadow-inner ${isDark ? 'border-white/10' : 'border-black/10'}`} style={{ backgroundColor: color }}>
                <span className="sr-only">Color Picker</span>
            </Button>
          </Popover>
        </div>
      )}
    </div>
  );
};
