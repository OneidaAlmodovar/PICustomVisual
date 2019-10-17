/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.extensibility.ISelectionId;
import ISelectionIdBuilder = powerbi.extensibility.ISelectionIdBuilder;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import FilterAction = powerbi.FilterAction;

import * as tooltip from 'powerbi-visuals-utils-tooltiputils';
import { TooltipEventArgs, ITooltipServiceWrapper, createTooltipServiceWrapper, TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import * as models from 'powerbi-models';
//import { IBasicFilter,IFilterColumnTarget,IFilterTarget,IFilter,FilterType, BasicFilter } from "powerbi-models";
import { IBasicFilter, IFilterColumnTarget } from "powerbi-models";

//import * as pbi from 'powerbi-client';
//import * as powerbiclient from "powerbi-client";
//import FilterAction = powerbi.FilterAction;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;



//Interface to handle data mapped from powerbi
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

//Import Libraries
import { VisualSettings } from "./settings";
import * as d3 from "d3";
import { Node } from './node';
import { Link } from './link';
import { visualTransform, visualTransformData, exampleFunction, visualTransformChart } from "./visualTransform";
import { visualTransformBarChart } from "./barChart";
import { hostname } from "os";
import { line, html, color } from "d3";

/**
   * Interface for BarChart settings.
   *
   * @interface
   * @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
   * @property {{generalView.opacity:number}} Bars Opacity - Controls opacity of plotted bars, values range between 10 (almost transparent) to 100 (fully opaque, default)
   * @property {{generalView.showHelpLink:boolean}} Show Help Button - When TRUE, the plot displays a button which launch a link to documentation.
   */
interface BarChartSettings {
    enableAxis: {
        show: boolean;
        fill: string;
    };

    generalView: {
        opacity: number;
        showHelpLink: boolean;
        helpLinkColor: string;
    };

    averageLine: {
        show: boolean;
        displayName: string;
        fill: string;
        showDataLabel: boolean;
    };
}
/**
 * Interface for BarCharts viewmodel.
 *
 * @interface
 * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
 * @property {number} dataMax                 - Maximum data value in the set of data points.
 */
interface BarChartViewModel {
    dataPoints: BarChartDataPoint[];
    dataMax: number;
    settings: BarChartSettings;
};

/**
     * Interface for BarChart data points.
     *
     * @interface
     * @property {number} value             - Data value for point.
     * @property {string} category          - Corresponding category of data value.
     * @property {string} color             - Color corresponding to data point.
     * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering
     *                                        and visual interaction.
     */
interface BarChartDataPoint {
    value: number;
    category: string;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    selectionId: ISelectionId;
};

/*
export interface IFilter {
    $schema: string;
    target: models.IFilterTarget;
}
export interface IBasicFilter extends IFilter {
    operator: models.BasicFilterOperators;
    values: (string | number | boolean)[];
}

interface IAdvancedFilterCondition {
    value: (string | number | boolean);
    operator: models.AdvancedFilterConditionOperators;
}*/



export class Visual implements IVisual {

    //private general variables
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    private host: IVisualHost;
    private svg: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
    private g: d3.Selection<SVGElement, any, HTMLElement, any>;
    private MainValue: d3.Selection<SVGElement, any, HTMLElement, any>;
    private margin = { top: 20, right: 20, bottom: 20, left: 20 };
    private dataView: DataView;
    private selectionManager: ISelectionManager;
    private selectionIdBuilder: ISelectionIdBuilder;
    private static metricA: string;
    private static metricB: string;

    private container: d3.Selection<SVGElement, any, HTMLElement, any>;
    private rect: d3.Selection<SVGElement, any, HTMLElement, any>;
    private measureValue: d3.Selection<SVGElement, any, HTMLElement, any>;
    private measureLabel: d3.Selection<SVGElement, any, HTMLElement, any>;


    private static dataMain: DataView;
    private static dataMainView: Relationship[];

    private static allData: Relationship[];
    private static filterMetricName: string;

    private events: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private static tooltipServiceWrapperS: ITooltipServiceWrapper;


    //General ClassName for visualization in html page
    private static ClassName: string = "slbrelationship";

    private static IsCollapse: Boolean = false;
    private static nodeMenuItems = [];

    //Barchart
    private barContainer: d3.Selection<SVGElement, any, HTMLElement, any>;

    //selected metric list
    private static metricList = [];

    private static circlesSVG;

    //constructor method
    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options); //Default console log for visual constructor
       // console.log('Visual constructor', options.element.dataset);
        this.target = options.element;

        this.host = options.host;
        //Initialize a SelectionIdBuilder | First, you need to create a SelectionIdBuilder in your constructor and store it in a private variable in your visual class for later use.
        this.selectionIdBuilder = options.host.createSelectionIdBuilder();
        //Initialize a SelectionManager | First, you need to create a SelectionManager in your constructor and store it in a private variable in your visual class for later use.
        this.selectionManager = options.host.createSelectionManager();


        /** Instantiate the tooltipWrapper */
        this.tooltipServiceWrapper = tooltip.createTooltipServiceWrapper(options.host.tooltipService, options.element); // tooltipService is from the IVisualHost.

        Visual.tooltipServiceWrapperS = tooltip.createTooltipServiceWrapper(options.host.tooltipService, options.element);

        this.events = options.host.eventService;
        Visual.allData = [];

        // SVG (Scalable Vector Graphics)
        //Adding size and class for svg element. SVG has several methods for drawing paths, boxes, circles, text, and graphic images.
        this.svg = d3.select(options.element)
            .append('svg')
            .attr("width", "100%").attr("height", '100%')
            .classed(Visual.ClassName, true);
        //console.log('running');

        //Append g element into svg. <g> element is used to group SVG shapes together. 
        this.g = this.svg
            .append("g")
            .attr("id", "gmain")
            ;

        /** Group container for card */
        this.container = this.svg
            .append('g')
            //.classed('container', true)
            ;

        /** Rectangle surrounding value & measure */
        //this.rect = this.container.append('rect');
        this.rect = this.container
            .append('rect')
            //.classed('rect', true)
            ;

        /** Measure */
        this.measureValue = this.container
            .append('text')
            //.classed('textValue', true)
            ;

        //Clear filters
        this.host.applyJsonFilter(null, "general", "filter", FilterAction.merge);


        //Zoom function for svg element
        this.svg.call(d3.zoom()
            .extent([[0, 0], [2000, 2000]])
            .scaleExtent([.1, 12])
            .on("zoom", zoomed));

        this.MainValue = this.svg
            .append('text')
            .classed('textValue', true);

        // g variable declaration
        let g = this.g;

        //zoomed function, this is for transform the g element
        function zoomed() {
            const { transform } = d3.event;
            //console.log('zooming ...');
            //console.log('transform', d3.event.transform);
            g.attr("transform", d3.event.transform);
        }
    }

    //method to update elements in page
    public update(options: VisualUpdateOptions) {
        //set visual class settings
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        //console.log('settings', this.settings);

        //Default console log for visual update
        console.log('Visual update', options);

        let allowInteractions = this.host.allowInteractions;
        //Clean the current visualization
        this.reset();

        //set dataview
        this.dataView = options.dataViews[0];
        //console.log('dataView', this.dataView);


        //KOP Color List, contains KOP Name and Color
        var kopColors =
        {
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

        //Business Workflow color list
        var businessWorkflows =
        {
            "FDE": "#8dbe50",
            "FIN": "#ffc426",
            "HR": "#ffc426",
            "IM": "#d9d9d9",
            "IT": "#038d7f",
            "OPRM": "#8177b7",
            "PSD": "#f68720",
            "REM": "#038d7f",
            "SP": "#039fc2",
            "SUP": "#ffc426",
            "TLM": "#038d7f",
            "null": "#999",
            "test": "red"
        };

        //Level Line stroke width by level, so if one of the metrics in the link is an M1, make the stroke-width 3, if one is an M2, make it 2, and if it's just an M4-m3 make it 1
        var levelLineWidth =
        {
            "M1": 5,
            "M2": 3,
            "M3": 1,
            "M4": 1,
            "M5": 1
        };

        //system color list
        var systemColors =
        {
            "isBranch": "#fff",
            "noBusinessWorkflow": "#666666",
            "noMetricValue": "#eee",
            "strokeIsBranch": "#9ff5d6",
        };


        


        let links = Visual.converter(options, this.host);
        //console.log('links', links);


       /* //main data
        if (Visual.dataMain == null)
        {
            Visual.dataMain = options.dataViews[0];
        }*/
        //console.log('dataMain', Visual.dataMain);


        //links2 variable is used to filter all target not null records and map it to Link Object [Source, Target, Kop], please see reference in /src/link.ts
        var links2 = links.filter(i => i.Target != "null").map(x => new Link(x.Source, x.Target, x.Kop, x.isBranch, 0));
        //console.log('links2', links2);

        //source3 is used to map sources data into Node Object [Source, level, selectionId, isBranch, SFunction], please see reference in /src/Node.ts
        //var sources3 = links.map(x => new Node(x.Source, x.Level, x.selectionId, x.isBranch, x.SFunction, x.SValue));
        var sources3 = links.map(x => new Node(x.Source, x.Level, x.sSelectionId, x.isBranch, x.SFunction, x.IsPrimaryBranch, x.SValue, x.BranchSelectionId,x.Tooltip));

        //targets3 is used to map targets data into Node Object [Target, TLevel, selectionId, isBranch, TFunction], please see reference in /src/Node.ts
        //var targets3 = links.map(x => new Node(x.Target, x.TLevel, x.selectionId, x.isBranch, x.TFunction, x.TValue));
        var targets3 = links.map(x => new Node(x.Target, x.TLevel, x.tSelectionId, x.isBranch, x.TFunction, x.IsPrimaryBranch, x.TValue, x.BranchSelectionId ,x.Tooltip));

        //nodesm3 is used to store concatenate data with targets and sources
        var nodesm3 = sources3.concat(targets3.filter(function (item) {
            return !sources3.some(function (f) {
                return f.name === item.name && f.lvl === item.lvl;
            });
        }));

        //nodesm5 is used to filter data based on name and level
        var nodesm5 = nodesm3.filter((n, index) => {
            return index === nodesm3.findIndex(obj => {
                return n.name === obj.name && n.lvl === obj.lvl;
            });
        });
        //nodesm5 remove name null records
        nodesm5 = nodesm5.filter(item => item.name != "null");

        //We use nodesm as the final variable to handle nodes data 
        var nodesm = nodesm5;
        //console.log('nodesm', nodesm);

        //Get isBranch 
        var metricIsBranch = nodesm5.filter(item => item.isBranch == true);
        var selectedMetric = metricIsBranch[0].name;

        //Visual.metricList = selectedMetric;
        Visual.metricList = [];
        //Visual.metricList.push(selectedMetric);


        //getSvgPath function is used to convert straigh lines to curve lines, this function design the path to follow for the curved line
        //Parameter: Link object
        //Return Value: string path
        function getSvgPath(link: Link): string {

            // console.log('link', link);
            //Property to manage curvature, we can modify the curvature of curved lines
            var curvatureOfLinks = 0.5;
            var r = 30 + 10;
            const markerSpace = 5;
            var paddingNode = 0;

            let x0: number,
                x1: number,
                xi: (t: number) => number,
                x2: number,
                x3: number,
                y0: number,
                y1: number;

            //first case, point to the right and up
            if (link.target.x < link.source.x && link.target.y > link.source.y) {
                var distance = Number(link.source.x) - Number(link.target.x);

                //console.log('distance1', distance);

                if (Number(distance) <= Number(paddingNode)) {
                    paddingNode = 0;
                }
                else {
                    paddingNode = 5;
                }

                if (distance < r) {

                    distance = 0;
                    y0 = link.source.y + r;

                    x0 = link.source.x - distance - paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    //return points path
                    return `M ${x0} ${y0} C ${x0} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
                else {
                    distance = r;
                    y0 = link.source.y;

                    // console.log('sourceX', link.source.name + " = " ,link.source.x, 'targetX', link.target.name + " = ",link.target.x);
                    // console.log('distance2', distance);

                    x0 = link.source.x - distance - paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    if ((x2 - x0) < 3) {
                        x0 = x0 + 3;
                    }

                    //return points path
                    return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
            }

            // second case points to the right and down
            if (link.target.x < link.source.x && link.target.y < link.source.y) {
                var distance = Number(link.source.x) - Number(link.target.x);
                //console.log('distance1', distance);

                if (Number(distance) <= Number(paddingNode)) {
                    //console.log('distance negative', distance);
                    paddingNode = 0;
                }
                else {
                    paddingNode = 5;
                }

                if (distance < r) {

                    distance = 0;
                    y0 = link.source.y - r;

                    x0 = link.source.x - distance - paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    //return points path
                    return `M ${x0} ${y0} C ${x0} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
                else {


                    distance = r;
                    y0 = link.source.y;

                    x0 = link.source.x - distance - paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);


                    if ((x2 - x0) < 3) {
                        x0 = x0 + 3;
                    }
                    //return points path
                    return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }

                //console.log('sourceX', link.source.name + " = " ,link.source.x, 'targetX', link.target.name + " = ",link.target.x);
                //console.log('distance2', distance);
            }


            // third case points to the left and up
            if (link.target.x > link.source.x && link.target.y > link.source.y) {

                var distance = Number(link.source.x) - Number(link.target.x);

                if (Number(distance) <= Number(paddingNode)) {
                    paddingNode = 5;
                }
                else {
                    paddingNode = 0;
                }

                if (distance < -r) {

                    distance = r;
                    y0 = link.source.y + 0;

                    x0 = link.source.x + distance + paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    if ((x2 - x0) < 3) {
                        x0 = x0 - 3;
                    }

                    //return points path
                    return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
                else {


                    distance = 0;
                    y0 = link.source.y + r;

                    x0 = link.source.x + distance + paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    //return points path

                    return `M ${x0} ${y0} C ${x0} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
            }

            // fourth case points left and down
            if (link.target.x > link.source.x && link.target.y < link.source.y) {

                var distance = Number(link.source.x) - Number(link.target.x);
                //console.log('distance1', distance);

                if (Number(distance) <= Number(paddingNode)) {
                    paddingNode = 5;
                }
                else {
                    paddingNode = 0;
                }

                if (distance < -r) {

                    distance = r;
                    y0 = link.source.y + 0;

                    x0 = link.source.x + distance + paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    if ((x2 - x0) < 3) {
                        x0 = x0 - 3;
                    }

                    //return points path
                    return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
                else {
                    distance = 0;
                    y0 = link.source.y - r - paddingNode;

                    x0 = link.source.x + distance + paddingNode;
                    x1 = link.target.x;
                    y1 = link.target.y;

                    xi = d3.interpolateNumber(x0, x1);
                    x2 = xi(curvatureOfLinks);
                    x3 = xi(1 - curvatureOfLinks);

                    //return points path
                    return `M ${x0} ${y0} C ${x0} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

                }
            }

        }

        //Position of X circle, to be able to handle main Node
        function getCirclePositionX(node: Node): string {

            var cx = node.x;

            //Main Node
            if (node.name == selectedMetric) {

                cx = parseInt(svg.style("width")) / 2;

                // console.log('selected node',node);
                // console.log('selectedMetric2',selectedMetric);
            }

            return cx.toString();

        }

        //Position of Y circle, to be able to handle main Node
        function getCirclePositionY(node: Node): string {

            var cy = node.y;

            //Main Node
            if (node.name == selectedMetric) {

                cy = parseInt(svg.style("height")) / 2;

                // console.log('selected node',node);
                // console.log('selectedMetric2',selectedMetric);
            }
            return cy.toString();
        }

        var menu = contextMenu();

        function contextMenu() {
            var height = 25,
                width = 150,
                margin = 10, // fraction of width
                rescale = false;

            var items = Visual.nodeMenuItems;

            function menu(that, xValue, yValue, listItems) {
                items = listItems;

                var position = d3.mouse(that);
                //console.log('position', position);

                //console.log('position xy', xValue, yValue);

                var x = xValue;//position[0];
                var y = yValue;//position[1];

                //get translate value of master g element
                //var vTraslate = g;
                //console.log('vTraslate',vTraslate);

                var transformStyle = document.getElementById('gmain').getAttribute('transform');//document.getElementById('gmain').style.transform;
                //console.log('transformStyle',transformStyle);

                d3.select('.context-menu').remove();
                scaleItems();

                // Draw the menu
                d3.select('svg')
                    .append('g')
                    .attr('class', 'context-menu')
                    .attr("transform", transformStyle)
                    .selectAll('tmp')
                    .data(items).enter()
                    .append('g').attr('class', 'menu-entry')
                    .on('mouseover', function () {
                        d3.select(this).select('rect')
                            .attr("style", "fill: rgb(200, 200, 200); stroke: white; stroke-width: 1px;")
                    })
                    .on('mouseout', function () {
                        d3.select(this).select('rect')
                            .attr("style", "fill: rgb(244, 244, 244); stroke: white; stroke-width: 1px;")
                    });

                d3.selectAll('.menu-entry')
                    .append('rect')
                    .attr('x', x)
                    .attr('y', function (d, i) {
                        return y + (i * height);
                    })
                    .attr('width', width)
                    .attr('height', height)
                    .attr("style", "fill: rgb(244, 244, 244); stroke: white; stroke-width: 1px;")
                    ;

                d3.selectAll('.menu-entry')
                    .append('text')
                    .text(function (d) {
                        var itemText = d.toString();
                        return itemText;
                    })
                    .attr('x', x)
                    .attr('y', function (d, i) { return y + (i * height); })
                    .attr('dy', 15)// height - margin / 2)
                    .attr('dx', margin)
                    .attr("style", "fill: black; font-size: 13px;")
                    .on('click', function (d) {
                        if (Visual.IsCollapse == true) {
                            Visual.IsCollapse = false;
                            
                        } else {
                            Visual.IsCollapse = true;
                           
                        }
                        nodeClick(d.toString());

                        setCircleTooltip();
                        //console.log('circles0',circles);

                        //var circles2 = g.select('circles');
                        /*let circles3 = g
                            .selectAll("circle")
                            .data(nodesm)
                            ;
                        */

                      /*  console.log('circles3',circles3);
                        if (viewModel.card.tooltips.length > 0) {
                            Visual.tooltipServiceWrapperS.addTooltip(
                                circles3,//this.svg
                                 (eventArgs: TooltipEventArgs<number>) => viewModel.card.tooltips
                                ,(eventArgs) => {
                                                    //debugger;
                                                    //console.log('(<any>eventArgs.data).selectionId',(<any>eventArgs.data).selectionId);
                                                    return (<any>eventArgs.data).selectionId;
                                                }
                                ,true
                            );
                        };*/

                        
                        
                    })
                    ;

                // Other interactions
                d3.select('body')
                    .on('click', function () {
                        d3.select('.context-menu').remove();
                    });
            };

            // Automatically set width, height, and margin;
            function scaleItems() {
                if (rescale) {
                    d3.select('svg').selectAll('tmp')
                        .data(items).enter()
                        .append('text')
                        .text(function (d) { return d; })
                        .attr('x', -1000)
                        .attr('y', -1000)
                        .attr('class', 'tmp');
                    var z = d3.selectAll('.tmp')[0]
                        .map(function (x) { return x.getBBox(); });
                    width = Number(d3.max(z.map(function (x) { return x.width; })));

                    margin = margin * width;
                    width = width + 2 * margin;
                    height = Number(d3.max(z.map(function (x) { return x.height + margin / 2; })));

                    // cleanup
                    d3.selectAll('.tmp').remove();
                    rescale = false;
                }
            }

            return menu;
        };

        //declare svg, g variables used on update section
        var g = this.g;
        var svg = this.svg;

        // force variable to handle links name and centered it
        var force = d3.forceSimulation(nodesm)
            .force('link', d3.forceLink(links2)
                .id(d => d['name'])
            )
            .force("center", d3.forceCenter(parseInt(svg.style("width")) / 2, parseInt(svg.style("height")) / 2)) //so the graph is centered at this location

            .force('charge', d3.forceManyBody().strength(() => { return -20000 / Math.log(nodesm.length); }) // charge causes nodes in the graph to repel each other.
                .distanceMin(2).distanceMax(270))
            .stop();
        ;

        var mainX = parseInt(svg.style("width")) / 2;
        var mainY = parseInt(svg.style("height")) / 2;

        //marker function is used to add triangle markers at the start position for the lines, this function is dynamic and receive the color as a parameter from the link
        function markerStart(kop, color) {

            svg.append("svg").append("svg:marker")
                .attr("id", "StartTriangle" + color)
                .attr("refX", 0)//6
                .attr("refY", 6)//6
                .attr("markerWidth", 30)//30
                .attr("markerHeight", 30)//30
                .attr("markerUnits", "userSpaceOnUse")
                .attr("orient", "auto-start-reverse")
                .append("path")
                .attr("d", "M 0 0 L 12 5 L 0 12 z") //M 0 0 L 12 5 L 0 12 z
                .style("fill", color);

            return "url(#StartTriangle" + color + ")";
        }

        //Add curve lines
        var arrowColor;

        // link constant, we add links2 as defined data
        var link = g
            .selectAll("path")
            .data(links2)
            .join("path")
            .attr("stroke-width", function (d) { //this function is to modify stroke width line depending on the level
                return levelLineWidth[d.source.lvl];
            })
            .attr("fill", "none")
            .attr('stroke', function (d) { return d.color; }) //this function is to return line color
            .attr("marker-start",
                function (d) {
                    arrowColor = markerStart(d.kop, d.color);
                    return markerStart(d.kop, d.color); //call markerStart function to return arrow for the line, if you need to delete just comment this lines
                })
            ;

        //Get kopList from link2
        const kopList = Array.from(new Set(links2)).map(k => k.kop);

        //Get unique values, Just want to know what are the distinct KOP for the legend
        var KOPLegend = kopList.filter(Visual.getUniqueValues);

        //Add kop title in link
        link.append("title").text(function (d) { return d.kop; });

        //This function is to test multicolor function generating random colors
        function getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        //Multicolor circle function
        function circleColor(d) {
            //console.log('cicle node', d);

            var returnValueColor;

            //if there is no value in the cube for a metric, make that metric light gray
            // if (d.metricValue == null || d.metricValue == 0) {
            if (d.metricValue == "null") {
                returnValueColor = systemColors["noMetricValue"];
            }
            else {
                //if the metric is branch make that metric white
                if (d.isBranch) {
                    returnValueColor = systemColors["isBranch"];
                }
                else {
                    //set color for item based on businessWorkflows color list
                    returnValueColor = businessWorkflows[d.func[0]];
                    //if the metric does not have any business workflow make that metric dark
                    if (businessWorkflows[d.func[0]] == undefined) {
                        returnValueColor = systemColors["noBusinessWorkflow"];
                    }
                }
            }

            //bw is acronym of business workflow, this variable store list of values like this one: Values Sample:["TLM", "test"]
            var bw = d.func;
            //console.log('d.func',JSON.stringify(d));

            //Gradient percentage shouls start in 0, this is the start position for initial color
            var gradientPercentage = 0;
            //counter variable is to handle different colors in circle
            var counter = 0;

            if (bw.length > 0) {
                //Dynamic quantity of colors, the gradientPercentage value is related with how many colors the circle will display
                gradientPercentage = 100 / bw.length;
            }

            //Version 3  - Handle dynamic colors
            //svg and grad defintions
            var svgDefinitions = svg.append("defs");
            var grad = svgDefinitions.append("linearGradient");

            //Add basic attributes for linear gradient
            grad
                .attr("id", "grad" + returnValueColor)
                .attr("x1", "100%")
                .attr("x2", "0%")
                .attr("y1", "0%")
                .attr("y2", "0%");

            //loop using the different existing items for multicolor
            bw.forEach(function (item) {

                //color of the current item depending on item.value
                var itemColor;

                //if there is no value in the cube for a metric, make that metric light gray
                //if (d.metricValue == null || d.metricValue == 0) {
                if (d.metricValue == "null") {
                    itemColor = systemColors["noMetricValue"];
                }
                else {
                    //if the metric is branch make that metric white
                    if (d.isBranch) {
                        itemColor = systemColors["isBranch"]; //white color in branch cases
                    }
                    else {
                        //set color for item based on businessWorkflows color list
                        itemColor = businessWorkflows[item];
                        //if the metric does not have any business workflow make that metric dark
                        if (businessWorkflows[item] == undefined) {
                            itemColor = systemColors["noBusinessWorkflow"];
                        }
                    }
                }

                var offSetValue = 100;
                //to handle two colors, should work using 50% for first color, and 50 for second color
                if (bw.length == 1) {
                    offSetValue = 100;
                }
                else {
                    if (bw.length == 2) {
                        offSetValue = 50;
                    }
                    else {
                        //if does not have 2 colors, this is the dynamic calculation to handle n colors and looks good in final lineargradient
                        offSetValue = (gradientPercentage * counter);
                    }
                }

                //we need to append a stop element by each item
                grad.append("stop")
                    .attr("offset", "" + offSetValue.toString() + "%") //offSetValue indicates the percentage for the color
                    .style("stop-color", itemColor); //color of item, you can play with this one using getRandomColor() function

                counter++; //Increment item counter

            });

            return "url(#grad" + returnValueColor + ")"; //finally we return the url for the gradient circle element
        };


        function strokeCircleColor(d) {
            //console.log('cicle node', d);

            var returnValueColor;

            //if the metric is branch make that metric white
            if (d.isBranch) {
                returnValueColor = systemColors["strokeIsBranch"];
            }
            else {
                //set color for item based on businessWorkflows color list
                returnValueColor = businessWorkflows[d.func[0]];
                //if the metric does not have any business workflow make that metric dark
                if (businessWorkflows[d.func[0]] == undefined) {
                    returnValueColor = systemColors["noBusinessWorkflow"];
                }
            }

            return returnValueColor;

        };

        //selectionManager variable to store Id index element indicator
        let selectionManager = this.selectionManager;

        //constant node variable, this is to handle all the information about nodes
        var node = g
            .selectAll("circle")
            .data(nodesm) //takes data from nodesm object
            .join("circle")//using circles shapes
            .attr("stroke", function (d) {
                return strokeCircleColor(d); //Multicolor function
            })
            .attr("stroke-width", d => d.isBranch ? 3 : 1.5)
            .attr("r", d => d.r(nodesm.length)) // Get Radio of circle and set the r attribute
            .attr("fill",
                function (d) {
                    return circleColor(d); //Multicolor function
                })
            .on('contextmenu', function (d) {

                if (d.isRoot == 1) {

                    if (Visual.IsCollapse == false) {
                        Visual.nodeMenuItems = ['Show my direct metrics'];

                    }
                    else {
                        Visual.nodeMenuItems = ['Show all metrics'];
                    }

                    d3.event.preventDefault();
                    menu(this, d.x, d.y, Visual.nodeMenuItems);

                }
            })
            .on('click', (d) => { //circle click event

                if (d.isRoot == 1) {
                
                    //Main Node reset the filters
                    console.log('Selected Root Node ID: ', d.branchSelectionId);
                    selectionManager.select(d.branchSelectionId);
                    (<Event>d3.event).stopPropagation();

                    this.host.applyJsonFilter(null, "general", "filter", FilterAction.merge);

                }
                else
                {
                    
                    console.log('Selected Node ID: ', d.branchSelectionId);
                    //this.host.applyJsonFilter(null, "general", "filter", FilterAction.merge);
                    //debugger;
                    selectionManager.select(d.branchSelectionId);
                    
                    (<Event>d3.event).stopPropagation();
        
                         // New metric selection 
                            let newMetricSelected = d.name;
                            //console.log('newMetricSelected',newMetricSelected);
    
                            //Visual.metricList = Visual.metricList + "," + newMetricSelected;
                            Visual.metricList = [];
                            Visual.metricList.push(newMetricSelected);
                            //console.log('Visual.metricList', Visual.metricList);
    
                            //Apply a Basic filter
                            var basicFilter: IBasicFilter = {
                                $schema: "http://powerbi.com/product/schema#basic",
                                target: {
                                    table: "Dim_MetricRelationships",
                                    column: "Metric Branch"
                                },
                                operator: "In",
                                //values: ['Excess M&S', 'PO Compliance - Inventory'],
                                values: Visual.metricList,
                                filterType: models.FilterType.Basic
                            };
    
                            this.host.applyJsonFilter(basicFilter, "general", "filter", FilterAction.merge);
  
                }
            })
            ;

        //Add text box in circles
        var textg = g.append("g"); //Text labels below circle
        var textg2 = g.append("g"); //Circle inside the circle

        //Variable text to handle the node name below the circle
        var text = textg.selectAll("text")
            .data(force.nodes())
            .enter().append("text")
            .attr("font-size", function (d) {
                if (force.nodes.length > 50) { return "8px" };
                if (force.nodes.length > 20) { return "10px" }
                if (force.nodes.length > 7) { return "12px" }
                return "10px";
            })
            .attr("dx", 0) //x distance between the circle and the text
            .attr("y", 0)
            .attr("dy", d => d.r(-1) + 10) //dy distance between the circle and the text

            /*
            x: The x coordinate of the starting point of the text baseline.
            y: The y coordinate of the starting point of the text baseline.
            dx: Shifts the text position horizontally from a previous text element.
            dy: Shifts the text position vertically from a previous text element.
            */

            //Set the circle text name
            .text(function (d) { return d.name; });

        //text 2 variable is to set some text inside the circle
        var text2 = textg2.selectAll("text")
            .data(force.nodes())
            .enter().append("text")
            .attr("font-size", function (d) {
                if (force.nodes.length > 50) { return "8px" };
                if (force.nodes.length > 20) { return "10px" }
                if (force.nodes.length > 7) { return "12px" }
                return "12px";
            })
            .attr("dx", -7)//distance between the circle and the text
            .attr("y", 0)
            .attr("dy", 4)
            /*
            x: The x coordinate of the starting point of the text baseline.
            y: The y coordinate of the starting point of the text baseline.
            dx: Shifts the text position horizontally from a previous text element.
            dy: Shifts the text position vertically from a previous text element.
            */

            //Set the text inside the circle
            .text(function (d) {
                //console.log('testing circle value', d);
                return ""; //predetermined value
            });


        //start link name
        var textgl = g.append("g"); //Text Label Link name
        //Variable text to handle the link name in the middle of the line
        var textLine = textgl.selectAll("text")
            .data(links2)
            .enter().append("text")
            .attr("font-size", "9px")
            .attr("x", 0)
            .attr("y", 0)
            .attr("fill", "gray")
            //Set the link text name
            .text(function (d) { return d.source.lvl; });

        //end link name

        //We call the wrap function to split the text in many records, using wrap function visually looks better because everything does not appear in the same line
        textg.selectAll("text").call(wrap, 200);

        force.tick(300);

        //Update isRoot identifier and groups ids for all nodes and links
        updateSVG();


        //force layout uses a physics based simulator for positioning visual elements. The force layout allows us to position elements
        //Setting attributes values for this elements: node, link, text, text2, 

        node
            .attr("cx", d => d.x)// position the x-centre
            .attr("cy", d => d.y)// position the y-centre
            // .attr("cx", getCirclePositionX)
            // .attr("cy", getCirclePositionY)
            ;
        link
            .attr("d", getSvgPath); //The d attribute defines a path to be drawn. Using getSvgPath() function to return the path for curved line
        text
            .attr("transform", transform) //This is to add the labels below the circles
        text2
            .attr("transform", transform) //This is to add the labels in the circles
        textLine
            .attr("x", function (d) { return (d.source.x + d.target.x) * .5; }) // (x1 + x2) * .5 Return the corresponding position for x axis
            .attr("y", function (d) { return (d.source.y + d.target.y) * .5; }); // (y1 + y2) * .5 Return the corresponding position for y axis


        // Add legend step 1: general size and position
        var legend = svg.append("g")
            .attr("height", 100)
            .attr("width", 100)
            .classed("legend", true)
            .attr('transform', 'translate(5,5)')
            ;

        //add border stroke width to mark the legend
        var legendrect = legend.append("rect")
                                .attr("height", 100)
                                .attr("width", 100)
                                .attr("fill", "white")
                                .attr("stroke", "#333")
                                .attr("stroke-width", .2);

        //add transform position for legend
        var legendrectg = svg.append("g").attr("class", "legend").attr("height", 100)
            .attr("width", 100).attr('transform', 'translate(10, 25)');

        //Add legend title
        var legendtitle = svg.append("g")
            .append("text")
            .attr("x", 20)
            .attr("font-size", "10px")
            .attr("fill", "#666666")
            .attr("text-decoration", "underline")
            .attr("font-weight", "bold")
            .attr("y", 0)
            .text("Process Legend")
            .attr("height", 100)
            .attr("width", 100)
            .attr('transform', 'translate(10, 17)');

        // Add legend step 2: adding icon identifier
        legendrectg.selectAll('rect')
            .data(KOPLegend) //take KOPLegend as data
            .enter()
            .append("rect") //to show rectangle shapes
            .attr("x", 0)
            .attr("y", function (d, i) { return i * 14; })
            .attr("width", 20) //using 20 pixels as width and 5 pixels as height we can get the appearance of a little rectangle line, we can play with this values in order to show a square, rectangle, or other shape
            .attr("height", 5)
            .style("fill", function (d) {
                var color = kopColors[KOPLegend[(KOPLegend.indexOf(d))].toString()]; //Get KOP legend color
                return color;
            })
            ;

        // Add legend step 3: adding text label
        legendrectg.selectAll('text')
            .data(KOPLegend)//take KOPLegend as data
            .enter()
            .append("text")
            .attr("x", 25)
            .attr("font-size", "10px")
            .attr("y", function (d, i) { return i * 14 + 7; })
            .text(function (d) {
                var text = KOPLegend[(KOPLegend.indexOf(d))]; //Get KOP text value
                return text;
            });
        legendrect.attr("width", legendrectg.node().getBBox().width + 10);
        legendrect.attr("height", legendrectg.node().getBBox().height + 20);

        //END KOP Legend





        //wrap function to split a text in many records and get a better appearance for the text with the metric name below the circle
        function wrap(text, width2) {
            text.each(function () {
                var width = (parseFloat(d3.select(this).attr("dy")) - 10) * 2.5;

                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = parseInt(text.attr("font-size")),
                    dx = text.attr("dx"),
                    y = "0px",
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("text-anchor", "middle").attr("x", 0).attr("dx", dx).attr("y", y).attr("dy", dy + "px");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("dx", dx).attr("text-anchor", "middle").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "px").text(word);
                    }
                }
            });
        }
        //transform function to set position of elements
        function transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }

        function nodeClick(d) {

            //console.log('selected option', d);

            //console.log('nodesm update', nodesm);

            //parent node
            var nodeRoot = nodesm.filter(item => item.isRoot == 1);
            //console.log('nodeRoot', nodeRoot);

            var nodesL1 = nodesm.filter(item => item.group <= 2);
            //console.log('nodesL1', nodesL1);

            var nodesL2 = nodesm.filter(item => item.group >= 3);
            //console.log('nodesL2', nodesL2);

            //child nodes // Returns a list of all nodes under the root.
            var nodeChilds = nodesm.filter(item => item.group > 1);
            //console.log('nodeChilds', nodeChilds);

            //console.log('links2', links2);

            var linkRoot = links2.filter(item => item.group == 1);
            //console.log('linkRoot', linkRoot);

            var linkChilds = links2.filter(item => item.group == 2);
            //console.log('linkChilds', linkChilds);

            if (Visual.IsCollapse == true) {

                // console.log('collapse');

                //Updte links
                link = link.data(linkRoot, function (d) { return d["source"].name; });
                // Remove the exit'ed node
                link.exit().remove();

                //console.log('link', link);

                // Update the nodes…
                node = node.data(nodesL1, function (d) { return d["name"]; });

                // Remove the exit'ed node
                node.exit().remove();

                //remove node name
                text = text.data(nodesL1, function (d) { return d["name"]; });

                //Remove the exit'ed text
                text.exit().remove();

                ////remove node value
                // text2 = text2.data(nodesL1, function(d) { return d["metricvalue"]; });

                ////Remove the exit'ed text
                // text2.exit().remove();


                //remove level name
                textLine = textLine.data(linkRoot, function (d) { return d["source"].name; });

                //Remove the exit'ed node
                textLine.exit().remove();
               
            }

            if (Visual.IsCollapse == false) {
                //console.log('expand');

                //Update the links
                link = g
                    //.enter()
                    .selectAll("path")
                    .data(links2) //links2
                    .join("path")
                    .attr("stroke-width", function (d) { //this function is to modify stroke width line depending on the level
                        return levelLineWidth[d.source.lvl];
                    })
                    .attr("fill", "none")
                    .attr('stroke', function (d) { return d.color; }) //this function is to return line color
                    .attr("marker-start",
                        function (d) {
                            arrowColor = markerStart(d.kop, d.color);
                            return markerStart(d.kop, d.color); //call markerStart function to return arrow for the line, if you need to delete just comment this lines
                        })
                    .attr("d", getSvgPath)
                    ;
                //Add kop title in link
                link.append("title").text(function (d) { return d.kop; });

                //Update nodes
                node = g
                    .selectAll("circles")
                    .data(nodesm) // nodesm nodesL2
                    .join("circle")//using circles shapes
                    .attr("stroke", function (d) {
                        return strokeCircleColor(d); //Multicolor function
                    })
                    .attr("stroke-width", d => d.isBranch ? 3 : 1.5)
                    .attr("r", d => d.r(nodesm.length)) // Get Radio of circle and set the r attribute
                    .attr("fill",
                        function (d) {
                            return circleColor(d); //Multicolor function
                        })
                    .on('contextmenu', function (d) {

                        if (d.isRoot == 1) {
                            if (Visual.IsCollapse == false) 
                            {
                                Visual.nodeMenuItems = ['Show my direct metrics'];
                            }
                            else 
                            {
                                Visual.nodeMenuItems = ['Show all metrics'];
                            }

                            d3.event.preventDefault();
                            menu(this, d.x, d.y, Visual.nodeMenuItems);

                        }
                    })
                    .on('click', function (d) { //click event, right now is doing nothing but is prepared for future events using circle_onclick

                        if (d.isRoot == 0) {
                            // update(d);
                            console.log('selecting', d.selectionId);
                            selectionManager.select(d.selectionId);
                            (<Event>d3.event).stopPropagation();
                        }
                    })
                    .attr("cx", d => d.x)// position the x-centre
                    .attr("cy", d => d.y)// position the y-centre;
                    
                    ;


                var textg = g.append("g"); //Text labels below circle
                //Variable text to handle the node name below the circle
                text = textg.selectAll("text")
                    .data(nodesL2) //force.nodes() to double post 
                    .enter().append("text")
                    .attr("font-size", function (d) {
                        if (force.nodes.length > 50) { return "8px" };
                        if (force.nodes.length > 20) { return "10px" }
                        if (force.nodes.length > 7) { return "12px" }
                        return "10px";
                    })
                    .attr("dx", 0) //x distance between the circle and the text
                    .attr("y", 0)
                    .attr("dy", d => d.r(-1) + 10) //dy distance between the circle and the text
                    //Set the circle text name
                    .text(function (d) { return d.name; })
                    .attr("transform", transform) //This is to add the labels below the circles
                    ;
                //We call the wrap function to split the text in many records, using wrap function visually looks better because everything does not appear in the same line
                textg.selectAll("text").call(wrap, 200);

                //Update text 2

                //text 2 variable is to set some text inside the circle
                var textg2 = g.append("g"); //Circle inside the circle
                text2 = textg2.selectAll("text")
                    .data(nodesL2)//force.nodes() to double post 
                    .enter().append("text")
                    .attr("font-size", function (d) {
                        if (force.nodes.length > 50) { return "8px" };
                        if (force.nodes.length > 20) { return "10px" }
                        if (force.nodes.length > 7) { return "12px" }
                        return "12px";
                    })
                    .attr("dx", -7)//distance between the circle and the text
                    .attr("y", 0)
                    .attr("dy", 4)
                    //Set the text inside the circle
                    .text(function (d) {
                        //console.log('testing circle value', d);
                        return ""; //predetermined value
                    })
                    .attr("transform", transform) //This is to add the labels in the circles
                    ;

                //Udate line level
                //start link name
                var textgl = g.append("g"); //Text Label Link name
                //Variable text to handle the link name in the middle of the line
                textLine = textgl.selectAll("text")
                    .data(linkChilds)//links2
                    .enter().append("text")
                    .attr("font-size", "9px")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("fill", "gray")
                    //Set the link text name
                    .text(function (d) { return d.source.lvl; })
                    .attr("x", function (d) { return (d.source.x + d.target.x) * .5; }) // (x1 + x2) * .5 Return the corresponding position for x axis
                    .attr("y", function (d) { return (d.source.y + d.target.y) * .5; }); // (y1 + y2) * .5 Return the corresponding position for y axis
                ;

            }

           
            Visual.circlesSVG = g
                                .selectAll("circle")
                                //.data(nodesm)
                                /*.data(nodesm, function (d) { 
                                                            console.log('d["name"]',d["name"]);
                                                            return d["name"]; 
                                                        });*/
                                ;

        }

        function updateSVG() {

            var linksL1 = links2.filter(item => item.group == 1);

            linksL1.forEach(function (linkL1) {

                var linkNameL1 = linkL1.source.name;
                //console.log('linkNameL1', linkNameL1);
                var nodeIndex = linkL1.source.index; // ( function(linkNameL1) { return linkNameL1["index"]; }) 
                //console.log('linkNameL1 IX',ix);
                nodesm[nodeIndex].group = 2;
            });


            var nodesL2 = nodesm.filter(item => item.group == 0);
            // console.log('nodesL2', nodesL2);
            nodesL2.forEach(function (nodeL2) {
                nodeL2.group = 3;
            });
        }

       // setCircleTooltip();


        //function setCircleTooltip() {
       
            // Map the view model 
            let viewModel = visualTransformData(options, this.settings, this.host);
            // Inspect the view model in the browser console; should be removed later on 
            //console.log('View Model:', viewModel);

            viewModel.card.measureValue.attributes.map((a) => {
                this.measureValue.attr(a.key, a.value);
            });

            viewModel.card.measureValue.styles.map((s) => {
                this.measureValue.style(s.key, s.value);
            });


            /*var circles = g
                .selectAll("circle")
                .data(nodesm)
                ;*/

                //var circles = g
                Visual.circlesSVG = g
                    .selectAll("circle")
                    .data(nodesm)
                    ;


             //console.log('circles',circles);

            //v2 show same tooltip page in all circles
            if (viewModel.card.tooltips.length > 0) {
                this.tooltipServiceWrapper.addTooltip(
                    Visual.circlesSVG,//this.svg
                     (eventArgs: TooltipEventArgs<number>) => viewModel.card.tooltips
                    ,(eventArgs) => {
                                        //debugger;
                                        //console.log('(<any>eventArgs.data).selectionId',(<any>eventArgs.data).selectionId);
                                        return (<any>eventArgs.data).selectionId;
                                    }
                    ,true
                );
            };

           
            function setCircleTooltip() {
                //console.log('setCircleTooltip');

                //v2 show same tooltip page in all circles
                if (viewModel.card.tooltips.length > 0) {
                    Visual.tooltipServiceWrapperS.addTooltip(
                        Visual.circlesSVG,//this.svg
                        (eventArgs: TooltipEventArgs<number>) => viewModel.card.tooltips
                        ,(eventArgs) => {
                                            //debugger;
                                            //console.log('(<any>eventArgs.data).selectionId',(<any>eventArgs.data).selectionId);
                                            return (<any>eventArgs.data).selectionId;
                                        }
                        ,true
                    );
                };

               // console.log('Visual.tooltipServiceWrapperS',Visual.tooltipServiceWrapperS);
           }

        // this.tooltipServiceWrapper.addTooltip()
    }

    //reset function is used to clean the page in the updating event, and avoid duplicates elements in the page
    private reset(): void {

        //lean g element
        if (this.g.empty()) {
            return;
        }
        this.g
            .selectAll("*")
            .remove();

        //remove legend element
        this.svg.selectAll(".legend").remove();

        //Reset zoom
        this.g.attr("transform", "scale(1.0)");

        //Reset Position
        this.g.attr("translate", "0,0");

        Visual.IsCollapse = false;

    }

    /** Parse function, check settings and return visual settings appropiate */
    private static parseSettings(dataView: DataView): VisualSettings {

        return VisualSettings.parse(dataView) as VisualSettings;
    }

    //Function to return only unique values in Array
    private static getUniqueValues(value, index, self) {
        return self.indexOf(value) === index;
    }

    // Returns a random number between min (included) and max (excluded)
    private static getRandomNumber(min, max) {
        //return Math.random() * (max - min) + min;
        return Math.floor(Math.random() * (max - min)) + min;

    }

    //converter function is to get selected data in power bi and fill Relationship[] array, this function is transforming data in order to push elements
    public static converter(options: VisualUpdateOptions, host: IVisualHost): Relationship[] {

        //console.log('options',options);
        console.log('converting');
        console.log('dataviews', options.dataViews[0]);

      //  console.log('Visual.metricList', Visual.metricList);

     /*   let selectedMetric = "";
        if (Visual.metricList.length == 0){
            console.log('set dataMain');
            this.dataMain = options.dataViews[0];
        }else{
            selectedMetric = Visual.metricList[0];
            console.log('NO set dataMain');
        }
        console.log('selectedMetric', selectedMetric);
        console.log('dataMain', this.dataMain);
*/

        //set datamain
      /*  if (this.dataMain == null)
        {
            this.dataMain = options.dataViews[0];
        }
        //console.log('dataMain', this.dataMain);
            */

        var resultDataMain: Relationship[];
        resultDataMain = [];


        var resultData: Relationship[];
        resultData = [];

        if (!options.dataViews[0]
            || !options.dataViews[0]
            || !options.dataViews[0].categorical
            || !options.dataViews[0].categorical.categories
            || !options.dataViews[0].categorical.categories[0].source
            || !options.dataViews[0].categorical.categories[1].source
            || !options.dataViews[0].categorical.categories[2].source
            || !options.dataViews[0].categorical.categories[3].source
            || !options.dataViews[0].categorical.categories[4].source
            || !options.dataViews[0].categorical.categories[5].source
            || !options.dataViews[0].categorical.categories[6].source
            || !options.dataViews[0].categorical.categories[7].source
            //|| !options.dataViews[0].categorical.categories[8].source //Source Metric Values
            //|| !options.dataViews[0].categorical.categories[9].source //Target Metric Values

            || !options.dataViews[0].categorical.values[1].values
            || !options.dataViews[0].categorical.values[2].values

            //|| !options.dataViews[0].categorical.categories[8].source //Metric Name Tooltip
        )
            return resultData;

        //Reading power bi selected columns
        let rows = options.dataViews[0].categorical.categories[0].values; //Sources metric names
        let cols = options.dataViews[0].categorical.categories[1].values; //Targets metric names
        let levels = options.dataViews[0].categorical.categories[2].values; //source Level names
        let tlevels = options.dataViews[0].categorical.categories[3].values; //Target Level names
        let kops = options.dataViews[0].categorical.categories[4].values;//KOP Name / KeyProcessName
        let branches = options.dataViews[0].categorical.categories[5].values; // Metric Branch
       // console.log('branches', branches);





        //Get a list of the unique metric values
        let branchesList = branches.filter(Visual.getUniqueValues);
        if (branchesList.length == 1) {
            Visual.metricA = branchesList[0].toString();

            Visual.filterMetricName = branchesList[0].toString();

        }
        //console.log('metricA', Visual.metricA);

        /* if (branchesList.length > 1) //if branches has more than one unique values then return empty
         {
             resultData = [];
             return resultData;
             //console.log('resultData empty');//JSON.stringify(resultData)
         }*/


        let sfuncs = options.dataViews[0].categorical.categories[6].values; //Source Function
        let tfuncs = options.dataViews[0].categorical.categories[7].values; //Target Function



        //Metric Values
        //let sValues = options.dataViews[0].categorical.categories[8].values; //Source Metric XI
        //let tValues = options.dataViews[0].categorical.categories[9].values; //Target Metric XI
        let sValues = options.dataViews[0].categorical.values[1].values; //Source Metric XI
        let tValues = options.dataViews[0].categorical.values[2].values;

        //let metrictooltip = options.dataViews[0].categorical.categories[8].values; //Target Function


        //Pushing data for all elements
        rows.push(rows[0]);
        cols.push(cols[0]);
        levels.push(levels[0]);
        tlevels.push(tlevels[0]);
        kops.push(kops[0]);
        branches.push(branches[0]);
        //sfuncs.push("test");
        //tfuncs.push("test");

        sValues.push(sValues[0]);
        tValues.push(tValues[0]);

        //console.log('rows', rows);
       // console.log('branches list', branches);


      // console.log('check resultData 1', resultData);
       //debugger;
     //  var resultRowMetricBranch = resultData.filter(i => i.isBranch != "$/Kg");
       // console.log('resultRowMetricBranch',resultRowMetricBranch);


       //console.log('resultRowMetricBranch 2',resultData[0].isBranch);

        //testing filtering metric branch
        //if (selectedMetric!= "") {
            //var resultRowMetricBranch = resultData.filter(i => i.Target == "Brief Rate");
           // links.filter(i => i.Target != "null")
           //var resultRowMetricBranch = resultData.filter(i => i.IsPrimaryBranch == false);
            //var resultRowMetricBranch = resultData;//.filter(item => item.Source!="");
           // console.log('resultRowMetricBranch',resultRowMetricBranch);
            
           /* debugger;
            var newMetricBranchList = resultData.filter(function(item) {
                
                return item.isBranch == "Brief Rate";
            });
            */

           // console.log('newMetricBranchList',newMetricBranchList);
       // }

        //console.log('rows.length', rows.length);
        for (let i = 0; i < rows.length; i++) 
        {


            let row = rows[i];

            //console.log('check resultData 2', resultData);
            //filtering result row
            var resultRow = resultData.filter(item =>
                item.Source == row.toString()
                && item.Target == cols[i].toString()
                && item.Level == levels[i].toString()
                && item.TLevel == tlevels[i].toString()
                && item.Kop == kops[i].toString()
            );
           // console.log('resultRow ' + i.toString() + ' = ', resultRow);

           /* var resultRow2 = resultData.filter(item =>
                item.isBranch != ""
            );
            console.log('resultRow2 ' + i.toString() + ' = ', resultRow2);
            */
            let IsPrimaryBranch = false;
            if (Visual.metricA == branches[i].toString()) {
                IsPrimaryBranch = true;
            }

            if (resultRow.length == 0) {

               //Validate we only display the selected metric

               //console.log('selectedMetric',selectedMetric);
               //console.log('metric branch', String(branches[i]));

                //Validate if record metric branch is not blank and if its different than selectedmetric

               // if (selectedMetric == "" ) {

                   // if (branches[i].toString() == selectedMetric){
                   
                   // debugger;
                   //console.log('i: ', i + " / " + branches[i]);
                   // if ( branches[i] == selectedMetric){
                        
                       // console.log('branch: ', String(branches[i]) + " / "+ selectedMetric);
                   //}
                  //  else
                  //  {
                            
                           // console.log('check resultData 3', resultData);
                            //Validate if source metric is equals to target metrics, we avoid to load this records
                            if (row.toString() == String(cols[i])) {
                                // console.log('no agregar', row.toString());
                            } else {


                                //Identify Correct Target Index 
                                //let targetIX = 15;
                                //console.log('source', row);
                                let searchValue =  String(cols[i]);
                                //console.log('searchValue', searchValue);
                                
                                let targetIX = rows.indexOf(searchValue);
                                //console.log('targetIndex', targetIX);

                                
                                //fill result data
                                resultData.push({
                                    Source: row.toString(),
                                    Target: String(cols[i]),
                                    Level: levels[i].toString(),
                                    TLevel: String(tlevels[i]),
                                    Kop: String(kops[i]),
                                    isBranch: String(branches[i]),
                                    SFunction: [String(sfuncs[i])],
                                    TFunction: [String(tfuncs[i])],
                                    SValue: String(sValues[i]),//sourceValueIX, //Number(Visual.getRandomNumber(0, 2)),//Number(sValues[i]),
                                    TValue: String(tValues[i]), //targetValueIX, //Number(Visual.getRandomNumber(0, 2)),//Number(tValues[i]),
                                    sSelectionId: host.createSelectionIdBuilder()
                                        .withCategory(options.dataViews[0].categorical.categories[0], i) //This is required for tooltip chart
                                        .createSelectionId()
                                    ,tSelectionId: host.createSelectionIdBuilder()
                                        .withCategory(options.dataViews[0].categorical.categories[0], targetIX) //This is required for tooltip chart
                                        .createSelectionId()
                                    ,BranchSelectionId: host.createSelectionIdBuilder()
                                        .withCategory(options.dataViews[0].categorical.categories[5], i)
                                        //.withMeasure(options.dataViews[0].categorical.values.values[i].displayName)
                                        .createSelectionId()
                                    , IsPrimaryBranch: IsPrimaryBranch
                                    , Tooltip: [row.toString(), tlevels[i].toString(), "White"]
                                });
                            }

                           // console.log('check resultData 4', resultData);
                  //}

              //}

            }
            else 
            {
                //sfuncs
                var sfuncRows = resultData.filter(item =>
                    item.Source == row.toString()
                    && item.Target == cols[i].toString()
                    && item.Level == levels[i].toString()
                    && item.TLevel == tlevels[i].toString()
                    && item.Kop == kops[i].toString()
                    && item.SFunction.indexOf(String(sfuncs[i])
                    ) == -1

                );
                if (sfuncRows.length > 0 && sfuncs[i]) {
                    resultData.find(val => val == sfuncRows[0]).SFunction.push(String(sfuncs[i]));
                }

                //tfuncs
                var tfuncRows = resultData.filter(item =>
                    item.Source == row.toString()
                    && item.Target == cols[i].toString()
                    && item.Level == levels[i].toString()
                    && item.TLevel == tlevels[i].toString()
                    && item.Kop == kops[i].toString()
                    && item.TFunction.indexOf(String(tfuncs[i])) == -1
                );

                if (tfuncRows.length > 0 && tfuncs[i]) {
                    //Not In
                    resultData.find(val => val == tfuncRows[0]).TFunction.push(String(tfuncs[i]));
                }
            }


            //Testing single record
            //if (row.toString() == "Days Payable Outstanding (DPO)" && String(cols[i]) == "On Time Payment") {
           /* if (String(branches[i]) == "Zero & Single Touch Invoices %") {
                console.log('getting id', i);
                console.log('rows id', rows[i]);
                console.log('cols id', cols[i]);
                console.log('levels id', levels[i]);
                console.log('tlevels id', tlevels[i]);
                console.log('kops id', kops[i]);
                console.log('branches id', branches[i]);
                console.log('sValues id', sValues[i]);
                console.log('tValues id', tValues[i]);

            }*/

            //checking this part
            //adding rows in the data view main
            if (row.toString() == String(cols[i])) {
                // console.log('no agregar', row.toString());
            } else {


                let searchValue =  String(cols[i]);
                //console.log('searchValue', searchValue);
                
                let targetIX = rows.indexOf(searchValue);
                //console.log('targetIndex', targetIX);
                
                //fill result data
                resultDataMain.push({
                    Source: row.toString(),
                    Target: String(cols[i]),
                    Level: levels[i].toString(),
                    TLevel: String(tlevels[i]),
                    Kop: String(kops[i]),
                    isBranch: String(branches[i]),
                    SFunction: [String(sfuncs[i])],
                    TFunction: [String(tfuncs[i])],
                    SValue: String(sValues[i]),//sourceValueIX, //Number(Visual.getRandomNumber(0, 2)),//Number(sValues[i]),
                    TValue: String(tValues[i]), //targetValueIX, //Number(Visual.getRandomNumber(0, 2)),//Number(tValues[i]),
                    sSelectionId: host.createSelectionIdBuilder()
                        .withCategory(options.dataViews[0].categorical.categories[0], i) //This is required for tooltip chart
                        .createSelectionId()
                    ,tSelectionId: host.createSelectionIdBuilder()
                        .withCategory(options.dataViews[0].categorical.categories[0], targetIX) //This is required for tooltip chart
                        .createSelectionId()
                    ,BranchSelectionId: host.createSelectionIdBuilder()
                        .withCategory(options.dataViews[0].categorical.categories[5], i)
                        .createSelectionId()
                    , IsPrimaryBranch: IsPrimaryBranch
                    , Tooltip: [row.toString(), tlevels[i].toString(), "White"]
                });
            }
        }

        console.log('Visual.metricList.length',Visual.metricList.length);
        console.log('Visual.metricList',Visual.metricList);

        if (this.dataMainView == null)
        {
            
            console.log('dataMainView is null');    
            this.dataMainView = resultDataMain;
        }
        else
        {
            console.log('dataMainView is not null');   
            //this.dataMainView = resultDataMain;
        }

         let selectedMetric = "";
         if (Visual.metricList.length == 0)
         {
             //console.log('set dataMain');
             //this.dataMain = options.dataViews[0];
             //this.dataMainView = resultDataMain;
         }else
         {
             selectedMetric = Visual.metricList[0];
             //console.log('NO set dataMain');
         }
         
        // console.log('dataMainView', this.dataMainView);

       /* //Filtering results based on selected metric 
        var resultRowMetricBranch = resultData.filter(i => i.isBranch == selectedMetric); //"Brief Rate"
        console.log('resultRowMetricBranch',resultRowMetricBranch);

        //testing using this.dataMain
        var testDataMain = this.dataMain;
        */

       console.log('selectedMetric', selectedMetric);
       console.log('dataMainView', this.dataMainView);

       //console.log('dataMainView json',JSON.stringify(this.dataMainView));

        if (selectedMetric != "")
        {
            //debugger;
            var resultRowMetricBranch = this.dataMainView.filter(i => i.isBranch == selectedMetric); //"Brief Rate"
            console.log('resultRowMetricBranch',resultRowMetricBranch);
        }
        //var resultRowMetricBranch2 = this.dataMainView.filter(i => i.isBranch == "Zero & Single Touch Invoices %"); //"Brief Rate"
        //var resultRowMetricBranch2 = this.dataMainView.filter(i => i.Source == "Days Payable Outstanding (DPO)");
        //console.log('resultRowMetricBranch2',resultRowMetricBranch2);


        //host.applyJsonFilter(null, "general", "filter", FilterAction.merge);


        if (branchesList.length > 1) //if branches has more than one unique values then return empty
        {
            // Visual.allData = resultData;
             resultData = [];
             return resultData;
        }

        if (selectedMetric != "" && resultRowMetricBranch.length > 0)
        {
             return resultRowMetricBranch;
        }
        else
        {
            return resultData;
        }

       // return resultData;
        
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }


    private static getTooltipDataCircle(value: any): VisualTooltipDataItem[] {
        //console.log('getTooltipData value', value);
        let metricValue = value.metricValue.toString();
        if (metricValue == "null") {
            metricValue = "Does not exist in data model";
        }

        return [{
            //displayName: value.tooltipData[0],
            // value: value.tooltipData[2],
            //color: value.tooltipData[2]


            displayName: value.lvl + " - " + value.name,
            value: metricValue,
            color: "#333333"
        }];
    }
    private static getTooltipDataCircleTest(value: any): VisualTooltipDataItem[] {
        //console.log('getTooltipDataTest value', value);
        return [{

            displayName: value.tooltipInfo[0].displayName,
            value: value.tooltipInfo[0].value,
            color: value.tooltipInfo[0].color,
        }];
    }

    private static getSelectionIdCircleTest(value: any): VisualTooltipDataItem[] {

        return [{

            displayName: value.tooltipInfo().selectionId,
            value: "111",
            color: "Red",
            ////header: 'ToolTip Title'
        }];
    }

    private static getTooltipData(value: any): VisualTooltipDataItem[] {
        //console.log('getTooltipData value', value);
        return [{

            //version 2
            displayName: value[0].displayName,
            value: value[0].value.toString()
        }];
    }

}


