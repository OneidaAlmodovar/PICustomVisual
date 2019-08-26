import { Visual } from "../../src/visual";
var powerbiKey = "powerbi";
var powerbi = window[powerbiKey];

var fDGSLB6CD030FDBC7C490BA5DC94C53F1597FA_DEBUG = {
    name: 'fDGSLB6CD030FDBC7C490BA5DC94C53F1597FA_DEBUG',
    displayName: 'VCT Custom Relationship',
    class: 'Visual',
    version: '1.0.0',
    apiVersion: '2.6.0',
    create: (options) => {
        if (Visual) {
            return new Visual(options);
        }

        console.error('Visual instance not found');
    },
    custom: true
};

if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["fDGSLB6CD030FDBC7C490BA5DC94C53F1597FA_DEBUG"] = fDGSLB6CD030FDBC7C490BA5DC94C53F1597FA_DEBUG;
}

export default fDGSLB6CD030FDBC7C490BA5DC94C53F1597FA_DEBUG;