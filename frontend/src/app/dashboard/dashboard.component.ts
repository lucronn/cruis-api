import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MotorApiService } from '../services/motor-api.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

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
    @ViewChild('rendererContainer') rendererContainer!: ElementRef;

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

    // Three.js
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private frameId: number = 0;
    private particles!: THREE.Points;
    private carGroup!: THREE.Group;
    private cursorGlow!: THREE.Mesh;
    private mouseX: number = 0;
    private mouseY: number = 0;

    // Animation state
    private parts: { mesh: THREE.Object3D, startPos: THREE.Vector3, targetPos: THREE.Vector3, startRot: THREE.Euler, targetRot: THREE.Euler }[] = [];
    private animationStartTime: number = 0;
    private isBuilt = false;

    // Vehicle Selector State
    selectorActive = false;
    step: 'year' | 'make' | 'model' | 'engine' = 'year';
    selectedYear: string | null = null;
    selectedMake: string | null = null;
    selectedModel: string | null = null;
    selectedEngine: string | null = null;
    selectedContentSource: string = 'MOTOR';

    years: any[] = [];
    makes: any[] = [];
    models: any[] = [];
    engines: any[] = [];
    selectorLoading = false;
    selectorError: string | null = null;
    searchQuery: string = '';
    filteredYears: any[] = [];
    filteredMakes: any[] = [];
    filteredModels: any[] = [];

    constructor(
        private router: Router,
        private motorApi: MotorApiService
    ) { }

    ngOnInit() {
        this.loadRecentVehicles();
        this.animateMetrics();
        this.loadYears();
    }

    toggleSelector() {
        this.selectorActive = !this.selectorActive;
        if (this.selectorActive && this.years.length === 0) {
            this.loadYears();
        }
    }

    loadYears() {
        const currentYear = new Date().getFullYear();
        const yearList = [];
        for (let year = currentYear; year >= 1990; year--) {
            yearList.push({
                id: year.toString(),
                label: year.toString()
            });
        }
        this.years = yearList;
        this.filteredYears = yearList;
    }

    onSearchInput() {
        const query = this.searchQuery.toLowerCase();
        if (this.step === 'year') {
            this.filteredYears = this.years.filter(y => y.label.toLowerCase().includes(query));
        } else if (this.step === 'make') {
            this.filteredMakes = this.makes.filter(m => m.label.toLowerCase().includes(query));
        } else if (this.step === 'model') {
            this.filteredModels = this.models.filter(m => m.label.toLowerCase().includes(query));
        }
    }

    selectYear(year: any) {
        this.selectedYear = year.label;
        this.step = 'make';
        this.loadMakes(parseInt(year.id));
    }

    loadMakes(year: number) {
        this.selectorLoading = true;
        this.selectorError = null;

        this.motorApi.getMakes(year).subscribe({
            next: (response) => {
                if (response.body && Array.isArray(response.body)) {
                    this.makes = response.body
                        .map(m => ({ id: m.makeName, label: m.makeName }))
                        .sort((a, b) => a.label.localeCompare(b.label));
                    this.filteredMakes = this.makes;
                }
                this.selectorLoading = false;
                this.searchQuery = '';
            },
            error: (err) => {
                console.error('Error loading makes:', err);
                this.selectorError = 'Unable to load makes.';
                this.selectorLoading = false;
            }
        });
    }

    selectMake(make: any) {
        this.selectedMake = make.label;
        this.step = 'model';
        this.loadModels(parseInt(this.selectedYear!), make.label);
    }

    loadModels(year: number, make: string) {
        this.selectorLoading = true;
        this.selectorError = null;

        this.motorApi.getModels(year, make).subscribe({
            next: (response) => {
                if (response.body?.contentSource) {
                    this.selectedContentSource = response.body.contentSource;
                }
                const models = response.body?.models || [];
                this.models = models.map(m => ({
                    id: m.id,
                    label: m.model,
                    engines: m.engines || []
                }));
                this.filteredModels = this.models;
                this.selectorLoading = false;
                this.searchQuery = '';
            },
            error: (err) => {
                console.error('Error loading models:', err);
                this.selectorError = 'Unable to load models.';
                this.selectorLoading = false;
            }
        });
    }

    selectModel(model: any) {
        this.selectedModel = model.label;
        if (model.engines && model.engines.length > 1) {
            this.engines = model.engines;
            this.step = 'engine';
        } else if (model.engines && model.engines.length === 1) {
            this.navigateToVehicle(model.engines[0].id, model);
        } else {
            this.navigateToVehicle(model.id, model);
        }
    }

    selectEngine(engine: any) {
        this.selectedEngine = engine.name;
        const currentModel = this.models.find(m => m.id === this.selectedModel);
        this.navigateToVehicle(engine.id, currentModel!);
    }

    goBack() {
        if (this.step === 'engine') {
            this.step = 'model';
            this.selectedEngine = null;
        } else if (this.step === 'model') {
            this.step = 'make';
            this.selectedModel = null;
        } else if (this.step === 'make') {
            this.step = 'year';
            this.selectedMake = null;
        } else {
            this.selectorActive = false;
        }
    }

    navigateToVehicle(vehicleOrId: RecentVehicle | string, modelOption?: any) {
        if (typeof vehicleOrId === 'string') {
            const vehicleId = vehicleOrId;

            const vehicle = {
                id: Date.now(),
                vehicleId: vehicleId,
                vehicleName: `${this.selectedYear} ${this.selectedMake} ${this.selectedModel}`,
                year: this.selectedYear,
                make: this.selectedMake,
                model: this.selectedModel
            };
            this.saveToRecentVehicles(vehicle);

            const vehicleParams = {
                year: this.selectedYear,
                make: this.selectedMake,
                model: this.selectedModel,
                vehicleId: vehicleId,
                contentSource: this.selectedContentSource
            };
            localStorage.setItem('currentVehicle', JSON.stringify(vehicleParams));

            this.router.navigate(['/docs'], { queryParams: vehicleParams });

        } else {
            const vehicle = vehicleOrId;
            if (vehicle.vehicleId) {
                this.router.navigate(['/docs'], {
                    queryParams: {
                        vehicleId: vehicle.vehicleId,
                        contentSource: 'Motor'
                    }
                });
            }
        }
    }

    saveToRecentVehicles(vehicle: any) {
        const stored = sessionStorage.getItem('selectedVehicles');
        let vehicles = [];
        if (stored) {
            try { vehicles = JSON.parse(stored); } catch (e) { }
        }
        vehicles = vehicles.filter((v: any) => v.vehicleId !== vehicle.vehicleId);
        vehicles.unshift(vehicle);
        vehicles = vehicles.slice(0, 10);
        sessionStorage.setItem('selectedVehicles', JSON.stringify(vehicles));
    }

    formatNumber(value: number): string {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    }

    ngAfterViewInit() {
        this.initThreeJs();
        this.animationStartTime = Date.now();
        this.animate();
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
        const stored = sessionStorage.getItem('selectedVehicles');
        if (stored) {
            try {
                const vehicles = JSON.parse(stored) as RecentVehicle[];
                this.recentVehicles = vehicles.slice(0, 3);
            } catch (e) {
                console.error('Error parsing recent vehicles:', e);
            }
        }
        this.loading = false;
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

    initThreeJs() {
        const width = this.rendererContainer.nativeElement.clientWidth;
        const height = this.rendererContainer.nativeElement.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;
        this.camera.position.y = 2;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

        this.carGroup = new THREE.Group();
        this.scene.add(this.carGroup);

        // Reflective Floor
        const geometry = new THREE.PlaneGeometry(500, 500);
        const groundMirror = new Reflector(geometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x111111
        });
        groundMirror.position.y = -2.2;
        groundMirror.rotateX(-Math.PI / 2);
        this.scene.add(groundMirror);

        // Load Ferrari Model  
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('assets/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('assets/ferrari.glb', (gltf) => {
            const carModel = gltf.scene;

            // Primary body material - metallic with subtle cyan
            const bodyMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x88ddff,
                metalness: 0.9,
                roughness: 0.25,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                emissive: 0x003344,
                emissiveIntensity: 0.6
            });

            // Purple glowing trim material
            const trimMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x8800ff,
                metalness: 0.9,
                roughness: 0.2,
                emissive: 0x6600cc,
                emissiveIntensity: 2.0
            });

            // Chrome/metallic details
            const chromeMaterial = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                metalness: 1.0,
                roughness: 0.1
            });

            // Glass material
            const glassMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x88ccff,
                metalness: 0.1,
                roughness: 0.05,
                transmission: 0.9,
                transparent: true,
                opacity: 0.3
            });

            // Wheel/tire material
            const wheelMaterial = new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.8,
                roughness: 0.4
            });

            carModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const name = mesh.name.toLowerCase();

                    // Apply different materials based on mesh name
                    if (name.includes('glass') || name.includes('window')) {
                        mesh.material = glassMaterial;
                    } else if (name.includes('wheel') || name.includes('tire') || name.includes('rim')) {
                        mesh.material = wheelMaterial;
                    } else if (name.includes('trim') || name.includes('grille') || name.includes('exhaust') || name.includes('badge')) {
                        mesh.material = trimMaterial; // Purple glow trim
                    } else if (name.includes('chrome') || name.includes('mirror')) {
                        mesh.material = chromeMaterial;
                    } else {
                        // Default body material
                        mesh.material = bodyMaterial;
                    }

                    const targetPos = mesh.position.clone();
                    const targetRot = mesh.rotation.clone();

                    const explosionFactor = 15;
                    const startPos = new THREE.Vector3(
                        (Math.random() - 0.5) * explosionFactor,
                        (Math.random() - 0.5) * explosionFactor + 5,
                        (Math.random() - 0.5) * explosionFactor
                    );

                    const startRot = new THREE.Euler(
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2
                    );
                    mesh.position.copy(startPos);
                    mesh.rotation.copy(startRot);

                    this.parts.push({ mesh, startPos, targetPos, startRot, targetRot });
                }
            });

            this.carGroup.add(carModel);
            this.carGroup.rotation.y = -Math.PI / 4;
        }, undefined, (error) => {
            console.error('An error happened loading the car model:', error);
        });

        // Particles
        const particlesGeo = new THREE.BufferGeometry();
        const particleCount = 1000;
        const posArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
        }

        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMat = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.3
        });

        this.particles = new THREE.Points(particlesGeo, particlesMat);
        this.scene.add(this.particles);

        // Lights - Dramatically Increased
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 5);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xffffff, 5);
        pointLight2.position.set(-10, 10, -10);
        this.scene.add(pointLight2);

        const spotLight = new THREE.SpotLight(0xffffff, 20);
        spotLight.position.set(0, 20, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.3;
        this.scene.add(spotLight);

        const rimLight = new THREE.SpotLight(0x00f3ff, 25);
        rimLight.position.set(-10, 5, -10);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 3);
        frontLight.position.set(0, 5, 10);
        this.scene.add(frontLight);

        // Cursor-interactive glow orb
        const glowGeo = new THREE.SphereGeometry(3, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x6600cc,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        this.cursorGlow = new THREE.Mesh(glowGeo, glowMat);
        this.cursorGlow.position.z = -5;
        this.scene.add(this.cursorGlow);

        // Mouse tracking
        window.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', () => {
            const newWidth = this.rendererContainer.nativeElement.clientWidth;
            const newHeight = this.rendererContainer.nativeElement.clientHeight;
            this.renderer.setSize(newWidth, newHeight);
            this.camera.aspect = newWidth / newHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    animate() {
        this.frameId = requestAnimationFrame(() => this.animate());

        const now = Date.now();
        const elapsed = now - this.animationStartTime;
        const buildDuration = 3500;

        if (elapsed < buildDuration) {
            const progress = elapsed / buildDuration;
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            this.parts.forEach(part => {
                part.mesh.position.lerpVectors(part.startPos, part.targetPos, ease);
                part.mesh.rotation.x = part.startRot.x + (part.targetRot.x - part.startRot.x) * ease;
                part.mesh.rotation.y = part.startRot.y + (part.targetRot.y - part.startRot.y) * ease;
                part.mesh.rotation.z = part.startRot.z + (part.targetRot.z - part.startRot.z) * ease;
            });
        } else if (!this.isBuilt && this.parts.length > 0) {
            this.parts.forEach(part => {
                part.mesh.position.copy(part.targetPos);
                part.mesh.rotation.copy(part.targetRot);
            });
            this.isBuilt = true;
        }

        if (this.isBuilt) {
            this.carGroup.rotation.y += 0.002;
        } else {
            this.carGroup.rotation.y += 0.001;
        }
        // Rotate particles
        this.particles.rotation.y -= 0.001;

        // Update cursor glow position
        if (this.cursorGlow) {
            this.cursorGlow.position.x = this.mouseX * 10;
            this.cursorGlow.position.y = this.mouseY * 10;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
