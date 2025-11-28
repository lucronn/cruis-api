import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MotorApiService } from '../services/motor-api.service';
import { catchError, switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

interface ArticleCategory {
    name: string;
    articles: any[];
    expanded: boolean;
    count: number;
    subCategories?: { name: string; articles: any[] }[];
}

@Component({
    selector: 'app-docs',
    templateUrl: './docs.component.html',
    styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('miniCarContainer') miniCarContainer!: ElementRef;
    vehicleId: string = '';
    contentSource: string = 'MOTOR';
    vehicleName: string = '';

    articles: any[] = [];
    filteredArticles: any[] = [];
    categories: ArticleCategory[] = [];
    filterTabs: any[] = []; // Keep for bucket structure
    selectedCategory: ArticleCategory | null = null; // Selected category from sidebar
    selectedSubCategory: { name: string; articles: any[] } | null = null; // Selected sub-category

    // Search filter
    searchQuery: string = '';

    // Article viewing
    viewingArticle: any = null;
    articleContent: SafeHtml = '';
    loadingArticle = false;
    loadingMessage = 'Loading article...';

    // AI enhancement toggle
    aiEnhanced = false;
    enhancing = false;
    originalArticleHtml: string = '';
    enhancedArticleHtml: string = '';

    loading = true;
    loadingName = true;
    error: string = '';

    // Mini 3D car
    private miniScene!: THREE.Scene;
    private miniCamera!: THREE.PerspectiveCamera;
    private miniRenderer!: THREE.WebGLRenderer;
    private miniCarGroup!: THREE.Group;
    private miniFrameId: number = 0;
    // Labor Data
    laborData: any = null;

    // Maintenance Schedule properties
    maintenanceSchedule = {
        interval: null as number | null,
        intervalType: 'Miles' as string,
        severity: 'Normal' as string,
        searching: false,
        searchCompleted: false,
        results: {
            byInterval: [] as any[],
            byFrequency: {} as { [key: string]: any[] },
            byIndicator: [] as any[]
        }
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private motorApi: MotorApiService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const vid = params['vehicleId'];
            const aid = params['articleId'];

            if (vid) {
                // Loaded from URL - update state
                this.vehicleId = vid;
                this.contentSource = params['contentSource'] || 'MOTOR';

                // Persist this session
                localStorage.setItem('currentVehicle', JSON.stringify({
                    vehicleId: this.vehicleId,
                    contentSource: this.contentSource,
                    year: params['year'],
                    make: params['make'],
                    model: params['model']
                }));

                this.loadVehicleName();
                this.loadArticles();

                // If article ID is present, load it
                if (aid) {
                    // We need to wait for articles to load to find the article object? 
                    // Or just load content directly? Loading content directly is faster.
                    // But we might want the article metadata (title etc) for the view.
                    // For now, let's just load the content.
                    this.loadArticleContent(aid);
                    // We can also try to find the article object in the list once loaded
                }
            } else {
                // No params - check storage
                const stored = localStorage.getItem('currentVehicle');
                if (stored) {
                    try {
                        const vehicleParams = JSON.parse(stored);
                        if (vehicleParams.vehicleId) {
                            // Redirect to self with params
                            this.router.navigate([], {
                                relativeTo: this.route,
                                queryParams: vehicleParams,
                                replaceUrl: true
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing stored vehicle session', e);
                    }
                } else {
                    // No session - redirect to selector
                    this.router.navigate(['/vehicles']);
                }
            }
        });
    }

    loadVehicleName() {
        this.loadingName = true;
        this.motorApi.getVehicleName(this.contentSource, this.vehicleId)
            .pipe(
                catchError(err => {
                    console.error('Error loading vehicle name:', err);
                    return of({ body: 'Unknown Vehicle' });
                })
            )
            .subscribe(response => {
                this.vehicleName = response.body || 'Unknown Vehicle';
                this.loadingName = false;
            });
    }

    loadArticles(searchTerm: string = '') {
        this.loading = true;
        this.error = null;

        this.motorApi.getArticles(this.contentSource, this.vehicleId, searchTerm)
            .pipe(
                catchError(err => {
                    console.error('Error loading articles:', err);
                    this.error = 'Failed to load articles. Please try again.';
                    return of({ body: { articleDetails: [], filterTabs: [] } });
                })
            )
            .subscribe(response => {
                this.articles = response.body?.articleDetails || [];
                this.filterTabs = response.body?.filterTabs || [];

                // Group articles by category
                this.groupArticlesByCategory();

                this.loading = false;

                // If we loaded an article content directly from URL, try to match it here
                // to set the viewingArticle object (for title, etc)
                const aid = this.route.snapshot.queryParams['articleId'];
                if (aid && !this.viewingArticle) {
                    this.viewingArticle = this.articles.find(a => a.id === aid);
                }
            });
    }

    groupArticlesByCategory() {
        const categoryMap = new Map<string, any[]>();

        this.articles.forEach(article => {
            const category = article.parentBucket || article.bucket || 'Other';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category)!.push(article);
        });

        this.categories = Array.from(categoryMap.entries()).map(([name, articles]) => {
            const category: ArticleCategory = {
                name,
                articles,
                expanded: false,
                count: articles.length
            };

            // Apply smart categorization to categories with many articles
            if (articles.length > 15) {
                category.subCategories = this.categorizeArticles(name, articles);
            }

            return category;
        });

        // Sort categories alphabetically
        this.categories.sort((a, b) => a.name.localeCompare(b.name));
    }

    categorizeArticles(categoryName: string, articles: any[]): { name: string; articles: any[] }[] {
        // Define keywords based on category
        const keywordSets: { [category: string]: { [key: string]: RegExp } } = {
            'Labor': {
                'Maintenance': /Inspect|Inspection|Road Test|Reset|Maintenance|Service|Diagnosis|Test/i,
                'Brakes': /Brake|ABS|Disc|Rotor|Caliper/i,
                'Engine': /Engine|Cylinder|Camshaft|Crankshaft|Timing|Oil|Coolant|Cooling|Radiator|Fan|Water Pump|Belt|Pulley|Tensioner|Intake|Manifold|Turbo|Intercooler|Valve|Rocker|Spark Plug|Ignition|Throttle|Connecting Rod|Bearing|Powertrain|Mount/i,
                'Transmission': /Transmission|Trans|Clutch|Differential|Axle|Driveshaft|CV Joint|Universal Joint/i,
                'Suspension & Steering': /Suspension|Steering|Strut|Shock|Control Arm|Lateral Arm|Tie Rod|Wheel|Tire|Rack & Pinion|Stabilizer|Toe|Alignment|Ball Joint|Knuckle/i,
                'Electrical': /Electrical|Battery|Alternator|Starter|Fuse|Relay|Sensor|Module|Lamp|Light|Bulb|Horn|Radio|Window|Switch|Cluster|Camera|Antitheft|Security|Cruise Control|Wiring|Connector/i,
                'HVAC': /HVAC|Air Conditioning|A\/C|Heater|Blower|Compressor|Condenser|Cabin Air Filter|Refrigerant|Evaporator/i,
                'Restraints': /Air Bag|Seat Belt/i,
                'Body': /Door|Hood|Trunk|Bumper|Mirror|Glass|Panel|Seat|Wiper|Washer|Sunroof|Decklid|Latch|Lock|Handle|Console|Headliner|Roof|Pillar|Trim/i,
                'Fuel & Exhaust': /Fuel|Exhaust|Muffler|Catalytic|Emission|EVAP|PCV/i
            },
            'Specifications': {
                'Engine': /Engine|Motor|Displacement|Bore|Stroke|Compression/i,
                'Transmission': /Transmission|Gearbox|Clutch|Final Drive/i,
                'Dimensions': /Weight|Length|Width|Height|Wheelbase|Track|Clearance/i,
                'Capacities': /Capacity|Fuel|Oil|Coolant|Fluid/i,
                'Performance': /Torque|Horsepower|Power|Speed|Acceleration/i,
                'Electrical': /Battery|Alternator|Voltage|Amperage/i
            },
            'Diagrams': {
                'Engine': /Engine|Motor|Cylinder|Valve|Timing/i,
                'Electrical': /Wiring|Circuit|Fuse|Relay|Connector/i,
                'Transmission': /Transmission|Trans|Clutch|Drive/i,
                'Suspension': /Suspension|Steering|Strut|Shock/i,
                'Brakes': /Brake|ABS/i,
                'HVAC': /HVAC|Air Conditioning|Climate/i,
                'Body': /Body|Door|Hood|Trunk|Panel/i
            }
        };

        // Get keywords for this category, fallback to Labor keywords
        const keywords = keywordSets[categoryName] || keywordSets['Labor'];

        const groups: { [key: string]: any[] } = {};
        Object.keys(keywords).forEach(key => groups[key] = []);
        groups['Other'] = [];

        articles.forEach(article => {
            let matched = false;
            for (const [group, regex] of Object.entries(keywords)) {
                if (regex.test(article.title || article.id)) {
                    groups[group].push(article);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                groups['Other'].push(article);
            }
        });

        // Convert to array and filter empty groups
        return Object.entries(groups)
            .filter(([_, items]) => items.length > 0)
            .map(([name, items]) => ({ name, articles: items }));
    }

    toggleCategory(category: ArticleCategory) {
        category.expanded = !category.expanded;
    }

    selectCategory(category: ArticleCategory) {
        if (this.selectedCategory === category) {
            // Toggle expansion if clicking already selected
            category.expanded = !category.expanded;
        } else {
            // Collapse all other categories
            this.categories.forEach(cat => {
                if (cat !== category) {
                    cat.expanded = false;
                }
            });

            // Select new category
            this.selectedCategory = category;
            category.expanded = true;
            this.selectedSubCategory = null; // Reset sub-category
        }
    }

    selectSubCategory(subCategory: { name: string; articles: any[] }, event: Event) {
        event.stopPropagation(); // Prevent triggering parent click
        this.selectedSubCategory = subCategory;
    }

    searchMaintenanceSchedules() {
        if (this.maintenanceSchedule.intervalType !== 'Indicator' && !this.maintenanceSchedule.interval) {
            return; // Validation: interval required for Miles/Kilometers/Months
        }

        this.maintenanceSchedule.searching = true;
        this.maintenanceSchedule.searchCompleted = false;
        this.maintenanceSchedule.results = {
            byInterval: [],
            byFrequency: {},
            byIndicator: []
        };

        const severity = this.maintenanceSchedule.severity;

        if (this.maintenanceSchedule.intervalType === 'Indicator') {
            // Search by indicator
            this.motorApi.getMaintenanceSchedulesByIndicator(this.contentSource, this.vehicleId, severity)
                .subscribe({
                    next: (data) => {
                        this.maintenanceSchedule.results.byIndicator = data || [];
                        this.searchMaintenanceSchedulesByFrequency(severity);
                    },
                    error: (err) => {
                        console.error('Error loading maintenance schedules by indicator:', err);
                        this.maintenanceSchedule.searching = false;
                    }
                });
        } else {
            // Search by interval (Miles/Kilometers/Months)
            this.motorApi.getMaintenanceSchedulesByInterval(
                this.contentSource,
                this.vehicleId,
                this.maintenanceSchedule.intervalType,
                this.maintenanceSchedule.interval!,
                severity
            ).subscribe({
                next: (data) => {
                    this.maintenanceSchedule.results.byInterval = data || [];
                    this.searchMaintenanceSchedulesByFrequency(severity);
                },
                error: (err) => {
                    console.error('Error loading maintenance schedules by interval:', err);
                    this.maintenanceSchedule.searching = false;
                }
            });
        }
    }

    searchMaintenanceSchedulesByFrequency(severity: string) {
        // Search all frequency types
        const frequencies = ['F', 'N', 'R'];
        let completed = 0;

        frequencies.forEach(freq => {
            this.motorApi.getMaintenanceSchedulesByFrequency(this.contentSource, this.vehicleId, freq, severity)
                .subscribe({
                    next: (data) => {
                        if (data && data.length > 0) {
                            this.maintenanceSchedule.results.byFrequency[freq] = data;
                        }
                        completed++;
                        if (completed === frequencies.length) {
                            this.maintenanceSchedule.searching = false;
                            this.maintenanceSchedule.searchCompleted = true;
                        }
                    },
                    error: (err) => {
                        console.error(`Error loading maintenance schedules for frequency ${freq}:`, err);
                        completed++;
                        if (completed === frequencies.length) {
                            this.maintenanceSchedule.searching = false;
                            this.maintenanceSchedule.searchCompleted = true;
                        }
                    }
                });
        });
    }

    viewArticle(article: any) {
        this.viewingArticle = article;
        this.loadArticleContent(article.id);
    }

    loadArticleContent(articleId: string) {
        this.loadingArticle = true;
        this.articleContent = '';
        this.loadingMessage = 'Loading article...';

        this.motorApi.getArticleContent(this.contentSource, this.vehicleId, articleId)
            .pipe(
                catchError(err => {
                    console.error('Error loading article content:', err);
                    return of('<p>Failed to load article content.</p>');
                })
            )
            .subscribe(response => {
                this.loadingMessage = 'Formatting article...';

                // Check if this is a PDF document (e.g., Technical Service Bulletin)
                if (response && response.pdf) {
                    // It's a PDF document
                    this.laborData = null;
                    const pdfHtml = this.createPdfViewerHtml(response.pdf, response.documentId);
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(pdfHtml);
                    this.loadingArticle = false;
                } else if (articleId.startsWith('L:') && response && response.mainOperation) {
                    // It's a Labor Operation (has mainOperation property)
                    this.laborData = response;
                    this.articleContent = ''; // Clear HTML content
                    this.loadingArticle = false;
                } else if (response && response.html) {
                    // It's a standard Article (has html property)
                    this.laborData = null;
                    this.originalArticleHtml = response.html;

                    // Programmatically enhance (no AI)
                    const transformedHtml = this.transformArticleHtml(response.html);

                    // Set content directly
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(transformedHtml);
                    this.loadingArticle = false;
                } else if (typeof response === 'string') {
                    // Fallback: plain HTML string
                    this.laborData = null;
                    this.originalArticleHtml = response;
                    const transformedHtml = this.transformArticleHtml(response);
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(transformedHtml);
                    this.loadingArticle = false;
                } else {
                    // Unknown format
                    console.error('Unknown article format:', response);
                    this.laborData = null;
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml('<p>Unable to display this article format.</p>');
                    this.loadingArticle = false;
                }
            });
    }

    createPdfViewerHtml(base64Pdf: string, documentId: string): string {
        // Create a data URI for the PDF
        const pdfDataUri = `data:application/pdf;base64,${base64Pdf}`;

        return `
            <div class="pdf-viewer">
                <div class="pdf-info">
                    <p>📄 <strong>PDF Document</strong> - Document ID: ${documentId}</p>
                    <a href="${pdfDataUri}" download="document-${documentId}.pdf" class="download-btn">
                        ⬇ Download PDF
                    </a>
                </div>
                <iframe 
                    src="${pdfDataUri}" 
                    width="100%" 
                    height="800px" 
                    style="border: 1px solid rgba(0, 243, 255, 0.3); border-radius: 8px; background: white;"
                    type="application/pdf">
                    <p>Your browser does not support PDF viewing. 
                       <a href="${pdfDataUri}" download="document-${documentId}.pdf">Download the PDF</a> instead.
                    </p>
                </iframe>
            </div>
        `;
    }

    transformArticleHtml(html: string): string {
        // Handle custom <mtr-image> and <mtr-image-link> tags
        // Based on unpackedmaps/main-es/src/app/assets/state/assets.facade.ts

        // Replace <mtr-image-link>
        html = html.replace(/<mtr-image-link id='(.*?)'([^>]*)>([^<]*)<\/mtr-image-link>/g, ($0, id: string, extraAttributes: string, text: string) => {
            return `<span class='image-hover'>${text}<img src='/api/motor-proxy/api/source/${this.contentSource}/graphic/${id}'${extraAttributes} loading='lazy'></span>`;
        });

        // Replace <mtr-image> (single quotes)
        html = html.replace(/<mtr-image id='(.*?)'([^>]*)><\/mtr-image>/g, ($0, id: string, extraAttributes: string) => {
            return `<img src='/api/motor-proxy/api/source/${this.contentSource}/graphic/${id}'${extraAttributes}>`;
        });

        // Replace <mtr-image> (double quotes)
        html = html.replace(/<mtr-image id="(.*?)"([^>]*)><\/mtr-image>/g, ($0, id: string, extraAttributes: string) => {
            return `<img src='/api/motor-proxy/api/source/${this.contentSource}/graphic/${id}'${extraAttributes}>`;
        });

        // Convert non-standard <image> tags to <img> tags
        html = html.replace(/<image\s/gi, '<img ');
        html = html.replace(/<\/image>/gi, '');

        // Replace relative URLs
        html = html.replace(/src=['"]api\//g, 'src="/api/motor-proxy/api/');
        html = html.replace(/src=["']\/api\/motor-proxy\/api\/([^"']+)["']/g, 'src="/api/motor-proxy/api/$1"');
        html = html.replace(/href=['"]api\//g, 'href="/api/motor-proxy/api/');
        html = html.replace(/href=["']\/api\/motor-proxy\/api\/([^"']+)["']/g, 'href="/api/motor-proxy/api/$1"');

        // Clean up messy inline styles - REMOVED to preserve API formatting
        // html = html.replace(/style="[^"]*display:block;[^"]*"/gi, 'style="display:block; max-width:100%; margin:20px auto; text-align:center;"');
        // html = html.replace(/width:\s*500px;?/gi, 'max-width:100%;');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Fix Figure Links: Convert span.internal-link to clickable anchors
        const internalLinks = doc.querySelectorAll('span.internal-link');
        internalLinks.forEach(span => {
            const id = span.getAttribute('id');
            if (id) {
                const anchor = doc.createElement('a');
                anchor.className = 'internal-link scroll-to-figure';
                anchor.setAttribute('data-target-id', id);
                anchor.innerHTML = span.innerHTML;
                // Remove ID from the link to avoid duplicates with the target figure
                // span.removeAttribute('id'); // We are replacing the span, so this is implicit
                span.replaceWith(anchor);
            }
        });

        // Programmatic Thumbnailing - wrap images in clickable thumbnail figures
        // Find all img tags that are NOT already inside a figure.thumbnail
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            // Check if already wrapped in a figure
            if (img.parentElement?.tagName === 'FIGURE') {
                return; // Skip if already in a figure
            }

            // Skip icons and small images
            if (img.classList.contains('burret_img') ||
                img.closest('.button_webout_print') ||
                img.closest('.buret')) {
                return;
            }

            // Skip very small images (likely icons)
            const width = parseInt(img.getAttribute('width') || '0', 10);
            const height = parseInt(img.getAttribute('height') || '0', 10);
            // Check style width/height as well if attributes are missing
            const styleWidth = img.style.width ? parseInt(img.style.width, 10) : 0;
            const styleHeight = img.style.height ? parseInt(img.style.height, 10) : 0;

            if ((width > 0 && width < 50) || (height > 0 && height < 50) ||
                (styleWidth > 0 && styleWidth < 50) || (styleHeight > 0 && styleHeight < 50)) {
                return;
            }

            // Create thumbnail wrapper
            const figure = doc.createElement('figure');
            figure.className = 'thumbnail';
            figure.setAttribute('onclick', "this.classList.toggle('expanded')");

            // Clone the image
            const imgClone = img.cloneNode(true) as HTMLImageElement;

            // Create caption
            const figcaption = doc.createElement('figcaption');
            figcaption.textContent = 'Click to enlarge';

            // Build the figure
            figure.appendChild(imgClone);
            figure.appendChild(figcaption);

            // Replace original img with figure
            img.replaceWith(figure);
        });

        // Get the transformed HTML
        html = doc.body.innerHTML;

        return html;
    }

    handleArticleClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const link = target.closest('.scroll-to-figure');

        if (link) {
            event.preventDefault();
            const targetId = link.getAttribute('data-target-id');
            if (targetId) {
                // Look for the element with this ID within the article content
                // Note: We use querySelector on the document because the ID should be unique in the DOM
                // However, since we might have duplicate IDs if the original HTML was malformed, 
                // we try to find the one that IS NOT the link itself (which we removed the ID from, but just in case)
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Add a highlight effect
                    targetElement.classList.add('highlight-target');
                    setTimeout(() => targetElement.classList.remove('highlight-target'), 2000);
                } else {
                    console.warn(`Target element with ID ${targetId} not found.`);
                }
            }
        }
    }

    closeArticle() {
        this.viewingArticle = null;
        this.articleContent = '';
    }

    async toggleAiEnhancement() {
        if (!this.aiEnhanced && !this.enhancedArticleHtml) {
            // First time enhancing
            await this.enhanceArticle();
        }

        this.aiEnhanced = !this.aiEnhanced;

        // Toggle between original and enhanced
        const html = this.aiEnhanced ? this.enhancedArticleHtml : this.originalArticleHtml;
        this.articleContent = this.sanitizer.bypassSecurityTrustHtml(html);
    }

    async enhanceArticle() {
        this.enhancing = true;

        try {
            const response = await this.http.post<{ enhancedHtml: string }>(
                '/api/motor-proxy/api/enhance-article',
                { html: this.originalArticleHtml }
            ).toPromise();

            if (response && response.enhancedHtml) {
                this.enhancedArticleHtml = this.transformArticleHtml(response.enhancedHtml);
                this.articleContent = this.sanitizer.bypassSecurityTrustHtml(this.enhancedArticleHtml);
                this.aiEnhanced = true;
            }
        } catch (error) {
            console.error('Enhancement failed:', error);
            alert('Failed to enhance article. Please try again.');
        } finally {
            this.enhancing = false;
        }
    }

    // Search functionality
    onSearchChange() {
        if (!this.searchQuery.trim()) {
            // No search query, show all categories
            this.groupArticlesByCategory();
        } else {
            // Filter articles by search query
            const query = this.searchQuery.toLowerCase();
            const filtered = this.articles.filter(article =>
                article.title?.toLowerCase().includes(query) ||
                article.subtitle?.toLowerCase().includes(query) ||
                article.bucket?.toLowerCase().includes(query)
            );

            // Re-group filtered articles
            const categoryMap = new Map<string, any[]>();
            filtered.forEach(article => {
                const category = article.parentBucket || article.bucket || 'Other';
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                categoryMap.get(category)!.push(article);
            });

            this.categories = Array.from(categoryMap.entries()).map(([name, articles]) => ({
                name,
                articles,
                expanded: true, // Auto-expand when searching
                count: articles.length
            }));

            this.categories.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    // Category navigation

    getDisplayArticles(): any[] {
        if (this.selectedCategory) {
            return this.selectedCategory.articles;
        }
        return [];
    }

    collapseAll() {
        this.categories.forEach(cat => cat.expanded = false);
    }

    expandAll() {
        this.categories.forEach(cat => cat.expanded = true);
    }

    getCategoryId(categoryName: string): string {
        return 'category-' + categoryName.replace(/\s+/g, '-');
    }

    changeVehicle() {
        this.router.navigate(['/vehicles']);
    }

    ngAfterViewInit() {
        if (this.miniCarContainer) {
            this.initMiniCar();
        }
    }

    ngOnDestroy() {
        if (this.miniFrameId) {
            cancelAnimationFrame(this.miniFrameId);
        }
        if (this.miniRenderer) {
            this.miniRenderer.dispose();
        }
    }

    initMiniCar() {
        const width = 80;
        const height = 80;

        this.miniScene = new THREE.Scene();
        this.miniCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        this.miniCamera.position.set(3, 2, 3);
        this.miniCamera.lookAt(0, 0, 0);

        this.miniRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.miniRenderer.setSize(width, height);
        this.miniRenderer.setPixelRatio(window.devicePixelRatio);
        this.miniCarContainer.nativeElement.appendChild(this.miniRenderer.domElement);

        this.miniCarGroup = new THREE.Group();
        this.miniCarGroup.position.y = 0.8; // Move up more (was 0.5)
        this.miniScene.add(this.miniCarGroup);

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('assets/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('assets/ferrari.glb', (gltf) => {
            const carModel = gltf.scene;

            // Materials for glowing lines
            const bodyLineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
            const trimLineMat = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 1.0 });

            // Dark solid material
            const solidMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8 });

            carModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const name = mesh.name.toLowerCase();

                    const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
                    let lineMat = bodyLineMat;

                    if (name.includes('trim') || name.includes('grille') || name.includes('badge')) {
                        lineMat = trimLineMat;
                    }

                    const lines = new THREE.LineSegments(edges, lineMat);
                    mesh.add(lines);

                    mesh.material = solidMat;
                }
            });

            carModel.scale.set(0.8, 0.8, 0.8);
            this.miniCarGroup.add(carModel);
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.miniScene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 2);
        pointLight.position.set(5, 5, 5);
        this.miniScene.add(pointLight);

        this.animateMiniCar();
    }

    animateMiniCar() {
        this.miniFrameId = requestAnimationFrame(() => this.animateMiniCar());
        this.miniCarGroup.rotation.y += 0.01;
        this.miniRenderer.render(this.miniScene, this.miniCamera);
    }
}
