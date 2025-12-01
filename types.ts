// Structure for a 3D Point
export interface Point3D {
  name: string;
  coords: [number, number, number];
}

// Structure for the parsed result returned by the generator
export interface GeoGebraConstruction {
  points: Point3D[];
  segments: [string, string][]; // Array of point name pairs, e.g., ["A", "B"]
  rawCommands: string[]; // The actual commands sent to GGB
  description: string; // Brief description of what was detected
}

// Global window augmentation for GeoGebra
declare global {
  interface Window {
    GGBApplet: any;
    // The API object exposed by GeoGebra
    ggbApplet: {
      // Core Creation & Control
      evalCommand: (cmdString: string) => boolean;
      reset: () => void;
      newConstruction: () => void;

      // Object Property Setters
      setCoords: (objName: string, x: number, y: number, z?: number) => void; // Extended for 3D support
      setValue: (objName: string, value: number) => void;
      setVisible: (objName: string, visible: boolean) => void;
      setColor: (objName: string, r: number, g: number, b: number) => void;
      setFixed: (objName: string, fixed: boolean, selectionAllowed: boolean) => void;
      setLineThickness: (objName: string, thickness: number) => void;
      setPointSize: (objName: string, size: number) => void;
      
      // Data Retrieval
      getAllObjectNames: () => string[];
      getObjectType: (objName: string) => string;

      // Additional useful methods often available
      setPerspective: (p: string) => void;
      deleteObject: (objName: string) => void;
      renameObject: (oldName: string, newName: string) => boolean;
      exists: (objName: string) => boolean;
      setSize: (width: number, height: number) => void;
    };
  }
}