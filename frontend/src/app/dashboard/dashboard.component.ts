import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

interface RecentVehicle {
    id: number;
    vehicleId?: string;
    vehicleName?: string;
    year?: string;
    make?: string;
    model?: string;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    animations: [
        trigger('slideOut', [
            transition(':leave', [
                animate('300ms ease-out', style({ transform: 'translateY(-100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('lightBeamContainer') lightBeamContainer!: ElementRef;

    // Three.js for light beam effect
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private frameId: number = 0;
    private lightBeam!: THREE.Mesh;
    private particles!: THREE.Points;
    private carGroup!: THREE.Group;
    private cursorGlow!: THREE.Mesh;
    private mouseX: number = 0;
    private mouseY: number = 0;
    private time: number = 0;

    recentVehicles: RecentVehicle[] = [];
    loading = true;

    // Metrics
    metrics = [
        { label: 'VEHICLES', value: 0, target: 54000, suffix: '+' },
        { label: 'ENGINES', value: 0, target: 8500, suffix: '+' },
        { label: 'PROCEDURES', value: 0, target: 1500000, suffix: '+' },
        { label: 'DIAGRAMS', value: 0, target: 3200000, suffix: '+' },
        { label: 'DTCS', value: 0, target: 48000, suffix: '+' },
        { label: 'PARTS', value: 0, target: 12500000, suffix: '+' }
    ];

    constructor(
        private router: Router
    ) { }

    ngOnInit() {
        this.animateMetrics();
        this.loadRecentVehicles();
    }

    ngAfterViewInit() {
        this.initLightBeam();
    }

    ngOnDestroy() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }

    loadRecentVehicles() {
        try {
            const stored = sessionStorage.getItem('selectedVehicles');
            if (stored) {
                this.recentVehicles = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading recent vehicles', e);
        }
        this.loading = false;
    }

    navigateToVehicle(vehicle: RecentVehicle) {
        // Just navigate to docs with these params
        this.router.navigate(['/docs'], {
            queryParams: {
                vehicleId: vehicle.vehicleId,
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model,
                contentSource: 'MOTOR' // Default
            }
        });
    }

    initLightBeam() {
        if (!this.lightBeamContainer) return;

        const width = this.lightBeamContainer.nativeElement.clientWidth;
        const height = this.lightBeamContainer.nativeElement.clientHeight;

        // Scene setup
        this.scene = new THREE.Scene();
        // Add fog for depth
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.lightBeamContainer.nativeElement.appendChild(this.renderer.domElement);

        // Soft Vertical Light Beam
        // Increased segments to 64 to reduce vertical banding artifacts
        const beamGeometry = new THREE.CylinderGeometry(1, 4, 30, 64, 50, true);
        const beamMaterial = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false, // Prevents z-fighting and hard intersections
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Simplex noise function
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                    + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    float centerDist = length(vUv - vec2(0.5, 0.5));
                    float vertical = vPosition.y / 15.0 + 0.5;
                    
                    // Softer noise-based pulse
                    float noiseVal = snoise(vec2(vPosition.y * 0.2, time * 0.5));
                    float pulse = 0.8 + 0.2 * sin(time * 1.5 + vPosition.y * 0.3) + 0.1 * noiseVal;
                    
                    // Much softer falloff using exponential decay
                    float beam = exp(-centerDist * 8.0) * pulse;
                    
                    // Color gradient
                    vec3 color1 = vec3(0.5, 0.0, 1.0); // Deep Purple
                    vec3 color2 = vec3(0.0, 0.8, 1.0); // Cyan
                    vec3 color3 = vec3(1.0, 1.0, 1.0); // White core
                    
                    vec3 color = mix(color1, color2, vertical * 0.8);
                    color = mix(color, color3, beam * 0.5);
                    
                    // Fade out at top and bottom
                    float alpha = beam * (0.8 - abs(vertical - 0.5) * 1.2);
                    
                    gl_FragColor = vec4(color, alpha * 0.6);
                }
            `
        });

        this.lightBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        this.lightBeam.position.y = 0;
        this.scene.add(this.lightBeam);

        // Plasma Effect (replacing particles)
        const plasmaGeo = new THREE.PlaneGeometry(20, 20, 128, 128);
        const plasmaMat = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(width, height) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vElevation;
                uniform float time;
                
                // Simplex noise function
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                    + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    vUv = uv;
                    
                    vec3 pos = position;
                    
                    // Flowing wave motion
                    float noiseVal = snoise(vec2(pos.x * 0.2 + time * 0.5, pos.y * 0.2 + time * 0.3));
                    float elevation = sin(pos.x * 2.0 + time) * 0.5 + sin(pos.y * 1.5 + time * 0.8) * 0.5;
                    elevation += noiseVal * 1.5;
                    
                    vElevation = elevation;
                    
                    // Curve the plane to wrap slightly
                    pos.z += elevation * 0.5;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    // Plasma color palette
                    vec3 color1 = vec3(0.1, 0.0, 0.3); // Dark Purple
                    vec3 color2 = vec3(0.5, 0.0, 1.0); // Purple
                    vec3 color3 = vec3(0.0, 0.8, 1.0); // Cyan
                    
                    float mixVal = (vElevation + 1.0) * 0.5;
                    vec3 color = mix(color1, color2, mixVal);
                    color = mix(color, color3, smoothstep(0.4, 0.8, mixVal));
                    
                    // Flowing alpha
                    float alpha = smoothstep(0.2, 0.8, mixVal) * 0.4;
                    
                    // Distance fade
                    float dist = length(vUv - 0.5);
                    alpha *= (1.0 - smoothstep(0.0, 0.5, dist));
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        });

        this.particles = new THREE.Mesh(plasmaGeo, plasmaMat) as any; // Using particles var to store plasma mesh for now
        this.particles.rotation.x = -Math.PI / 2;
        this.particles.position.y = -4; // Below car
        this.scene.add(this.particles);

        // Load Ferrari car with Glowing Lines
        this.carGroup = new THREE.Group();
        this.scene.add(this.carGroup);

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('assets/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('assets/ferrari.glb', (gltf) => {
            const carModel = gltf.scene;

            // Materials for glowing lines
            const bodyLineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
            const trimLineMat = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8 });
            const glassLineMat = new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 });

            // Dark solid material to occlude background
            const solidMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 });

            carModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const name = mesh.name.toLowerCase();

                    // Create edges geometry
                    const edges = new THREE.EdgesGeometry(mesh.geometry, 15); // 15 degree threshold
                    let lineMat = bodyLineMat;

                    if (name.includes('glass') || name.includes('window')) {
                        lineMat = glassLineMat;
                    } else if (name.includes('trim') || name.includes('grille') || name.includes('exhaust') || name.includes('badge')) {
                        lineMat = trimLineMat;
                    }

                    const lines = new THREE.LineSegments(edges, lineMat);
                    mesh.add(lines); // Add lines as child of mesh

                    // Set mesh to dark solid
                    mesh.material = solidMat;
                }
            });

            carModel.scale.set(2.5, 2.5, 2.5);
            carModel.position.y = -3.5;
            this.carGroup.add(carModel);
            this.carGroup.rotation.y = -Math.PI / 4;
        });

        // Atmospheric lights
        const ambientLight = new THREE.AmbientLight(0x1a0a3a, 0.5);
        this.scene.add(ambientLight);

        const beamLight = new THREE.PointLight(0x6633ff, 3, 30);
        beamLight.position.set(0, -5, 0);
        this.scene.add(beamLight);

        const topLight = new THREE.PointLight(0xaaaaff, 2, 20);
        topLight.position.set(0, 15, 0);
        this.scene.add(topLight);

        // Handle resize
        window.addEventListener('resize', () => {
            const newWidth = this.lightBeamContainer.nativeElement.clientWidth;
            const newHeight = this.lightBeamContainer.nativeElement.clientHeight;
            this.renderer.setSize(newWidth, newHeight);
            this.camera.aspect = newWidth / newHeight;
            this.camera.updateProjectionMatrix();
        });

        this.animate();
    }

    animate() {
        this.frameId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // Update beam shader uniform
        if (this.lightBeam && (this.lightBeam.material as THREE.ShaderMaterial).uniforms) {
            (this.lightBeam.material as THREE.ShaderMaterial).uniforms.time.value = this.time;
        }

        // Update plasma shader uniform
        if (this.particles && (this.particles as any).material && (this.particles as any).material.uniforms) {
            (this.particles as any).material.uniforms.time.value = this.time;
            // Rotate plasma slowly
            this.particles.rotation.z = this.time * 0.1;
        }

        // Slow rotation
        this.lightBeam.rotation.y += 0.001;

        if (this.carGroup) {
            this.carGroup.rotation.y += 0.002;
        }

        // Update cursor glow position
        if (this.cursorGlow) {
            this.cursorGlow.position.x = this.mouseX * 10;
            this.cursorGlow.position.y = this.mouseY * 10;
        }

        this.renderer.render(this.scene, this.camera);
    }

    formatNumber(value: number): string {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    }

    animateMetrics() {
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;

        this.metrics.forEach(metric => {
            const increment = metric.target / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= metric.target) {
                    metric.value = metric.target;
                    clearInterval(timer);
                } else {
                    metric.value = Math.floor(current);
                }
            }, interval);
        });
    }
}
