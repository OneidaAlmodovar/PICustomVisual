import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import { VisualViewModel } from "./visualViewModel";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;


import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { VisualSettings } from "./settings";
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import SelectionId = powerbi.extensibility.ISelectionId;

import Selector = powerbi.data.Selector;
import SelectorsByColumn = powerbi.data.SelectorsByColumn;

import ISelectionIdBuilder = powerbi.extensibility.ISelectionIdBuilder;
import * as d3 from "d3";

//import IViewModel = powerbi.extensibility.visual.IVisual;
import * as models from 'powerbi-models';
import { dataRoleHelper } from "powerbi-visuals-utils-dataviewutils";
//import IVisual = powerbi.extensibility.visual.IVisual;
//import IVisuals = powerbi.extensibility.visual;


//interface powerbi.extensibility.visual.IDimensions
//import IDimensions = powerbi.extensibility.visual.IDimensions;


//interface powerbi.extensibility.visual.IDimensions

//import { IDimensions } from "powerbi-visuals-utils-formattingutils";

//powerbi.extensibility.utils.formatting

//powerbi.extensibility.visual.IViewModel
export function visualTransform(dataViews: DataView[]): VisualViewModel {
    const viewModel: VisualViewModel = {
        categories: [],
        values: []
    };
    if (dataViews && dataViews[0]) {
        const dataView: DataView = dataViews[0];
        const categorical: DataViewCategorical = dataView.categorical;
        if (categorical) {
            const categories: DataViewCategoryColumn[] = categorical.categories;
            const series: DataViewValueColumns = categorical.values;

            if (categories && series && categories.length > 0 && series.length > 0) {
                for (let i: number = 0, catLength: number = categories[0].values.length; i < catLength; i++) {
                    viewModel.categories.push({
                        color: "white",
                        value: <string>categories[0].values[i],
                        identity: ""
                    });

                    for (let k: number = 0, seriesLength: number = series.length; k < seriesLength; k++) {
                        let value: any = series[k].values[i];
                        if (k === 0) {
                            viewModel.values.push({ values: [] });
                        }
                        viewModel.values[i].values.push(value);
                    }
                }
            }
        }
    }
    return viewModel;
}

export function exampleFunction(): void {
    console.log('this is exampleFunction');
}


interface VisualTooltipDataItem {
    displayName: string;
    value: string;
    color?: string;
    header?: string;
    opacity?: string;
}

    /**
    *  Used to specify everything needed to render a textual value within the card
    * 
    *  @property {string} text                     - The displayed text
    *  @property {IHtmlAttribute[]} attributes     - Array of attributes to apply to the text
    *  @property {IHtmlAttribute[]} styles         - Array of CSS styles and their values
    */
   export interface ICardLabel{
    text: string;
    attributes: IHtmlAttribute[];
    styles: IHtmlAttribute[];
    }

    
    /**
    *  Used to specify everything needed to render a textual value within the card
    * 
    *  @property {string} text                     - The displayed text
    *  @property {IHtmlAttribute[]} attributes     - Array of attributes to apply to the text
    *  @property {IHtmlAttribute[]} styles         - Array of CSS styles and their values
    */
   export interface ICardText {
    text: string;
    attributes: IHtmlAttribute[];
    styles: IHtmlAttribute[];
    }

    /**
     *  Simple interface used to apply generic key/value pairs, e.g. for styling and attributes
     *  
     *  @property {string} key                      - Name of the property to assign
     *  @property {string} value                    - Value of the assigned property
     */
    export interface IHtmlAttribute {
        key: string;
        value: string;
    }

  /**
   *  Used to specify padding attributes for element positioning or styling
   * 
   *  @property {number} left                     - Number of pixels to pad from the left
   *  @property {number} top                      - Number of pixels to pad from the top
   */
  export interface IPadding {
    left?: number;
    top?: number;
}


