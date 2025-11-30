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

    // API-driven Navigation State
    activePill: string = 'All';
    filterTabs: any[] = []; // Dynamic filter tabs from API
    pillFilters: string[] = []; // Computed from filterTabs

    // HUD Data
    hudStats: any[] = [];
    loadingHud = false;

    // Search filter
    searchQuery: string = '';
    showSearchSheet = false; // For FAB search

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

    // Image Lightbox State
    expandedImage: { src: string, alt: string } | null = null;

    expandImage(src: string, alt: string) {
        this.expandedImage = { src, alt };
    }

    closeImage() {
        this.expandedImage = null;
    }

    // Mini 3D car
    private miniScene!: THREE.Scene;
    private miniCamera!: THREE.PerspectiveCamera;
    private miniRenderer!: THREE.WebGLRenderer;
    private miniCarGroup!: THREE.Group;
    private miniFrameId: number = 0;

    // Feature Data
    laborData: any = null;
    dtcData: any[] = [];
    tsbData: any[] = [];
    wiringData: any[] = [];
    componentLocations: any[] = [];

    // New API Data
    maintenanceData: { frequency: any[], indicators: any[], intervals: any[] } = { frequency: [], indicators: [], intervals: [] };
    trackChangeQuarters: any[] = [];
    trackChangeDeltas: any[] = [];
    selectedQuarter: string = '';
    vehicleInfo: any = null;

    // Cyberpunk Features State
    xRayMode = false;
    vectorIllustration: any = null;
    relatedWiring: any = null;
    loadingVector = false;
    loadingRelated = false;

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
                this.vehicleId = vid;
                this.contentSource = params['contentSource'] || 'MOTOR';

                localStorage.setItem('currentVehicle', JSON.stringify({
                    vehicleId: this.vehicleId,
                    contentSource: this.contentSource,
                    year: params['year'],
                    make: params['make'],
                    model: params['model']
                }));

                this.loadVehicleName();
                this.loadArticles();
                this.loadHudData(); // Load HUD stats

                if (aid) {
                    this.loadArticleContent(aid);
                }
            } else {
                const stored = localStorage.getItem('currentVehicle');
                if (stored) {
                    try {
                        const vehicleParams = JSON.parse(stored);
                        if (vehicleParams.vehicleId) {
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

    loadHudData() {
        this.loadingHud = true;
        // Mocking HUD data for now as specific endpoints might return complex structures
        // In a real scenario, we would parse the responses from getSpecifications/getFluids
        // For this demo, we'll simulate some likely useful data

        // Simulate API delay
        setTimeout(() => {
            this.hudStats = [
                { icon: '💧', label: 'Oil', value: '5.7 Qts 0W-20' },
                { icon: '🔧', label: 'Wheels', value: '85 ft/lbs' },
                { icon: '🔋', label: 'Battery', value: 'H6-AGM' },
                { icon: '⚙️', label: 'Spark', value: '.044"' },
                { icon: '❄️', label: 'Coolant', value: 'FL22' }
            ];
            this.loadingHud = false;
        }, 1000);
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

                // Build pill filters from API filterTabs
                this.pillFilters = this.filterTabs
                    .map(tab => tab.name)
                    .filter(name => name); // Filter out any null/undefined names

                // Initialize expanded state for accordions
                this.articles.forEach(a => a.expanded = false);

                this.filterArticlesByPill();
                this.loading = false;

                const aid = this.route.snapshot.queryParams['articleId'];
                if (aid && !this.viewingArticle) {
                    this.viewingArticle = this.articles.find(a => a.id === aid);
                }
            });
    }

    selectPill(pill: string) {
        this.activePill = pill;
        this.error = null;

        // Check if this is a special filter tab that requires dedicated API
        const filterTab = this.filterTabs.find(tab => tab.name === pill);
        const filterTabType = filterTab?.type || filterTab?.filterTabType;

        switch (filterTabType || pill) {
            case 'DTCs':
            case 'Diagnostic Codes':
            case 'Diagnostic Trouble Codes':
                this.loadDtcs();
                break;
            case 'TSBs':
            case 'Service Bulletins':
                this.loadTsbs();
                break;
            case 'Diagrams':
            case 'Wiring':
                this.loadWiring();
                break;
            case 'Labor':
                this.loadLabor();
                break;
            case 'Updates':
                this.loadTrackChanges();
                break;
            case 'Maintenance':
                this.loadMaintenance();
                break;
            default:
                // For other tabs, filter from loaded articles
                this.filterArticlesByPill();
                break;
        }
    }

    loadMaintenance() {
        this.loading = true;

        // Load all maintenance data types in parallel
        // Use forkJoin if available or just nested subscribes for simplicity in this context
        // For now, we'll just load them sequentially or use a simple approach

        this.motorApi.getMaintenanceByFrequency(this.contentSource, this.vehicleId).subscribe(
            (res: any) => this.maintenanceData.frequency = res?.data || []
        );

        this.motorApi.getMaintenanceByIndicators(this.contentSource, this.vehicleId).subscribe(
            (res: any) => this.maintenanceData.indicators = res?.data || []
        );

        // Default to a common interval like 30k miles for initial view
        this.motorApi.getMaintenanceByIntervals(this.contentSource, this.vehicleId, 'Mileage', 30000).subscribe(
            (res: any) => {
                // If filtered by interval, it might return a direct list or wrapped in data
                // Based on other endpoints, let's assume wrapped in data if it follows the pattern
                // or check if it's an array directly.
                this.maintenanceData.intervals = Array.isArray(res) ? res : (res?.data || []);
                this.loading = false;
            },
            (err) => {
                console.error('Error loading maintenance:', err);
                this.loading = false;
            }
        );
    }

    loadTrackChanges() {
        this.loading = true;
        this.motorApi.getTrackChangeQuarters().subscribe(
            (res: any) => {
                // API returns array of strings directly
                this.trackChangeQuarters = Array.isArray(res) ? res : (res?.quarters || []);
                if (this.trackChangeQuarters.length > 0) {
                    this.selectedQuarter = this.trackChangeQuarters[0];
                    this.loadDeltaReport(this.selectedQuarter);
                } else {
                    this.loading = false;
                }
            },
            (err) => {
                console.error('Error loading quarters:', err);
                this.error = 'Failed to load update history.';
                this.loading = false;
            }
        );
    }

    loadDeltaReport(quarter: string) {
        this.loading = true;
        this.selectedQuarter = quarter;
        this.motorApi.getTrackChangeDeltaReport(this.vehicleId, quarter).subscribe(
            (res: any) => {
                this.trackChangeDeltas = res?.changes || [];
                this.loading = false;
            },
            (err) => {
                console.error('Error loading delta report:', err);
                this.loading = false;
            }
        );
    }

    loadVehicleInfo() {
        this.motorApi.getMotorVehicles(this.contentSource, this.vehicleId).subscribe(
            (res: any) => {
                const vehicles = res?.data || [];
                if (vehicles.length > 0) {
                    this.vehicleInfo = vehicles[0]; // Use first match
                }
            }
        );
    }

    loadDtcs() {
        this.loading = true;
        console.log('[DTC] Loading DTCs for vehicle:', this.vehicleId, 'Source:', this.contentSource);

        this.motorApi.getDtcs(this.contentSource, this.vehicleId).subscribe(
            (response: any) => {
                console.log('[DTC] Raw response:', response);
                // Extract dtcs array from response body
                this.dtcData = response?.dtcs || [];
                console.log('[DTC] Extracted DTC count:', this.dtcData.length);

                if (this.dtcData.length === 0) {
                    console.warn('[DTC] No DTCs found in response');
                    this.error = 'No diagnostic trouble codes available for this vehicle.';
                }

                this.loading = false;
            },
            (err: any) => {
                console.error('[DTC] Error loading DTCs:', err);
                console.error('[DTC] Error details:', {
                    status: err.status,
                    message: err.message,
                    error: err.error
                });
                this.error = `Failed to load Diagnostic Trouble Codes: ${err.status || 'Unknown error'}`;
                this.loading = false;
            }
        );
    }

    loadTsbs() {
        this.loading = true;
        this.motorApi.getTsbs(this.contentSource, this.vehicleId).subscribe(
            (response: any) => {
                // Extract tsbs array from response body
                this.tsbData = response?.tsbs || [];
                this.loading = false;
            },
            (err: any) => {
                console.error('Error loading TSBs:', err);
                this.error = 'Failed to load Technical Service Bulletins.';
                this.loading = false;
            }
        );
    }

    loadWiring() {
        this.loading = true;
        this.motorApi.getWiringDiagrams(this.contentSource, this.vehicleId).subscribe(
            (response: any) => {
                // Extract wiringDiagrams array from response body
                this.wiringData = response?.wiringDiagrams || [];
                this.loading = false;
            },
            (err: any) => {
                console.error('Error loading Wiring Diagrams:', err);
                this.error = 'Failed to load Wiring Diagrams.';
                this.loading = false;
            }
        );
    }

    loadLabor() {
        this.loading = true;
        this.motorApi.getLaborTimes(this.contentSource, this.vehicleId).subscribe(
            (response: any) => {
                // Extract labor operations array from response
                this.laborData = response?.laborOperations || response?.operations || [];
                this.loading = false;
            },
            (err: any) => {
                console.error('Error loading Labor Times:', err);
                this.error = 'Failed to load Labor Times.';
                this.loading = false;
            }
        );
    }

    // ============================================================
    // CYBERPUNK FEATURES METHODS
    // ============================================================

    toggleXRayMode(article: any) {
        this.xRayMode = !this.xRayMode;

        if (this.xRayMode && article) {
            this.loadingVector = true;
            // Assuming article has a GroupID or we use a default for demo
            // In a real scenario, we'd get the GroupID from the article metadata
            const groupId = article.groupId || 12345;

            this.motorApi.getVectorIllustrations(this.contentSource, this.vehicleId, groupId).subscribe(
                (data: any) => {
                    // Sanitize SVG content if present
                    if (data && data.svgContent) {
                        data.svgContent = this.sanitizer.bypassSecurityTrustHtml(data.svgContent);
                    }
                    // Handle imageUrl (new backend behavior)
                    if (data && data.imageUrl) {
                        // Ensure URL is absolute if it's a proxy path
                        if (data.imageUrl.startsWith('/')) {
                            data.imageUrl = window.location.origin + data.imageUrl;
                        }
                    }
                    this.vectorIllustration = data;
                    this.loadingVector = false;
                },
                (err) => {
                    console.error('Error loading vector illustration', err);
                    this.loadingVector = false;
                }
            );
        }
    }

    loadRelatedWiring(dtc: any) {
        if (!dtc || !dtc.id) return;

        this.loadingRelated = true;
        this.motorApi.getRelatedWiring(this.contentSource, this.vehicleId, dtc.id).subscribe(
            (data: any) => {
                this.relatedWiring = data;
                this.loadingRelated = false;
            },
            (err) => {
                console.error('Error loading related wiring', err);
                this.loadingRelated = false;
            }
        );
    }

    filterArticlesByPill() {
        if (this.activePill === 'All') {
            this.filteredArticles = this.articles;
        } else {
            // Find the active filter tab to get buckets
            const activeTab = this.filterTabs.find(tab => tab.name === this.activePill);

            if (activeTab && activeTab.buckets) {
                // Filter by buckets in this tab
                const bucketNames = this.getAllBucketNames(activeTab.buckets);
                this.filteredArticles = this.articles.filter(article =>
                    bucketNames.includes(article.bucket)
                );
            } else {
                // Fallback to keyword matching
                const keywords = this.getPillKeywords(this.activePill);
                this.filteredArticles = this.articles.filter(article => {
                    const text = (article.title + ' ' + (article.bucket || '')).toLowerCase();
                    return keywords.some(k => text.includes(k));
                });
            }
        }
    }

    // Helper to get all bucket names recursively
    getAllBucketNames(buckets: any[]): string[] {
        const names: string[] = [];
        for (const bucket of buckets) {
            if (bucket.name) {
                names.push(bucket.name);
            }
            if (bucket.children && bucket.children.length > 0) {
                names.push(...this.getAllBucketNames(bucket.children));
            }
        }
        return names;
    }

    getPillKeywords(pill: string): string[] {
        const map: { [key: string]: string[] } = {
            'Maintenance': ['maintenance', 'service', 'inspect', 'reset'],
            'Brakes': ['brake', 'abs', 'rotor', 'caliper'],
            'Engine': ['engine', 'oil', 'timing', 'belt', 'cooling'],
            'Transmission': ['transmission', 'clutch', 'axle', 'drive'],
            'Electrical': ['electrical', 'battery', 'fuse', 'wiring', 'sensor'],
            'HVAC': ['hvac', 'air conditioning', 'heater', 'compressor'],
            'Suspension': ['suspension', 'steering', 'strut', 'shock', 'alignment'],
            'Body': ['body', 'door', 'glass', 'trim', 'bumper']
        };
        return map[pill] || [];
    }

    toggleAccordion(article: any) {
        article.expanded = !article.expanded;
    }

    toggleSearchSheet() {
        this.showSearchSheet = !this.showSearchSheet;
        if (this.showSearchSheet) {
            setTimeout(() => {
                const input = document.querySelector('.bottom-search-input') as HTMLElement;
                if (input) input.focus();
            }, 100);
        }
    }

    onSearchInput() {
        if (!this.searchQuery.trim()) {
            this.filterArticlesByPill();
        } else {
            const query = this.searchQuery.toLowerCase();
            this.filteredArticles = this.articles.filter(article =>
                article.title?.toLowerCase().includes(query) ||
                article.subtitle?.toLowerCase().includes(query) ||
                article.bucket?.toLowerCase().includes(query)
            );
        }
    }

    viewArticle(article: any) {
        // Update URL to create history entry
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { articleId: article.id },
            queryParamsHandling: 'merge'
        });
        // The subscription to route params will handle loading the content
    }

    viewParts(article: any) {
        this.viewingArticle = article;
        this.loadingArticle = true;
        this.loadingMessage = 'Loading parts...';
        this.articleContent = '';

        this.motorApi.getParts(this.contentSource, this.vehicleId).subscribe(
            (response: any) => {
                const parts = response.body || [];

                // Smart filtering
                const stopWords = ['remove', 'install', 'r&r', 'replace', 'check', 'inspect', 'the', 'a', 'an', 'for', 'of', 'with', 'and', 'to', 'in', 'on', 'at'];
                const titleWords = article.title.toLowerCase().split(/[\s,-]+/)
                    .filter((w: string) => w.length > 2 && !stopWords.includes(w));

                const relevantParts = parts.filter((p: any) => {
                    const desc = (p.description || p.partDescription || p.name || '').toLowerCase();
                    return titleWords.some((w: string) => desc.includes(w));
                });

                // If we found relevant parts, show them. Otherwise show all but with a notice.
                const displayParts = relevantParts.length > 0 ? relevantParts : parts;
                const title = relevantParts.length > 0 ? `Recommended Parts for ${article.title}` : `All Parts (No specific matches found)`;

                if (displayParts.length === 0) {
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml('<div class="empty-state"><i class="fas fa-cogs"></i><p>No parts found for this vehicle.</p></div>');
                    this.loadingArticle = false;
                    return;
                }

                let html = `
                    <div class="parts-container">
                        <h2>${title}</h2>
                        <table class="cyber-table">
                            <thead>
                                <tr>
                                    <th>Part Number</th>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                displayParts.forEach((part: any) => {
                    // Handle potential missing description fields
                    const description = part.description || part.partDescription || part.name || 'N/A';

                    html += `
                        <tr>
                            <td><span class="part-num">${part.partNumber}</span></td>
                            <td>${description}</td>
                            <td>${part.price || 'N/A'}</td>
                            <td>${part.quantity || 1}</td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;

                this.articleContent = this.sanitizer.bypassSecurityTrustHtml(html);
                this.loadingArticle = false;
            },
            (err) => {
                console.error('Error loading parts:', err);
                this.articleContent = this.sanitizer.bypassSecurityTrustHtml('<div class="error-state"><p>Failed to load parts list.</p></div>');
                this.loadingArticle = false;
            }
        );
    }

    locateComponent(article: any) {
        this.viewingArticle = article;
        this.loadingArticle = true;
        this.loadingMessage = 'Loading component locations...';
        this.articleContent = '';

        console.log('DocsComponent: Requesting component locations for vehicle:', this.vehicleId);
        this.motorApi.getComponentLocationsV3(this.contentSource, this.vehicleId).subscribe(
            (response: any) => {
                // API V3 returns { componentLocations: [...] }
                const locations = response?.componentLocations || response || [];

                // Filter locations relevant to the current article
                const stopWords = ['remove', 'install', 'r&r', 'replace', 'check', 'inspect', 'the', 'a', 'an', 'for', 'of', 'with', 'and', 'to', 'in', 'on', 'at', 'assembly', 'system'];
                const searchTerms = article.title.toLowerCase().split(/[\s,-]+/)
                    .filter((w: string) => w.length > 2 && !stopWords.includes(w));

                const relevantLocations = Array.isArray(locations) ? locations.filter((loc: any) => {
                    const text = (loc.title || loc.description || loc.name || '').toLowerCase();
                    return searchTerms.some((term: string) => text.includes(term));
                }) : [];

                const displayLocations = relevantLocations.length > 0 ? relevantLocations : locations;
                const title = relevantLocations.length > 0 ? `Locations for ${article.title}` : `All Component Locations`;

                if (displayLocations.length === 0) {
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(`
                        <div class="error-state">
                            <i class="fas fa-map-marker-alt"></i>
                            <p>No component locations found.</p>
                        </div>
                    `);
                    this.loadingArticle = false;
                    return;
                }

                let html = `
                    <div class="locations-container cyberpunk-locations">
                        <h3><i class="fas fa-map-marked-alt"></i> ${title}</h3>
                        <div class="locations-grid">
                `;

                displayLocations.forEach((loc: any) => {
                    html += `
                        <div class="location-card">
                            <h3>${loc.title || 'Unknown Component'}</h3>
                            <p>${loc.subtitle || ''}</p>
                            ${loc.thumbnailHref ? `<img src="/${loc.thumbnailHref}" alt="${loc.title}" style="margin-top: 10px; border-radius: 4px; width: 100%; max-width: 240px;">` : ''}
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;

                this.articleContent = this.sanitizer.bypassSecurityTrustHtml(html);
                this.loadingArticle = false;
            },
            (err: any) => {
                console.error('Error loading locations:', err);
                this.articleContent = this.sanitizer.bypassSecurityTrustHtml(`
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load component locations.</p>
                    </div>
                `);
                this.loadingArticle = false;
            }
        );
    }

    // 3. Render results




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

                if (response && response.pdf) {
                    this.laborData = null;
                    const pdfHtml = this.createPdfViewerHtml(response.pdf, response.documentId);
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(pdfHtml);
                    this.loadingArticle = false;
                } else if (articleId.startsWith('L:') && response && response.mainOperation) {
                    this.laborData = response;
                    this.articleContent = '';
                    this.loadingArticle = false;
                } else if (response && response.html) {
                    this.laborData = null;
                    this.originalArticleHtml = response.html;
                    const transformedHtml = this.transformArticleHtml(response.html);
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(transformedHtml);
                    this.loadingArticle = false;
                } else if (typeof response === 'string') {
                    this.laborData = null;
                    this.originalArticleHtml = response;
                    const transformedHtml = this.transformArticleHtml(response);
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml(transformedHtml);
                    this.loadingArticle = false;
                } else {
                    this.laborData = null;
                    this.articleContent = this.sanitizer.bypassSecurityTrustHtml('<p>Unable to display this article format.</p>');
                    this.loadingArticle = false;
                }
            });
    }

    createPdfViewerHtml(base64Pdf: string, documentId: string): string {
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
                       < a href = "${pdfDataUri}" download = "document-${documentId}.pdf" > Download the PDF </a> instead.
    </p>
    </iframe>
    </div>
        `;
    }

    transformArticleHtml(html: string): string {
        // Replace <mtr-image-link>
        html = html.replace(/<mtr-image-link id='(.*?)'([^>]*)>([^<]*)<\/mtr-image-link>/g, ($0, id: string, extraAttributes: string, text: string) => {
            return `< span class='image-hover' > ${text} <img src='/api/motor-proxy/api/source/${this.contentSource}/graphic/${id}'${extraAttributes} loading = 'lazy' > </span>`;
        });

        // Replace <mtr-image> (single quotes)
        html = html.replace(/<mtr-image id='(.*?)'([^>]*)><\/mtr-image>/g, ($0, id: string, extraAttributes: string) => {
            return `<img src='/api/motor-proxy/api/source/${this.contentSource}/graphic/${id}'${extraAttributes}>`;
        });

        // Replace <mtr-image> (double quotes)
        html = html.replace(/<mtr-image id="(.*?)"([^>]*)><\/mtr-image>/g, ($0, id: string, extraAttributes: string) => {
            return `<img src='/api/motor-proxy/api/source/${this.contentSource}/graphic/${id}'${extraAttributes}>`;
        });

        // Remove inline styles that conflict with dark theme or responsiveness
        html = html.replace(/color:\s*black/gi, '');
        html = html.replace(/background-color:\s*white/gi, '');
        html = html.replace(/background:\s*white/gi, '');

        // Remove fixed widths
        html = html.replace(/width:\s*\d+px/gi, '');
        html = html.replace(/width="\d+"/gi, '');

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

        // Fix Figure Links
        const internalLinks = doc.querySelectorAll('span.internal-link');
        internalLinks.forEach(span => {
            const id = span.getAttribute('id');
            if (id) {
                const anchor = doc.createElement('a');
                anchor.className = 'internal-link scroll-to-figure';
                anchor.setAttribute('data-target-id', id);
                anchor.innerHTML = span.innerHTML;
                span.replaceWith(anchor);
            }
        });

        // Programmatic Thumbnailing
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            if (img.parentElement?.tagName === 'FIGURE') return;
            if (img.classList.contains('burret_img') || img.closest('.button_webout_print') || img.closest('.buret')) return;

            const width = parseInt(img.getAttribute('width') || '0', 10);
            const height = parseInt(img.getAttribute('height') || '0', 10);
            const styleWidth = img.style.width ? parseInt(img.style.width, 10) : 0;
            const styleHeight = img.style.height ? parseInt(img.style.height, 10) : 0;

            if ((width > 0 && width < 50) || (height > 0 && height < 50) ||
                (styleWidth > 0 && styleWidth < 50) || (styleHeight > 0 && styleHeight < 50)) {
                return;
            }

            const figure = doc.createElement('figure');
            figure.className = 'thumbnail';

            // Convert thumbnail URL to full-resolution URL
            // Common patterns: /thumbnail/ -> /image/, /resize/ -> /image/, or remove size parameters
            let fullResUrl = img.src;
            fullResUrl = fullResUrl.replace('/thumbnail/', '/image/');
            fullResUrl = fullResUrl.replace('/thumbnails/', '/images/');
            fullResUrl = fullResUrl.replace('/resize/', '/image/');
            fullResUrl = fullResUrl.replace('/resized/', '/images/');
            // Remove size parameters like ?width=200 or ?size=small
            fullResUrl = fullResUrl.replace(/[?&](width|height|size|w|h)=[^&]*/gi, '');
            fullResUrl = fullResUrl.replace(/\?&/, '?').replace(/\?$/, '');

            // Store full-resolution URL for expansion
            figure.setAttribute('data-expand-src', fullResUrl);
            figure.setAttribute('data-expand-alt', img.alt || 'Article Image');

            const imgClone = img.cloneNode(true) as HTMLImageElement;
            const figcaption = doc.createElement('figcaption');
            figcaption.textContent = 'Click to enlarge';
            figure.appendChild(imgClone);
            figure.appendChild(figcaption);
            img.replaceWith(figure);
        });

        html = doc.body.innerHTML;
        return html;
    }

    handleArticleClick(event: MouseEvent) {
        const target = event.target as HTMLElement;

        // Handle Image Expansion
        const thumbnail = target.closest('.thumbnail');
        if (thumbnail) {
            const src = thumbnail.getAttribute('data-expand-src');
            const alt = thumbnail.getAttribute('data-expand-alt');
            if (src) {
                this.expandImage(src, alt || '');
                return;
            }
        }

        // Handle Internal Links
        const link = target.closest('.scroll-to-figure');
        if (link) {
            event.preventDefault();
            const targetId = link.getAttribute('data-target-id');
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetElement.classList.add('highlight-target');
                    setTimeout(() => targetElement.classList.remove('highlight-target'), 2000);
                }
            }
        }
    }

    closeArticle() {
        this.viewingArticle = null;
        this.articleContent = '';
        // Clear query param to update history
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { articleId: null },
            queryParamsHandling: 'merge'
        });
    }

    async toggleAiEnhancement() {
        if (!this.aiEnhanced && !this.enhancedArticleHtml) {
            await this.enhanceArticle();
        }
        this.aiEnhanced = !this.aiEnhanced;
        const html = this.aiEnhanced ? this.enhancedArticleHtml : this.originalArticleHtml;
        this.articleContent = this.sanitizer.bypassSecurityTrustHtml(html);
    }

    async enhanceArticle() {
        this.enhancing = true;
        try {
            const response = await this.http.post<{ enhancedHtml: string }>(
                '/api/motor-proxy/api/enhance-article',
                {
                    html: this.originalArticleHtml,
                    contentSource: this.contentSource,
                    vehicleId: this.vehicleId,
                    articleId: this.viewingArticle?.id
                }
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
        this.miniCarGroup.position.y = 0.8;
        this.miniScene.add(this.miniCarGroup);

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('assets/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('assets/ferrari.glb', (gltf) => {
            const carModel = gltf.scene;
            const bodyLineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
            const trimLineMat = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 1.0 });
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
