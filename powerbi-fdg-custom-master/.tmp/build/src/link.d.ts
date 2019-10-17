import { Node } from './node';
import * as d3 from "d3";
export declare class Link implements d3.SimulationLinkDatum<Node> {
    index?: number;
    source: Node;
    target: Node;
    kop: string;
    group: number;
    constructor(source: any, target: any, kop: any, isBranch: any, group: any);
    readonly color: any;
}
