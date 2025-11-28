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

    // New Navigation State
    activePill: string = 'All';
    pillFilters: string[] = ['All', 'Maintenance', 'Brakes', 'Engine', 'Transmission', 'Electrical', 'HVAC', 'Suspension', 'Body'];

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

    // Mini 3D car
    private miniScene!: THREE.Scene;
    private miniCamera!: THREE.PerspectiveCamera;
    private miniRenderer!: THREE.WebGLRenderer;
    private miniCarGroup!: THREE.Group;
    private miniFrameId: number = 0;
    // Labor Data
    laborData: any = null;

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
        this.filterArticlesByPill();
    }

    filterArticlesByPill() {
        if (this.activePill === 'All') {
            this.filteredArticles = this.articles;
        } else {
            // Simple keyword matching for the pill categories
            const keywords = this.getPillKeywords(this.activePill);
            this.filteredArticles = this.articles.filter(article => {
                const text = (article.title + ' ' + (article.bucket || '')).toLowerCase();
                return keywords.some(k => text.includes(k));
            });
        }
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
                       <a href="${pdfDataUri}" download="document-${documentId}.pdf">Download the PDF</a> instead.
                    </p>
                </iframe>
            </div>
        `;
    }

    transformArticleHtml(html: string): string {
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
            figure.setAttribute('onclick', "this.classList.toggle('expanded')");
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
