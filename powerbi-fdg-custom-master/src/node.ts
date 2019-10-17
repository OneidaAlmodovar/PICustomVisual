import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.extensibility.ISelectionId;
import { selection } from "d3";
//import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class Node implements d3.SimulationNodeDatum {
  // optional - defining optional implementation properties - required for relevant typing assistance
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;

  name: string;
  lvl: string;
  linkCount: number = 0;
  selectionId: ISelectionId;
  isBranch: boolean;
  func: Array<string>;
  IsPrimaryBranch: Boolean;
  tooltipData: Array<string>;

  scale: number;
  metricValue: string;
  isRoot: number;
  group: number;
  
  selectionIdNode: ISelectionId;
  branchSelectionId: ISelectionId;

  // constructor(name, lvl, selectionId, branch, func, metricValue) {
  //constructor(options, host: IVisualHost, name, lvl, selectionId, branch, func, IsPrimaryBranch,metricValue,tooltipData) {
  constructor( name, lvl, selectionId, branch, func, IsPrimaryBranch,metricValue,branchSelectionId,tooltipData) {
    this.name = name;
    this.lvl = lvl;
    this.selectionId = selectionId;
    this.isBranch = branch == name;
    this.func = func;
    this.IsPrimaryBranch = IsPrimaryBranch;
    this.tooltipData = tooltipData;
    this.metricValue = metricValue;

    if (branch == name){
      this.isRoot = 1;
      this.group = 1;
    }else{
      this.isRoot = 0;
      this.group = 0;
    }

    this.branchSelectionId = branchSelectionId;
  /*  this.selectionIdNode = host.createSelectionIdBuilder()
                      //.withMeasure(name)
                      .withCategory(options.dataViews[0].categorical.categories[0], 1)
                      .createSelectionId();*/

    var rnd = Math.random() * 60 - 30;

    var fixedvertical = 0;

    if (fixedvertical) {

      if (this.lvl == "M1") {
        this.fy = 30;
      }

      if (this.lvl == "M2") {
        this.fy = 150 + rnd;
      }

      if (this.lvl == "M3") {
        this.fy = 270 + rnd;
      }

      if (this.lvl == "M4") {
        this.fy = 390 + rnd;
      }

      if (this.lvl == "M5") {
        this.fy = 510 + rnd;
      }

    }

    /*if (branch == name)
    {
      console.log('branch metric',branch, name);
      console.log();
      //this.fy = 30;
      //this.x = 300;
      //this.y = 300;
    }
    */

  }

  normal = () => {
    //  return Math.sqrt(this.linkCount / APP_CONFIG.N);
    return 2;
  }

  public r(scale) {
    if (scale > -1) {
      this.scale = scale;
    }

    var branchScale = 1;

    if (this.isBranch) {
      var factor: number;
      if (Math.log(this.scale) > 30) { factor = 30 } else { factor = Math.log(this.scale) };
      branchScale = (factor / 30.0) * 2 + 1;
    }
    return 30;
    //return 30 * branchScale;

  }

  get fontSize() {
    return (30 * this.normal() + 10) + 'px';
  }

  get color() {
    //let index = Math.floor(APP_CONFIG.SPECTRUM.length * this.normal());
    // return APP_CONFIG.SPECTRUM[index];
    return "red";
  }
}