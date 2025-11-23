import { Component } from '@angular/core';

@Component({
    selector: 'app-diagnostics',
    templateUrl: './diagnostics.component.html',
    styleUrls: ['./diagnostics.component.scss']
})
export class DiagnosticsComponent {
    categories = [
        { icon: '⚠️', name: 'Diagnostic Trouble Codes', description: 'DTC definitions and troubleshooting' },
        { icon: '🔧', name: 'Testing Procedures', description: 'System testing and diagnostics' },
        { icon: '📊', name: 'Wiring Diagrams', description: 'Electrical system diagrams' },
        { icon: '💡', name: 'Component Location', description: 'Find sensors and components' }
    ];

    constructor() { }
}
