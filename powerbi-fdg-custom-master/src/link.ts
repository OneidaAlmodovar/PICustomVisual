import { Node } from './node';
import * as d3 from "d3";

export class Link implements d3.SimulationLinkDatum<Node> {
  // optional - defining optional implementation properties - required for relevant typing assistance
  index?: number;

  // must - defining enforced implementation properties
  source: Node;
  target: Node;
  kop: string;
  group: number;

  constructor(source, target, kop, isBranch, group) {
    this.source = source;
    this.target = target;
    this.kop = kop;
    if (target == isBranch){
      this.group = 1;
    }else{
      this.group = 2;
    }
    
  }

  get color() {
    //let index = Math.floor(APP_CONFIG.SPECTRUM.length * this.normal());
    // return APP_CONFIG.SPECTRUM[index];
    var kopColors = {
      "Logistics Management": "red",
      "Investment and Project Management": "blue",
      "Procure to Pay": "orange",
      "Financial Accounting to Reporting": "green",
      "Inventory Management and Distribution": "#8177B7",
      "Supply Planning": "cyan",
      "M&S Management and Distribution": "#8177B7",
      "Warehouse Management": "blue",
      "Source to Contract": "red",
      "Sales Planning": "#009FC2",
      "Workforce Development and Engagement": "#8DBE50",
      "Workforce Planning and Productivity": "#8177B7",
      "Asset Maintenance and Sustaining": "#008D7F",
      "Asset Management": "#8177B7",
      "Operational Financial Planning": "#8177B7",
      "Product and Service Delivery": "#F6871F",
      "Integrity Management": "#999",
      "Integration Project Management": "#66f"

    };

    return kopColors[this.kop];
  }
}