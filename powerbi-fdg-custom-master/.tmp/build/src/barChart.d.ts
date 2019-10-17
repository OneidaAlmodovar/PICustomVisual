import powerbi from "powerbi-visuals-api";
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.extensibility.ISelectionId;
import DataViewObjects = powerbi.DataViewObjects;
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
}
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
    displayName: string;
    value: number;
    category: string;
    color: string;
    selectionId: ISelectionId;
}
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
* Function that converts queried data into a view model that will be used by the visual.
*
* @function
* @param {VisualUpdateOptions} options - Contains references to the size of the container
*                                        and the dataView which contains all the data
*                                        the visual had queried.
* @param {IVisualHost} host            - Contains references to the host which contains services
*/
export declare function visualTransformBarChart(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel;
/**
* Gets property value for a particular object in a category.
*
* @function
* @param {DataViewCategoryColumn} category - List of category objects.
* @param {number} index                    - Index of category object.
* @param {string} objectName               - Name of desired object.
* @param {string} propertyName             - Name of desired property.
* @param {T} defaultValue                  - Default value of desired property.
*/
export declare function getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T;
/**
* Gets property value for a particular object.
*
* @function
* @param {DataViewObjects} objects - Map of defined objects.
* @param {string} objectName       - Name of desired object.
* @param {string} propertyName     - Name of desired property.
* @param {T} defaultValue          - Default value of desired property.
*/
export declare function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T;
export {};