export interface ISelectionId {
    //ISelectionId: 1;
    equals(other: ISelectionId): boolean;
    includes(other: ISelectionId, ignoreHighlight?: boolean): boolean;
    getKey(): string;
    getSelector(): Selector;
    getSelectorsByColumn(): SelectorsByColumn;
    hasIdentity(): boolean;
}

  /**
     *  Used to specify everything needed to successfully render the card within our visual
     * 
     *  @property {IPadding} padding                - Padding from top/left for card
     *  @property {IDimensions} dimensions          - Dimensions of the card container
     *  @property {IHtmlAttribute[]} attributes     - Array of SVG attributes to apply to the card `rect` element
     *  @property {IHtmlAttribute[]} styles         - Array of CSS styles and their values
     *  @property {ICardText} measureValue          - The displayed measure value
     *  @property {ICardLabel} measureLabel          - The label displayed underneath the measure value
     *  @property {VisualTooltipDataItem[]}         - Array of tooltip entries for the card
     */
    export interface ICard {
        padding: IPadding;
        dimensions: IDimensions;
        attributes: IHtmlAttribute[];
        styles: IHtmlAttribute[];
        measureValue: ICardText;
        measureLabel: ICardLabel;
        tooltips?: VisualTooltipDataItem[];
        measureSelectionId: ISelectionId;
    }

 /**
     *  Used to specify any dimension attributes, for sizing, etc.
     * 
     *  @property {number} width                    - Width of element, in pixels
     *  @property {number} height                   - Height of element, in pixels
     */
    export interface IDimensions {
        width?: number;
        height?: number;
    }
  /**
     *  Everything we need to render our visual
     * 
     *  @property {VisualSettings} settings         - Parsed visual settings
     *  @property {IDimensions} dimensions          - Dimensions of the visual container
     *  @property {ICard} card                      - Card configuration and logic
     */
    export interface IViewModel {
        settings: VisualSettings; //class powerbi.extensibility.visual.VisualSettings
        dimensions: IDimensions;
        card: ICard;
    }


 /**
     *  Map the data view and settings into a view model, suitable for our `update` method.
     * 
     *  @param {VisualUpdateOptions} options        - Visual update options (passed through from `update` method)
     *  @param {VisualSettings} visualSettings      - Parsed visual settings
     */
    export function visualTransformData(options: VisualUpdateOptions, visualSettings: VisualSettings, host: IVisualHost): IViewModel {

        /** Current dimensions of visual viewport */
            let viewportWidth: number = options.viewport.width,
                viewportHeight: number = options.viewport.height;

        /** 
         *  Options for calculating layouts; the defaults we were previously hard-coding here, so that we
         *  can swap them out more easily for settings if we want to introduce them to the visual.
         */
            let defaults = {
                    padding: {
                        top: 2,
                        left: 2
                    },
                    card: {
                        fillOpacity: '0.5',
                        stroke: 'black'
                    }
                }

        /** Calculations that we might be prone to repeating when mapping */
            let measureValueFontSize: number = Math.min(viewportWidth, viewportHeight) / 5,
                cardDimensions: IDimensions = {
                    width: viewportWidth - (defaults.padding.left * 2),
                    height: viewportHeight - (defaults.padding.top * 2)
                };

        /** Default view model; used if we can't do everything we need and represents minimum draw */
            let viewModel: IViewModel = {
                settings: visualSettings,
                dimensions: {
                    width: viewportWidth,
                    height: viewportHeight,
                },
                card: {
                    padding: {
                        top: defaults.padding.top,
                        left: defaults.padding.left
                    },
                    dimensions: cardDimensions,
                    attributes: [
                        {
                            key: 'x',
                            value: `${defaults.padding.left}`
                        },
                        {
                            key: 'y',
                            value: `${defaults.padding.top}`
                        },
                        {
                            key: 'width',
                            value: `${cardDimensions.width}`
                        },
                        {
                            key: 'height',
                            value: `${cardDimensions.height}`
                        }
                    ],
                    styles: [
                        {
                            key: 'fill',
                            value: visualSettings.card.fillColour
                        },
                        {
                            key: 'fill-opacity',
                            value: defaults.card.fillOpacity
                        },
                        {
                            key: 'stroke',
                            value: defaults.card.stroke
                        },
                        {
                            key: 'stroke-width',
                            value: `${visualSettings.card.strokeWidth}`
                        }
                    ],
                    measureValue: {
                        text: '(blank)',
                        attributes: [
                            {
                                key: 'x',
                                value: '50%'
                            },
                            {
                                key: 'y',
                                value: '50%'
                            },
                            {
                                key: 'dy',
                                value: '0.35em'
                            },
                            {
                                key: 'text-anchor',
                                value: 'middle'
                            }
                        ],
                        styles: [
                            {
                                key: 'font-size',
                                value: `${measureValueFontSize}`
                            }
                        ]
                    },
                    measureLabel: {
                        text: '[No Measure Supplied]',
                        attributes: [
                            {
                                key: 'x',
                                value: '50%'
                            },
                            {
                                key: 'y',
                                value: `${viewportHeight / 2}`
                            },
                            {
                                key: 'dy',
                                value: `${measureValueFontSize / 1.2}px`
                            },
                            {
                                key: 'text-anchor',
                                value: 'middle'
                            }
                        ],
                        styles: [
                            {
                                key: 'font-size',
                                value: `${measureValueFontSize / 4}px`
                            }
                        ]
                    },
                    tooltips: [],
                    measureSelectionId: null
                }                
            }

        /** 
         *  We now need to try and update the view model with the information from the data view.
         * 
         *  First, we'll get this and then we can do some tests to make sure that we're happy that the data view
         *  conforms to our requirements before we proceed.
         */
            let dataViews = options.dataViews;

            //console.log('VisulTranform dataViews',dataViews);

        /** 
         *  We need to test that we have the valid data view mapping, and that there are values inside it.
         *  Otherwise, there's no point proceeding.
         */
            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].metadata
                || !dataViews[0].categorical
                || !dataViews[0].categorical.values
            ) {
                return viewModel;    
            }

        /** 
         *  At this point, we can attempt to retrieve measure and tooltip fields from the data view as we know
         *  that the structure is valid.
         */
          /*  let measureData = dataViews[0].categorical.values.filter(
                    c => c.source.roles['measure']
                )[0],
                tooltipData = dataViews[0].categorical.values.filter(
                    c => c.source.roles['tooltip']
                );*/

            let measureData = dataViews[0].categorical.values.filter(
                    c => c.source.roles['measure']
                )[0].values,
                tooltipData = dataViews[0].categorical.values.filter(
                    c => c.source.roles['measure']
                )[1].values;

           // console.log('measureData',measureData);

            /*console.log('test 1', dataViews[0].categorical.values.filter(
                                c => c.source.roles['measure']
                            )[0].source.roles
                        );

            console.log('test 2', dataViews[0].categorical.values.filter(
                            c => c.source.roles['measure']
                        )[0].source.roles
                    );*/

                //measureData = ["uno","dos"];


        /** 
         *  One additional test to make sure that we have a field in the Measure role, otherwise we should not 
         *  proceed. 
         */
            if (!measureData) {
                return viewModel;
            }

        /** 
         *  At this point, we know we have everything to manage a full render, so update the parts of the view
         *  model that we need to
         */

            /** Update the measure details */
              /* viewModel.card.measureValue.text = valueFormatter.format(
                                                            measureData.values[0],
                                                            measureData.source.format
                                                        );
                viewModel.card.measureLabel.text = measureData.source.displayName;*/

            /*    viewModel.card.measureValue.text = valueFormatter.format(
                    measureData.values[0],
                    measureData.source.format
                );
            viewModel.card.measureLabel.text = measureData.;
*/
    
                viewModel.card.measureValue.text = "7";//dataViews[0].categorical.values[0].source.index.toString(); //"8";
                viewModel.card.measureLabel.text = "Title Label Name";//dataViews[0].categorical.values[0].source.displayName; //"display name";
                //viewModel.card.meas

            /** Manage the tooltips */

                /** The measure value */ //Add title
                 /*   viewModel.card.tooltips.push({
                        displayName: viewModel.card.measureLabel.text,
                        value: viewModel.card.measureValue.text,
                        color: "Green"//visualSettings.card.fillColour
                    });*/

                    //add sample data
                   /* viewModel.card.tooltips.push({
                        displayName: "Jan",
                        value: "7",
                        color: "Yellow"
                    })*/

                    //Adding months
                    viewModel.card.tooltips.push({displayName: "",value: "",color: "#333333"});
                    //viewModel.card.tooltips.push({displayName: "Feb",value: "2",color: "Green"});
                    //viewModel.card.tooltips.push({displayName: "Mar",value: "3",color: "White"});
                    //viewModel.card.tooltips.push({displayName: "Apr",value: "4",color: "Gray"});
                    //viewModel.card.tooltips.push({displayName: "May",value: "5",color: "Purple"});
                    //viewModel.card.tooltips.push({displayName: "Jun",value: "6",color: "Red"});
                    //viewModel.card.tooltips.push({displayName: "Jul",value: "7",color: "Blue"});
                    //viewModel.card.tooltips.push({displayName: "Aug",value: "8",color: "Brown"});
                    //viewModel.card.tooltips.push({displayName: "Sep",value: "9",color: "#333333"});
                    //viewModel.card.tooltips.push({displayName: "Oct",value: "10",color: "#333333"});
                    //viewModel.card.tooltips.push({displayName: "Nov",value: "11",color: "#333333"});
                    //viewModel.card.tooltips.push({displayName: "Dec",value: "12",color: "#333333"});

                /** Iterate through all fields in the Tooltip role and add to the tooltip array */
                  /*  tooltipData.map((t) => {
                        viewModel.card.tooltips.push({
                            displayName: "Text Label Name", //t.source.displayName,
                            //value: valueFormatter.format(t.values[0],t.source.format)
                            value: t.toString(),
                            color: "Red"
                        })
                    });
                    */

                /** Add selection ID to measure for report page tooltips */
                   /* viewModel.card.measureSelectionId = 
                        host.createSelectionIdBuilder()
                            //.withMeasure(measureData.source.queryName)
                            .withCategory(options.dataViews[0].categorical.categories[0], 1)
                            //.withCategory(options.dataViews[0].categorical[0].categories[0], 1)
                            .withMeasure(options.dataViews[0].metadata.columns[8].queryName)
                            .createSelectionId()
                        ;
                        */
                        /** Add selection ID to measure for report page tooltips */

                        viewModel.card.measureSelectionId = host.createSelectionIdBuilder()
                                        //.withMeasure(options.dataViews[0].metadata.columns[8].displayName)
                                        //.withCategory(options.dataViews[0].categorical.categories[5], 1)
                                        .withCategory(options.dataViews[0].categorical.categories[0], 1)
                                        .createSelectionId()
                        ;

                      //  viewModel.card.measureSelectionId = 

                      /*  viewModel.card.measureSelectionId = host.createSelectionIdBuilder()
                                                        .withMeasure(options.dataViews[0].categorical[0].values.source[0].displayName)
                                                        ;*/


                          /** Add selection ID to measure for report page tooltips */
                         // viewModel.card.measureSelectionId = host.createSelectionIdBuilder()
                         // .withMeasure(measureData.source.queryName);

        /** Our resulting view model */
            return viewModel;

    }


    export interface CategoryViewModel {
        value: string;
        identity: string;
    }

    export interface ValueViewModel {
        values: string;//any[]
    }

    export interface ViewModel {
        categories: CategoryViewModel[];
        values: ValueViewModel[];
    }
    export function visualTransformChart(options: VisualUpdateOptions, visualSettings: VisualSettings, host: IVisualHost): ViewModel {


        var viewModel: ViewModel = {
            categories: [],
            values: []
        }
        
        let dataViews = options.dataViews;
        if (dataViews) {
            var categorical = dataViews[0].categorical;
            if (categorical) {
               // var categories = categorical.categories;
              //  var series = categorical.values;
                //var formatString = dataView.metadata.columns[0].format;


                var  categories = dataViews[0].categorical.values.filter(c => c.source.roles['measure'])[0].values;
                var  series = dataViews[0].categorical.values.filter(c => c.source.roles['measure'])[1].values;


                if (categories && series && categories.length > 0 && series.length > 0) {
                 
                    for (var i = 0, catLength = categories.length; i < catLength; i++) {
                        viewModel.categories.push({
                            value: categories[i].toString(),
                            identity: ''
                        });

                        viewModel.values.push({
                            values: i.toString()
                        })

                      
                    }
                    /*  for (var i = 0, catLength = categories.length; i < catLength; i++) {
                        viewModel.categories.push({
                            value: categories[i].toString(),
                            identity: ''
                        })
                    }
                    for (var k = 0, seriesLength = series.length; k < seriesLength; k++) {
                       
                         viewModel.values.push({
                             values: series[k]
                         })
                }*/

                }
            }
        }

        return viewModel;


    }
    