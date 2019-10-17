import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import { VisualViewModel } from "./visualViewModel";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import { VisualSettings } from "./settings";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import Selector = powerbi.data.Selector;
import SelectorsByColumn = powerbi.data.SelectorsByColumn;
export declare function visualTransform(dataViews: DataView[]): VisualViewModel;
export declare function exampleFunction(): void;
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
export interface ICardLabel {
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
    settings: VisualSettings;
    dimensions: IDimensions;
    card: ICard;
}
/**
    *  Map the data view and settings into a view model, suitable for our `update` method.
    *
    *  @param {VisualUpdateOptions} options        - Visual update options (passed through from `update` method)
    *  @param {VisualSettings} visualSettings      - Parsed visual settings
    */
export declare function visualTransformData(options: VisualUpdateOptions, visualSettings: VisualSettings, host: IVisualHost): IViewModel;
export interface CategoryViewModel {
    value: string;
    identity: string;
}
export interface ValueViewModel {
    values: string;
}
export interface ViewModel {
    categories: CategoryViewModel[];
    values: ValueViewModel[];
}
export declare function visualTransformChart(options: VisualUpdateOptions, visualSettings: VisualSettings, host: IVisualHost): ViewModel;
export {};
