import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    dataPoint: dataPointSettings;
    /** Instance of our card settings - note that the property name matches `capabilities.json` */
    card: CardSettings;
}
export declare class dataPointSettings {
    defaultColor: string;
    showAllDataPoints: boolean;
    fill: string;
    fillRule: string;
    fontSize: number;
}
/**
*  Manages the card settings in our visual - note that property names need to match that of
*  `capabilities.json` in order to be included
*/
export declare class CardSettings {
    /** Fill Colour */
    fillColour: string;
    /** Stroke Width */
    strokeWidth: number;
}
