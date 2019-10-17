import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionId = powerbi.extensibility.ISelectionId;
export interface Relationship {
    Source: string;
    Target: string;
    Level: string;
    TLevel: string;
    SFunction: Array<string>;
    TFunction: Array<string>;
    Kop: string;
    sSelectionId: ISelectionId;
    tSelectionId: ISelectionId;
    BranchSelectionId: ISelectionId;
    isBranch: string;
    SValue: string;
    TValue: string;
    IsPrimaryBranch: Boolean;
    Tooltip: Array<string>;
}
export declare class Visual implements IVisual {
    private target;
    private updateCount;
    private settings;
    private textNode;
    private host;
    private svg;
    private g;
    private MainValue;
    private margin;
    private dataView;
    private selectionManager;
    private selectionIdBuilder;
    private static metricA;
    private static metricB;
    private container;
    private rect;
    private measureValue;
    private measureLabel;
    private static dataMain;
    private static allData;
    private static filterMetricName;
    private events;
    private tooltipServiceWrapper;
    private static tooltipServiceWrapperS;
    private static ClassName;
    private static IsCollapse;
    private static nodeMenuItems;
    private barContainer;
    private static metricList;
    private static circlesSVG;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private reset;
    /** Parse function, check settings and return visual settings appropiate */
    private static parseSettings;
    private static getUniqueValues;
    private static getRandomNumber;
    static converter(options: VisualUpdateOptions, host: IVisualHost): Relationship[];
    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject;
    private static getTooltipDataCircle;
    private static getTooltipDataCircleTest;
    private static getSelectionIdCircleTest;
    private static getTooltipData;
}
