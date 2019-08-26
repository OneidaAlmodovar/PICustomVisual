import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.extensibility.ISelectionId;
export declare class Node implements d3.SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    name: string;
    lvl: string;
    linkCount: number;
    selectionId: ISelectionId;
    isBranch: boolean;
    func: Array<string>;
    scale: number;
    constructor(name: any, lvl: any, selectionId: any, branch: any, func: any);
    normal: () => number;
    r(scale: any): number;
    readonly fontSize: string;
    readonly color: string;
}
