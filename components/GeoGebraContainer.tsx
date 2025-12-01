import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';

export interface GeoGebraRef {
  loadCommands: (commands: string[]) => void;
  evalCommand: (cmd: string) => void;
  newConstruction: () => void;
  reset: () => void;
  setColor: (objName: string, r: number, g: number, b: number) => void;
  setVisible: (objName: string, visible: boolean) => void;
  setFixed: (objName: string, fixed: boolean) => void;
  setGlobalLineThickness: (thickness: number) => void;
  setGlobalPointSize: (size: number) => void;
}

const GeoGebraContainer = forwardRef<GeoGebraRef>((props, ref) => {
  const containerId = 'ggb-element';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);
  
  useEffect(() => {
    if (initRef.current) return;

    const initApplet = () => {
      if (window.GGBApplet && wrapperRef.current) {
        initRef.current = true;
        // Get dimensions but ensure reasonable defaults
        const initialWidth = wrapperRef.current.clientWidth || 800;
        const initialHeight = wrapperRef.current.clientHeight || 600;

        const params = {
          id: 'ggbApplet',
          appName: '3d',
          width: initialWidth,
          height: initialHeight,
          showToolBar: false, 
          showAlgebraInput: false, 
          showMenuBar: false,
          perspective: "5", // "5" is the code for 3D Graphics ONLY (hides Algebra View)
          borderColor: 'none',
          transparentGraphics: false,
          allowStyleBar: false, // Hide the small style bar inside canvas too for cleaner look
          scaleContainerClass: 'ggb-container',
          allowUpScaling: true,
          showResetIcon: false,
        };

        // @ts-ignore
        const applet = new window.GGBApplet(params, true);
        applet.inject(containerId);

        const checkInterval = setInterval(() => {
            if (window.ggbApplet && typeof window.ggbApplet.evalCommand === 'function') {
                setIsReady(true);
                // CRITICAL FIX: Force resize to match container exactly once ready
                if (wrapperRef.current) {
                  const w = Math.floor(wrapperRef.current.clientWidth);
                  const h = Math.floor(wrapperRef.current.clientHeight);
                  window.ggbApplet.setSize(w, h);
                }
                clearInterval(checkInterval);
            }
        }, 300);
      }
    };

    if (window.GGBApplet) {
      initApplet();
    } else {
      const listener = () => initApplet();
      window.addEventListener('load', listener);
      return () => window.removeEventListener('load', listener);
    }
  }, []);

  // Robust Resize Observer
  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use Math.floor to prevent sub-pixel rendering causing scrollbars
        const width = Math.floor(entry.contentRect.width);
        const height = Math.floor(entry.contentRect.height);
        
        if (window.ggbApplet && typeof window.ggbApplet.setSize === 'function') {
          // Only update if dimensions are valid
          if (width > 0 && height > 0) {
            window.ggbApplet.setSize(width, height);
          }
        }
      }
    });
    
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    loadCommands: (commands: string[]) => {
      const applet = window.ggbApplet;
      if (!applet) {
        alert("GeoGebra is loading. Please wait.");
        return;
      }
      try {
        applet.newConstruction();
        applet.setPerspective("5"); // Enforce 3D View Only
        commands.forEach(cmd => {
          if (cmd && !cmd.startsWith('//')) {
             applet.evalCommand(cmd);
          }
        });
      } catch (e) {
        console.error("Error executing GeoGebra commands", e);
      }
    },
    evalCommand: (cmd: string) => window.ggbApplet?.evalCommand(cmd),
    newConstruction: () => window.ggbApplet?.newConstruction(),
    reset: () => window.ggbApplet?.reset(),
    setColor: (objName: string, r: number, g: number, b: number) => {
      if (window.ggbApplet?.exists(objName)) window.ggbApplet.setColor(objName, r, g, b);
    },
    setVisible: (objName: string, visible: boolean) => {
      if (window.ggbApplet?.exists(objName)) window.ggbApplet.setVisible(objName, visible);
    },
    setFixed: (objName: string, fixed: boolean) => {
      if (window.ggbApplet?.exists(objName)) window.ggbApplet.setFixed(objName, fixed, true);
    },
    setGlobalLineThickness: (thickness: number) => {
      const applet = window.ggbApplet;
      if (!applet) return;
      
      const allObjs = applet.getAllObjectNames();
      allObjs.forEach(obj => {
        const type = applet.getObjectType(obj);
        // Apply to segments, lines, vectors, and polyhedrons (edges)
        if (['segment', 'line', 'ray', 'vector', 'polygon', 'polyhedron'].includes(type)) {
          applet.setLineThickness(obj, thickness);
        }
      });
    },
    setGlobalPointSize: (size: number) => {
      const applet = window.ggbApplet;
      if (!applet) return;
      
      const allObjs = applet.getAllObjectNames();
      allObjs.forEach(obj => {
        const type = applet.getObjectType(obj);
        if (type === 'point') {
          applet.setPointSize(obj, size);
        }
      });
    }
  }));

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-white dark:bg-[#0f172a] overflow-hidden group">
      <div id={containerId} className="w-full h-full"></div>
      
      {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] z-20 gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                 Loading Engine...
              </div>
          </div>
      )}
      
      {/* Ready Indicator Overlay */}
      {isReady && (
        <div className="absolute bottom-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
           <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-slate-500 font-mono border border-slate-200 dark:border-slate-700 shadow-sm">
             GGB Active
           </div>
        </div>
      )}
    </div>
  );
});

GeoGebraContainer.displayName = 'GeoGebraContainer';

export default GeoGebraContainer;