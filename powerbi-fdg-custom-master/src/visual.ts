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

//Interface to handle data mapped from powerbi
export interface Relationship 
{
    Source: string;
    Target: string;
    Level: string;
    TLevel: string;
    SFunction: Array<string>;
    TFunction: Array<string>;
    Kop: string;
    selectionId: ISelectionId;
    isBranch: string;
}

//Import Libraries
import { VisualSettings } from "./settings";
import * as d3 from "d3";
import { Node } from './node';
import { Link } from './link';
import { hostname } from "os";
import { line, html } from "d3";

export class Visual implements IVisual 
{

    //private general variables
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    private host: IVisualHost;
    private svg: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
    private g: d3.Selection<SVGElement, any, HTMLElement, any>;
    private margin = { top: 20, right: 20, bottom: 20, left: 20 };
    private dataView: DataView;
    private selectionManager: ISelectionManager;
    private selectionIdBuilder: ISelectionIdBuilder;

    //General ClassName for visualization in html page
    private static ClassName: string = "slbrelationship";

    //Function to return only unique values in Array
    /*private getUniqueValues(value, index, self) 
    {
        return self.indexOf(value) === index;
    }*/

    //constructor method
    constructor(options: VisualConstructorOptions) 
    {
        console.log('Visual constructor', options); //Default console log for visual constructor
        this.target = options.element;

        this.host = options.host;
        //Initialize a SelectionIdBuilder | First, you need to create a SelectionIdBuilder in your constructor and store it in a private variable in your visual class for later use.
        this.selectionIdBuilder = options.host.createSelectionIdBuilder();
        //Initialize a SelectionManager | First, you need to create a SelectionManager in your constructor and store it in a private variable in your visual class for later use.
        this.selectionManager = options.host.createSelectionManager();

        // SVG (Scalable Vector Graphics)
        //Adding size and class for svg element. SVG has several methods for drawing paths, boxes, circles, text, and graphic images.
        this.svg = d3.select(options.element)
            .append('svg')
            .attr("width", "100%").attr("height", '100%')
            .classed(Visual.ClassName, true);
        //console.log('running');

        //Append g element into svg. <g> element is used to group SVG shapes together. 
        this.g = this.svg.append("g")
            .classed('gClass', true);

        //Zoom function for svg element
        this.svg.call(d3.zoom()
            .extent([[0, 0], [2000, 2000]])
            .scaleExtent([.1, 12])
            .on("zoom", zoomed));

        // g variable declaration
        let g = this.g;

        //zoomed function, this is for transform the g element
        function zoomed() {
            const { transform } = d3.event;
            console.log('zooming ...');
            console.log('transform', d3.event.transform);
            g.attr("transform", d3.event.transform);
        }
    }

