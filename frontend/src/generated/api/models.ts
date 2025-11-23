// Generated API Models
export enum ContentSource {
    Motor = 'Motor',
    ProDemand = 'ProDemand',
    AllData = 'AllData'
}

export interface ModelAndVehicleId {
    id: string;
    model: string;
    engines?: any[];
}

export interface VehicleResponse {
    body: Array<{
        model: string;
        id: string;
        engines?: any[];
    }>;
}

export interface VehicleNameResponse {
    body: string;
}