    //method to update elements in page
    public update(options: VisualUpdateOptions) 
    {
        //set visual class settings
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        //Default console log for visual update
        console.log('Visual update', options); 

        //Clean the current visualization
        this.reset();

        //set dataview
        this.dataView = options.dataViews[0];

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

        //Declare links variable, we use converter function to map all columns specified in power bi
        let links = Visual.converter(options, this.host);

        //links2 variable is used to filter all target not null records and map it to Link Object [Source, Target, Kop], please see reference in /src/link.ts
        var links2 = links.filter(i => i.Target != "null").map(x => new Link(x.Source, x.Target, x.Kop));

        //source3 is used to map sources data into Node Object [Source, level, selectionId, isBranch, SFunction], please see reference in /src/Node.ts
        var sources3 = links.map(x => new Node(x.Source, x.Level, x.selectionId, x.isBranch, x.SFunction));

        //targets3 is used to map targets data into Node Object [Target, TLevel, selectionId, isBranch, TFunction], please see reference in /src/Node.ts
        var targets3 = links.map(x => new Node(x.Target, x.TLevel, x.selectionId, x.isBranch, x.TFunction));

        //nodesm3 is used to store concatenate data with targets and sources
        var nodesm3 = sources3.concat(targets3.filter(function (item) 
        {
            return !sources3.some(function (f) 
            {
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

        //getSvgPath function is used to convert straigh lines to curve lines, this function design the path to follow for the curved line
        //Parameter: Link object
        //Return Value: string path
        function getSvgPath(link: Link): string 
        {

            //Property to manage curvature, we can modify the curvature of curved lines
            var curvatureOfLinks = 0.5;

            let x0: number,
                x1: number,
                xi: (t: number) => number,
                x2: number,
                x3: number,
                y0: number,
                y1: number;

            //first case, point to the right and up
            if (link.target.x < link.source.x && link.target.y > link.source.y) {
                var distance = link.source.x - link.target.x;
                if (distance < 40) 
                {
                    distance = 0;
                    y0 = link.source.y + 40;
                }
                else 
                {
                    distance = 40;
                    y0 = link.source.y;
                }

                x0 = link.source.x - distance;
                x1 = link.target.x;
                y1 = link.target.y;

            }

            // second case points to the right and down
            if (link.target.x < link.source.x && link.target.y < link.source.y) 
            {
                var distance = link.source.x - link.target.x;
                if (distance < 40) 
                {
                    distance = 0;
                    y0 = link.source.y - 40;
                }
                else 
                {
                    distance = 40;
                    y0 = link.source.y;
                }

                x0 = link.source.x - distance;
                x1 = link.target.x;
                y1 = link.target.y;
            }

            // third case points to the left and up
            if (link.target.x > link.source.x && link.target.y > link.source.y) 
            {

                var distance = link.source.x - link.target.x;
                if (distance < -40) {
                    distance = 40;
                    y0 = link.source.y + 0;
                }
                else {
                    distance = 0;
                    y0 = link.source.y + 40;
                }

                x0 = link.source.x + distance;
                x1 = link.target.x;
                y1 = link.target.y;

            }

            // fourth case points left and down
            if (link.target.x > link.source.x && link.target.y < link.source.y) 
            {

                var distance = link.source.x - link.target.x;
                if (distance < -40) {
                    distance = 40;
                    y0 = link.source.y + 0;
                }
                else {
                    distance = 0;
                    y0 = link.source.y - 40;
                }

                x0 = link.source.x + distance;
                x1 = link.target.x;
                y1 = link.target.y;
            }

            xi = d3.interpolateNumber(x0, x1);
            x2 = xi(curvatureOfLinks);
            x3 = xi(1 - curvatureOfLinks);

            //return points path
            return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

            //var newy = y0-1;
            //return `M ${x0} ${y0} L${x0},${newy} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

        }

        // Define the div for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

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

        //marker function is used to add triangle markers at the start position for the lines, this function is dynamic and receive the color as a parameter from the link
        function markerStart(kop,color) 
        {
            //var val;

            svg.append("svg").append("svg:marker")
                .attr("id", "StartTriangle" + color)
                .attr("refX", 6)
                .attr("refY", 6)
                .attr("markerWidth", 30)
                .attr("markerHeight", 30)
                .attr("markerUnits", "userSpaceOnUse")
                .attr("orient", "auto-start-reverse")
                .append("path")
                .attr("d", "M 0 0 L 12 5 L 0 12 z")
                .style("fill", color);
                
             /*  svg.append("svg").append("svg:marker")
               .attr("id", "StartTriangle" + color)
               .attr("refX", 3)
               .attr("refY", 8)
               .attr("markerWidth", 13)
               .attr("markerHeight", 13)
               .attr("orient", "auto-start-reverse")
               .append("path")
               .attr("d", "M2,2 L2,13 L8,7 L2,2")
               .style("fill", color);
            */
          
            return "url(#StartTriangle" + color + ")";
        }

          //Start of the arrow
         /* svg.append("svg").append("svg:marker")
          .attr("id", "MidTriangle")
          .attr("refX", 0.1)
          .attr("refY", 1)
          .attr("markerWidth", 2)
          .attr("markerHeight", 4)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,0 V2 L1,1 Z")
          .style("fill", "orange")
          ;*/

        //Add curve lines
        var arrowColor;

        // link constant, we add links2 as defined data
        const link = g
            .selectAll("path")
            .data(links2)
            .join("path")
            .attr("stroke-width", function (d) { //this function is to modify stroke width line depending on the level
                return levelLineWidth[d.source.lvl];
            })
            //.attr("class", "link")
            .attr("fill","none")
            .attr('stroke', function (d) { return d.color; }) //this function is to return line color
            .attr("marker-start",
                function (d) {
                    arrowColor = markerStart(d.kop,d.color);
                    return markerStart(d.kop,d.color); //call markerStart function to return arrow for the line, if you need to delete just comment this lines
                })
            //.attr("marker-mid","MidTriangle")
            ;

        //Add kop title in link
        //link.append("title").text(function (d) { return d.kop; });
        
       /* link.append("title").text(function (d) { 
            console.log('link text', d.source.lvl);
            return "test one";
         });*/


    /*     
     //start add a basic curve line              
     svg.append("path")
         .attr("stroke-width", 2)
         .attr("stroke", "black")
         .attr("class", "link")
         .attr("d", testM())
         ;
     function testM() {
         return "M" + 80 + "," + 100               // start at the child node
             + "C" + 80 + "," + (100 + 150) / 2    // pull the line a little upward
             + " " + 200 + "," + (100 + 150) / 2   // pull the line a little downward
             + " " + 200 + "," + 150;              // end at the parent node
     }

     //end add a basic curve line   
    */


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
            var returnValueColor;

            if (d.isBranch) {
                returnValueColor = "#fff";
            }
            else {
                returnValueColor = businessWorkflows[d.func[0]];
                if (businessWorkflows[d.func[0]] == undefined)
                {
                    returnValueColor = "#666666";
                }
            }

            //bw is acronym of business workflow, this variable store list of values like this one: Values Sample:["TLM", "test"]
            var bw = d.func;
            //console.log('d.func',JSON.stringify(d));

            //Gradient percentage shouls start in 0, this is the start position for initial color
            var gradientPercentage = 0;
            //counter variable is to handle different colors in circle
            var counter = 0;

            if (bw.length > 0) 
            {
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
            bw.forEach(function (item) 
            {

                //color of the current item depending on item.value
                var itemColor;

                if (d.isBranch) 
                {
                    itemColor = "#fff"; //white color in branch cases
                }
                else 
                {
                    //set color for item based on businessWorkflows color list
                    itemColor = businessWorkflows[item];
                    if (businessWorkflows[item] == undefined)
                    {
                        itemColor = "#666666";
                    }
                    //console.log('itemColor',item, itemColor);
                }

                var offSetValue = 100;
                //to handle two colors, should work using 50% for first color, and 50 for second color
                if (bw.length == 1) 
                {
                    offSetValue = 100;
                }
                else 
                {
                    if (bw.length == 2) 
                    {
                        offSetValue = 50;
                    }
                    else 
                    {
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
        }

        //selectionManager variable to store Id index element indicator
        let selectionManager = this.selectionManager;

        //constant node variable, this is to handle all the information about nodes
        const node = g
                    .selectAll("circle")
                    .data(nodesm) //takes data from nodesm object
                    .join("circle")//using circles shapes
                    .attr("stroke", d => d.isBranch ? "#9ff5d6" : "#fff")
                    .attr("stroke-width", d => d.isBranch ? 3 : 1.5)
                    .attr("r", d => d.r(nodesm.length)) // Get Radio of circle and set the r attribute
                    .attr("fill",
                        function (d) {
                            return circleColor(d); //Multicolor function
                        })
                    .on('click', function (d) { //click event, right now is doing nothing but is prepared for future events using circle_onclick
                        console.log('click!');
                        console.log('selecting', d.selectionId);
                        selectionManager.select(d.selectionId);
                        (<Event>d3.event).stopPropagation();
                    });
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
                    .attr("font-size",  "9px")
                    .attr("x",0)
                    .attr("y",0)
                    .attr("fill","gray")
                    //Set the link text name
                    .text(function (d) { return d.source.lvl; });

        //end link name

        //We call the wrap function to split the text in many records, using wrap function visually looks better because everything does not appear in the same line
        textg.selectAll("text").call(wrap, 200);

        force.tick(300);
        //force layout uses a physics based simulator for positioning visual elements. The force layout allows us to position elements
        //Setting attributes values for this elements: node, link, text, text2, 
        node
            .attr("cx", d => d.x)// position the x-centre
            .attr("cy", d => d.y)// position the y-centre
            .attr("class", function (d) { //in case to add some style to the circle
                if (d.name.indexOf("M1") > -1) {
                    return "circle-m1";
                }
                else if (d.name.indexOf("M2") > -1) {
                    return "circle-m2";
                }
                else if (d.name.indexOf("M3") > -1) {
                    return "circle-m3";
                }
                else if (d.name.indexOf("M4") > -1) {
                    return "circle-m4";
                }
                else if (d.name.indexOf("M5") > -1) {
                    return "circle-m5";
                }
                else return "circle-m5";
            })
            .on("mouseover", function (d) {
                            div.transition() //onmouseover for tooltip feature
                                .duration(200)
                                .style("opacity", .8);
                            //In this part we can add the tooltip information 
                            div.html("<br/>" 
                                + "Level: " + d.lvl + "<br/>"
                                + "Metric: " + d.name + "<br/>"
                                + "Business Workflow: " + d.func + "<br/>"
                                + "" + "" + "<br/>")
                                .style("left", (d3.event.pageX)+ "px")
                                .style("top", (d3.event.pageY - 28) + "px");
                            }
                )
            .on("mouseout", function (d) { //onmouseout for tooltip feature
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        link
            .attr("d", getSvgPath); //The d attribute defines a path to be drawn. Using getSvgPath() function to return the path for curved line
        text
            .attr("transform", transform) //This is to add the labels below the circles
        text2
            .attr("transform", transform) //This is to add the labels in the circles
        textLine
          .attr("x", function (d) { return  ( d.source.x + d.target.x) * .5; }) // (x1 + x2) * .5 Return the corresponding position for x axis
          .attr("y", function (d) { return  ( d.source.y + d.target.y) * .5; }); // (y1 + y2) * .5 Return the corresponding position for y axis

        // Add legend step 1: general size and position
        var legend = svg.append("g")
            .attr("height", 100)
            .attr("width", 100)
            .classed("legend", true)
            .attr('transform', 'translate(5,5)');
        //add border stroke width to mark the legend
        var legendrect = legend.append("rect").attr("height", 100)
            .attr("width", 100).attr("fill", "white").attr("stroke", "#333").attr("stroke-width", .2);
        //add transform position for legend
        var legendrectg = svg.append("g").attr("class", "legend").attr("height", 100)
            .attr("width", 100).attr('transform', 'translate(10, 10)');

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
        legendrect.attr("height", legendrectg.node().getBBox().height + 10);

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
        //this.g.attr("extend", "[[0, 0], [600, 600]]");
        this.g.attr("translate", "0,0");

    }

    /** Parse function, check settings and return visual settings appropiate */
    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    //Function to return only unique values in Array
    private static getUniqueValues(value, index, self) 
    {
        return self.indexOf(value) === index;
    }

    //converter function is to get selected data in power bi and fill Relationship[] array, this function is transforming data in order to push elements
    public static converter(options: VisualUpdateOptions, host: IVisualHost): Relationship[] 
    {

        var resultData: Relationship[];
        resultData = [];

        //console.log('converting');
        //console.log('dataviews', options.dataViews[0]);
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
            )
            return resultData;

        //Reading power bi selected columns
        let rows = options.dataViews[0].categorical.categories[0].values; //Sources metric names
        let cols = options.dataViews[0].categorical.categories[1].values; //Targets metric names
        let levels = options.dataViews[0].categorical.categories[2].values; //source Level names
        let tlevels = options.dataViews[0].categorical.categories[3].values; //Target Level names
        let kops = options.dataViews[0].categorical.categories[4].values;//KOP Name / KeyProcessName
        let branches = options.dataViews[0].categorical.categories[5].values; // Metric Branch
        
        //console.log('branches.length', branches.length);
        //console.log('branches', branches);

        //Get a list of the unique metric values
        let branchesList = branches.filter(Visual.getUniqueValues);
        //console.log('branchesList.length', branchesList.length);
        //console.log('branchesList', branchesList);

        if (branchesList.length > 1)//if branches has more than one unique values then return empty
        {
            resultData = [];
            return resultData;
            //console.log('resultData empty');//JSON.stringify(resultData)
        }
        let sfuncs = options.dataViews[0].categorical.categories[6].values; //Source Function
        let tfuncs = options.dataViews[0].categorical.categories[7].values; //Target Function

        //Pushing elements
        rows.push(rows[0]);
        cols.push(cols[0]);
        levels.push(levels[0]);
        tlevels.push(tlevels[0]);
        kops.push(kops[0]);
        branches.push(branches[0]);
        //sfuncs.push("test");
        //tfuncs.push("test");

        for (let i = 0; i < rows.length; i++)
        {

            let row = rows[i];

            //filtering result row
            var resultRow = resultData.filter(item =>
                item.Source == row.toString()
                && item.Target == cols[i].toString()
                && item.Level == levels[i].toString()
                && item.TLevel == tlevels[i].toString()
                && item.Kop == kops[i].toString()
            );

            if (resultRow.length == 0)
            {
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
                    selectionId: host.createSelectionIdBuilder()
                        .withCategory(options.dataViews[0].categorical.categories[0], i)
                        .createSelectionId()
                });
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
                if (sfuncRows.length > 0 && sfuncs[i]) 
                {
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
        }

        return resultData;
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

}